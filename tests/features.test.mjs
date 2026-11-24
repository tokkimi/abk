import { test, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createHandler } from "../server/app.mjs";
import { digest } from "../server/security.mjs";
process.env.NODE_ENV = "test";
process.env.AUTH_PROVIDER = "local-test";
process.env.APP_ORIGIN = "http://localhost:3000";
const db = new PGlite(),
  ids = {};
const handler = createHandler(() => ({
  query: (s, a) => db.query(s, a),
  connect: async () => ({ query: (s, a) => db.query(s, a), release() {} }),
}));
async function call(action, body, role = "admin", query = {}) {
  const req = {
      url: "/?" + new URLSearchParams({ action, ...query }),
      method: body ? "POST" : "GET",
      body,
      headers: {
        origin: process.env.APP_ORIGIN,
        "content-type": "application/json",
        "x-csrf-token": role,
        cookie: role ? `abk_session=${role}` : "",
      },
      socket: { remoteAddress: "127.0.0.9" },
    },
    res = {
      setHeader() {},
      status(code) {
        this.code = code;
        return this;
      },
      json(data) {
        this.data = data;
      },
      send(data) {
        this.data = data;
      },
    };
  await handler(req, res);
  return res;
}
after(() => db.close());
test("construction dossier, partner calendar, document messaging and public inbox", async (t) => {
  await db.exec(
    await readFile(new URL("../server/schema.sql", import.meta.url), "utf8"),
  );
  for (const role of ["admin", "client", "contractor"]) {
    ids[role] = randomUUID();
    await db.query(
      "INSERT INTO abk_users(id,name,email,role) VALUES($1,$2,$3,$2)",
      [ids[role], role, `${role}@abk.example`],
    );
    await db.query(
      "INSERT INTO abk_sessions(token_hash,user_id,csrf,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')",
      [digest(role), ids[role], role],
    );
  }
  const customer = (
    await call("client-save", {
      name: "Chantier client",
      email: "client@abk.example",
    })
  ).data.id;
  const payload = {
    client_id: customer,
    title: "Chantier complet",
    category: "renovation",
    status: "active",
    site_details: {
      address: "10 rue de test",
      city: "Exemple",
      latitude: 48.8,
      longitude: 2.3,
      access_notes: "Entrée principale",
      contact_name: "Responsable",
      work_scope: "Rénovation complète",
    },
    internal_notes: "Budget négocié confidentiel",
    budget_cents: 900000,
    start_date: "2026-11-01",
    due_date: "2026-12-01",
  };
  const saved = await call("project-save", payload);
  assert.equal(saved.code, 200);
  const pid = saved.data.id;
  for (const role of ["client", "contractor"])
    assert.equal(
      (await call("member-save", { project_id: pid, user_id: ids[role] })).code,
      200,
    );
  await t.test(
    "private dossier fields are absent from every non-admin project response",
    async () => {
      for (const role of ["client", "contractor"]) {
        const p = (await call("project", null, role, { id: pid })).data.project;
        assert.equal(p.site_details.address, "10 rue de test");
        assert.equal("internal_notes" in p, false);
        assert.equal("budget_cents" in p, false);
        const b = (await call("bootstrap", null, role)).data;
        assert.equal("internal_notes" in b.projects[0], false);
      }
      assert.equal(
        (
          await call("project-save", {
            ...payload,
            site_details: { latitude: 200, longitude: 1 },
          })
        ).code,
        400,
      );
    },
  );
  await t.test(
    "calendar is private, prevents overlaps, and respects revocation",
    async () => {
      const event = {
        contractor_id: ids.contractor,
        project_id: pid,
        title: "Intervention",
        starts_at: "2026-11-02T08:00:00Z",
        ends_at: "2026-11-02T10:00:00Z",
      };
      assert.equal((await call("event-save", event)).code, 200);
      assert.equal((await call("event-save", event)).code, 400);
      assert.equal((await call("calendar", null, "client")).code, 403);
      assert.equal(
        (await call("calendar", null, "contractor", { user_id: ids.admin }))
          .data.rows.length,
        1,
      );
      assert.equal((await call("event-save", event, "contractor")).code, 403);
    },
  );
  await t.test(
    "attachments are scoped to their project and audience; conversations exclude internal notes",
    async () => {
      const bytes = Buffer.from("%PDF-1.4\nInvoice test").toString("base64");
      const privateDoc = (
        await call("document-upload", {
          project_id: pid,
          name: "interne.pdf",
          data: bytes,
          visibility: "internal",
        })
      ).data.id;
      assert.equal(
        (
          await call("message", {
            project_id: pid,
            body: "Ne doit pas partir",
            visibility: "client",
            document_ids: [privateDoc],
          })
        ).code,
        400,
      );
      const doc = (
        await call("document-upload", {
          project_id: pid,
          name: "facture.pdf",
          data: bytes,
          visibility: "client",
        })
      ).data.id;
      assert.equal(
        (
          await call("message", {
            project_id: pid,
            body: "Votre facture",
            visibility: "client",
            document_ids: [doc],
          })
        ).code,
        200,
      );
      await call("message", {
        project_id: pid,
        body: "Note confidentielle",
        visibility: "internal",
      });
      const client = (await call("project", null, "client", { id: pid })).data;
      assert.equal(client.messages.length, 1);
      assert.equal(client.messages[0].attachments[0].name, "facture.pdf");
      const c = (await call("conversations", null, "client")).data.rows[0];
      assert.equal(c.last_body, "Votre facture");
      assert.equal(Number(c.unread), 1);
      await call("conversation-read", { project_id: pid }, "client");
      assert.equal(
        Number(
          (await call("conversations", null, "client")).data.rows[0].unread,
        ),
        0,
      );
      assert.equal(
        (await call("project", null, "contractor", { id: pid })).data.messages
          .length,
        0,
      );
    },
  );
  await t.test(
    "public quote is persisted only after validated consent",
    async () => {
      const quote = {
        name: "Demandeur",
        email: "test@abk.example",
        phone: "",
        content: "Travaux envisagés",
        category: "piscine",
        consent: true,
      };
      assert.equal(
        (await call("quote", { ...quote, consent: false }, null)).code,
        400,
      );
      const r = await call("quote", quote, null);
      assert.equal(r.code, 200);
      assert.ok(r.data.reference);
      assert.equal(
        (
          await db.query("SELECT id FROM abk_requests WHERE id=$1", [
            r.data.reference,
          ])
        ).rows.length,
        1,
      );
    },
  );
  await call("member-revoke", { project_id: pid, user_id: ids.contractor });
  assert.equal(
    (await call("calendar", null, "contractor")).data.rows.length,
    0,
  );
  assert.equal(
    (await call("project", null, "contractor", { id: pid })).code,
    403,
  );
});
