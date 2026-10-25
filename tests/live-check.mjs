// Explicit operator-run verification against the provisioned private ABK backend.
// Credentials are read from an ignored local file and never printed.
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const c = JSON.parse(await readFile(".env.provision.local", "utf8"));
let cookie = "",
  csrf = "";
const created = {};
async function api(action, body, query = {}) {
  const r = await fetch(
    c.APP_ORIGIN + "/api/gestion?" + new URLSearchParams({ action, ...query }),
    {
      method: body ? "POST" : "GET",
      headers: {
        origin: c.APP_ORIGIN,
        "content-type": "application/json",
        cookie,
        "x-csrf-token": csrf,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const sessionCookie = r.headers
    .getSetCookie()
    .find((s) => s.startsWith("abk_session="));
  if (sessionCookie) cookie = sessionCookie.split(";")[0];
  const binary = action === "report-pdf" || action === "document";
  const data = binary ? Buffer.from(await r.arrayBuffer()) : await r.json();
  if (!r.ok)
    throw Error(
      `Live ${action}: ${r.status} ${binary ? "" : data.error || ""}`,
    );
  return data;
}
try {
  await api("login", { email: c.ADMIN_EMAIL, password: c.ADMIN_PASSWORD });
  assert.match(cookie, /^abk_session=/);
  const boot = await api("bootstrap");
  csrf = boot.csrf;
  assert.equal(boot.user.role, "admin");
  created.client = (
    await api("client-save", {
      name: "Vérification technique ABK — à supprimer",
      email: "verification@abk.example",
      phone: "",
      address: "",
      notes: "Test technique sans donnée réelle.",
    })
  ).id;
  created.project = (
    await api("project-save", {
      client_id: created.client,
      title: "Vérification technique ABK — à supprimer",
      category: "renovation",
      status: "planning",
      description: "Test de persistance à supprimer.",
      site_details: {
        address: "Adresse de test",
        work_scope: "Vérification technique",
      },
      internal_notes: "Note technique sans donnée réelle.",
    })
  ).id;
  created.task = (
    await api("task-save", {
      project_id: created.project,
      title: "Vérifier la sauvegarde",
      status: "done",
      visibility: "internal",
    })
  ).id;
  created.document = (
    await api("document-upload", {
      project_id: created.project,
      name: "verification.pdf",
      visibility: "client",
      data: Buffer.from("%PDF-1.4\nTechnical check").toString("base64"),
    })
  ).id;
  created.message = (
    await api("message", {
      project_id: created.project,
      body: "Test de pièce jointe",
      visibility: "client",
      document_ids: [created.document],
    })
  ).id;
  const p = await api("project", null, { id: created.project });
  assert.equal(p.tasks[0].status, "done");
  assert.equal(p.messages[0].attachments[0].id, created.document);
  assert.equal(p.project.site_details.address, "Adresse de test");
  assert.equal(
    (await api("document", null, { id: created.document }))
      .subarray(0, 5)
      .toString(),
    "%PDF-",
  );
  created.invitation = (
    await api("invitation", {
      project_id: created.project,
      name: "Invitation de vérification",
      email: "invitation@abk.example",
      role: "contractor",
      send_email: false,
    })
  ).id;
  created.ledger = (
    await api("ledger-save", {
      project_id: created.project,
      kind: "income",
      state: "paid",
      label: "Vérification technique — à supprimer",
      category: "Test technique",
      date: new Date().toISOString().slice(0, 10),
      net_cents: 100,
      vat_cents: 20,
    })
  ).id;
  const year = new Date().getFullYear(),
    q = { from: `${year}-01-01`, to: `${year}-12-31` };
  const pdf = await api("report-pdf", null, q);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  await api("logout", {});
  console.log(
    "Live verification passed: Supabase login, secure cookie, persistent project/task, invoice attachment, invitation, accounting PDF, logout.",
  );
} finally {
  await writeFile(".env.live-check.local", JSON.stringify(created, null, 2));
  console.log("Verification record IDs saved privately for cleanup.");
}
