import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { createHandler } from "../server/app.mjs";
import { digest, passwordHash } from "../server/security.mjs";
process.env.NODE_ENV = "test";
process.env.AUTH_PROVIDER = "local-test";
process.env.APP_ORIGIN = "http://localhost:3000";
const db = new PGlite(),
  adapter = {
    query: (s, a) => db.query(s, a),
    connect: async () => ({ query: (s, a) => db.query(s, a), release() {} }),
  },
  handler = createHandler(() => adapter);
const ids = Object.fromEntries(
  [
    "admin",
    "client",
    "other",
    "contractor",
    "customer",
    "customer2",
    "project",
    "project2",
  ].map((k) => [k, randomUUID()]),
);
async function request(action, body, user = "admin", query = {}, headers = {}) {
  const req = {
    url: "/?" + new URLSearchParams({ action, ...query }),
    method: body ? "POST" : "GET",
    body,
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-csrf-token": "csrf-" + user,
      cookie: user ? `abk_session=${user}-session` : "",
      ...headers,
    },
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.code = n;
      return this;
    },
    json(d) {
      this.data = d;
    },
    send(d) {
      this.data = d;
    },
  };
  await handler(req, res);
  return res;
}
before(async () => {
  await db.exec(
    await readFile(new URL("../server/schema.sql", import.meta.url), "utf8"),
  );
  for (const role of ["admin", "client", "other", "contractor"]) {
    await db.query(
      "INSERT INTO abk_users(id,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5)",
      [
        ids[role],
        `${role}@abk.example`,
        role,
        role === "other" ? "client" : role,
        await passwordHash("A-test-password-2026"),
      ],
    );
    await db.query(
      "INSERT INTO abk_sessions(token_hash,user_id,csrf,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')",
      [digest(role + "-session"), ids[role], "csrf-" + role],
    );
  }
  for (const [cid, pid, address] of [
    [ids.customer, ids.project, "client@abk.example"],
    [ids.customer2, ids.project2, "other@abk.example"],
  ]) {
    await db.query("INSERT INTO abk_clients(id,name,email) VALUES($1,$2,$3)", [
      cid,
      "Client test",
      address,
    ]);
    await db.query(
      "INSERT INTO abk_projects(id,client_id,title,category) VALUES($1,$2,'Projet test','piscine')",
      [pid, cid],
    );
  }
  await db.query(
    "INSERT INTO abk_members(project_id,user_id,can_update_tasks) VALUES($1,$2,true),($1,$3,false),($4,$5,false)",
    [ids.project, ids.contractor, ids.client, ids.project2, ids.other],
  );
});
after(() => db.close());
test("anonymous, CSRF, origin and admin-only access", async () => {
  assert.equal((await request("bootstrap", null, null)).code, 401);
  assert.equal(
    (await request("client-save", { name: "Test" }, "client")).code,
    403,
  );
  assert.equal(
    (await request("logout", {}, "admin", {}, { "x-csrf-token": "wrong" }))
      .code,
    403,
  );
  assert.equal(
    (
      await request(
        "logout",
        {},
        "admin",
        {},
        { origin: "https://hostile.example" },
      )
    ).code,
    403,
  );
  assert.equal((await request("client-save", null)).code, 405);
});
test("clients see only their projects, never global clients or finances", async () => {
  const r = await request("bootstrap", null, "client");
  assert.equal(r.code, 200);
  assert.deepEqual(
    r.data.projects.map((p) => p.id),
    [ids.project],
  );
  assert.equal(r.data.clients.length, 0);
  assert.equal(r.data.people.length, 0);
  assert.equal(
    (await request("project", null, "other", { id: ids.project })).code,
    403,
  );
  assert.equal(
    (
      await request("finance", null, "client", {
        from: "2026-01-01",
        to: "2026-12-31",
      })
    ).code,
    403,
  );
});
test("task visibility and assigned contractor-only updates", async () => {
  const tasks = {};
  for (const visibility of ["internal", "client", "shared"]) {
    const r = await request("task-save", {
      project_id: ids.project,
      title: "Task " + visibility,
      status: "todo",
      visibility,
      assignee_id: ids.contractor,
      due_date: "2026-11-01",
    });
    assert.equal(r.code, 200);
    tasks[visibility] = r.data.id;
  }
  const c = await request("project", null, "client", { id: ids.project });
  assert.deepEqual(c.data.tasks.map((t) => t.visibility).sort(), [
    "client",
    "shared",
  ]);
  const r = await request("project", null, "contractor", { id: ids.project });
  assert.deepEqual(
    r.data.tasks.map((t) => t.visibility),
    ["shared"],
  );
  assert.equal(
    (
      await request(
        "task-save",
        { id: tasks.internal, project_id: ids.project, status: "done" },
        "contractor",
      )
    ).code,
    403,
  );
  assert.equal(
    (
      await request(
        "task-save",
        { id: tasks.shared, project_id: ids.project, status: "done" },
        "contractor",
      )
    ).code,
    200,
  );
  assert.equal(
    (
      await request(
        "task-save",
        { id: tasks.shared, project_id: ids.project, status: "todo" },
        "client",
      )
    ).code,
    403,
  );
});
test("private files are protected and invalid formats rejected", async () => {
  const r = await request("document-upload", {
    project_id: ids.project,
    name: "plan.pdf",
    data: Buffer.from("%PDF-1.4\nexample").toString("base64"),
    visibility: "client",
  });
  assert.equal(r.code, 200);
  for (const u of ["other", "contractor"])
    assert.equal(
      (await request("document", null, u, { id: r.data.id })).code,
      403,
    );
  const d = await request("document", null, "client", { id: r.data.id });
  assert.equal(d.code, 200);
  assert.ok(Buffer.isBuffer(d.data));
  assert.match(d.headers["Content-Disposition"], /^attachment/);
  assert.equal(
    (
      await request("document-upload", {
        project_id: ids.project,
        name: "bad.html",
        data: Buffer.from("<script>bad</script>").toString("base64"),
        visibility: "shared",
      })
    ).code,
    400,
  );
});
test("invitation email binding, single use, expiry and membership revocation", async () => {
  const r = await request("invitation", {
    email: "new@abk.example",
    name: "Partenaire",
    role: "contractor",
    project_id: ids.project,
    can_update_tasks: true,
  });
  assert.equal(r.code, 200);
  const raw = new URLSearchParams(new URL(r.data.link).hash.slice(1)).get(
    "invitation",
  );
  assert.equal(
    (
      await request(
        "activate",
        {
          token: raw,
          email: "wrong@abk.example",
          password: "Another-password-2026",
        },
        null,
      )
    ).code,
    400,
  );
  const a = await request(
    "activate",
    { token: raw, email: "new@abk.example", password: "Another-password-2026" },
    null,
  );
  assert.equal(a.code, 200);
  assert.match(a.headers["Set-Cookie"], /HttpOnly/);
  assert.equal(
    (
      await request(
        "activate",
        {
          token: raw,
          email: "new@abk.example",
          password: "Another-password-2026",
        },
        null,
      )
    ).code,
    400,
  );
  const who = (
    await db.query("SELECT id FROM abk_users WHERE email='new@abk.example'")
  ).rows[0];
  await request("member-revoke", { project_id: ids.project, user_id: who.id });
  assert.equal(
    (
      await db.query(
        "SELECT * FROM abk_members WHERE project_id=$1 AND user_id=$2",
        [ids.project, who.id],
      )
    ).rows.length,
    0,
  );
  const exp = await request("invitation", {
    email: "expired@abk.example",
    name: "Expired",
    role: "contractor",
    project_id: ids.project,
  });
  await db.query(
    "UPDATE abk_invitations SET expires_at=now()-interval '1 hour' WHERE id=$1",
    [exp.data.id],
  );
  const token = new URLSearchParams(new URL(exp.data.link).hash.slice(1)).get(
    "invitation",
  );
  assert.equal(
    (
      await request(
        "activate",
        {
          token,
          email: "expired@abk.example",
          password: "Another-password-2026",
        },
        null,
      )
    ).code,
    400,
  );
});
test("invitations cannot reset existing passwords or escalate roles", async () => {
  const r = await request("invitation", {
    email: "client@abk.example",
    name: "Client",
    role: "client",
    project_id: ids.project,
  });
  const raw = new URLSearchParams(new URL(r.data.link).hash.slice(1)).get(
    "invitation",
  );
  assert.equal(
    (
      await request(
        "activate",
        {
          token: raw,
          email: "client@abk.example",
          password: "Hostile-password-2026",
        },
        null,
      )
    ).code,
    400,
  );
  assert.equal(
    (
      await request("invitation", {
        email: "admin@abk.example",
        name: "Admin",
        role: "contractor",
        project_id: ids.project,
      })
    ).code,
    409,
  );
});
test("client transfers blocked; conversion keeps private intake out of shared description", async () => {
  assert.equal(
    (
      await request("project-save", {
        id: ids.project,
        client_id: ids.customer2,
        title: "Changed",
        category: "piscine",
        status: "active",
      })
    ).code,
    400,
  );
  const rid = randomUUID();
  await db.query(
    "INSERT INTO abk_requests(id,name,email,category,content) VALUES($1,'Request','request@abk.example','incendie','Private budget')",
    [rid],
  );
  const r = await request("request-convert", {
    id: rid,
    title: "Nouveau chantier",
  });
  assert.equal(r.code, 200);
  assert.equal(
    (
      await db.query("SELECT description FROM abk_projects WHERE id=$1", [
        r.data.id,
      ])
    ).rows[0].description,
    "",
  );
  assert.equal(
    (await request("request-convert", { id: rid, title: "Duplicate" })).data.id,
    r.data.id,
  );
});
test("accounting totals and PDF/CSV exports", async () => {
  for (const [kind, state, net, vat] of [
    ["income", "paid", 10000, 2000],
    ["expense", "paid", 4000, 800],
    ["income", "invoiced", 5000, 1000],
    ["income", "planned", 8000, 1600],
  ])
    assert.equal(
      (
        await request("ledger-save", {
          project_id: ids.project,
          kind,
          state,
          label: "=unsafe",
          category: "Travaux",
          date: "2026-10-25",
          net_cents: net,
          vat_cents: vat,
        })
      ).code,
      200,
    );
  const q = { from: "2026-01-01", to: "2026-12-31" },
    r = await request("finance", null, "admin", q);
  assert.deepEqual(r.data.totals, {
    paid_income: 12000,
    paid_expense: 4800,
    invoiced_income: 6000,
    planned_income: 9600,
  });
  assert.match(
    (await request("report-csv", null, "admin", q)).data.toString(),
    /'=unsafe/,
  );
  const pdf = await request("report-pdf", null, "admin", q);
  assert.equal(pdf.code, 200);
  assert.match(pdf.data.subarray(0, 5).toString(), /%PDF-/);
});
test("password changes verify the current secret and revoke old sessions", async () => {
  const bad = await request("password-change", {
    current_password: "Wrong-password-2026",
    new_password: "New-password-2026",
  });
  assert.equal(bad.code, 400);
  const good = await request("password-change", {
    current_password: "A-test-password-2026",
    new_password: "New-password-2026",
  });
  assert.equal(good.code, 200);
  assert.equal((await request("bootstrap")).code, 401);
  assert.equal(
    (
      await request(
        "login",
        { email: "admin@abk.example", password: "A-test-password-2026" },
        null,
      )
    ).code,
    401,
  );
  assert.equal(
    (
      await request(
        "login",
        { email: "admin@abk.example", password: "New-password-2026" },
        null,
      )
    ).code,
    200,
  );
  const uid = ids.admin;
  await db.query("UPDATE abk_users SET password_hash=$1 WHERE id=$2", [
    await passwordHash("A-test-password-2026"),
    uid,
  ]);
});
test("login, logout and rate limits", async () => {
  const r = await request(
    "login",
    { email: "admin@abk.example", password: "A-test-password-2026" },
    null,
  );
  assert.equal(r.code, 200);
  const cookie = r.headers["Set-Cookie"].split(";")[0];
  assert.equal(
    (await request("bootstrap", null, "admin", {}, { cookie })).code,
    200,
  );
  const csrf = (await request("bootstrap", null, "admin", {}, { cookie })).data
    .csrf;
  assert.equal(
    (await request("logout", {}, "admin", {}, { cookie, "x-csrf-token": csrf }))
      .code,
    200,
  );
  assert.equal(
    (await request("bootstrap", null, "admin", {}, { cookie })).code,
    401,
  );
  for (let n = 0; n < 9; n++)
    await request(
      "login",
      { email: "absent@abk.example", password: "Wrong-password-2026" },
      null,
    );
  assert.equal(
    (
      await request(
        "login",
        { email: "absent@abk.example", password: "Wrong-password-2026" },
        null,
      )
    ).code,
    429,
  );
});
