import { env } from "./runtime.mjs";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
import { database, transaction } from "./database.mjs";
import { verifyAccount, createAccount, resetAccount } from "./accounts.mjs";
import {
  token,
  digest,
  fail,
  text,
  email,
  choice,
  id,
  date,
  cents,
  admin,
  visible,
  passwordHash,
  passwordMatches,
  csvCell,
  documentPayload,
} from "./security.mjs";

const category = (b) => choice(b, ["piscine", "renovation", "incendie"]);
const visibility = (b) => choice(b, ["internal", "client", "shared"]);
const one = async (db, sql, args = []) => {
  const r = await db.query(sql, args);
  return r.rows[0];
};
const list = async (db, sql, args = []) => {
  const r = await db.query(sql, args);
  return r.rows;
};
const audit = (db, u, action, entity) =>
  db.query(
    "INSERT INTO abk_audit(id,actor_id,action,entity_id) VALUES($1,$2,$3,$4)",
    [randomUUID(), u?.id || null, action, entity],
  );
const appOrigin = () =>
  new URL(env.APP_ORIGIN || "http://localhost:3000").origin;
const dateLabel = (v) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
function projectData(u, p) {
  if (u.role === "admin") return p;
  const { internal_notes, budget_cents, ...shared } = p;
  return shared;
}
function siteData(b) {
  const src = b.site_details || {},
    result = {};
  for (const name of [
    "address",
    "postcode",
    "city",
    "contact_name",
    "contact_phone",
    "contact_email",
    "building_type",
    "occupancy",
    "surface",
    "work_scope",
    "access_notes",
    "parking",
    "working_hours",
    "utilities",
    "risks",
    "permit_status",
    "permit_reference",
    "insurance_reference",
  ])
    result[name] = text(
      src[name] || "",
      name === "work_scope" ? 5000 : 2000,
      false,
    );
  if (result.contact_email) result.contact_email = email(result.contact_email);
  for (const [name, max] of [
    ["latitude", 90],
    ["longitude", 180],
  ]) {
    const value = src[name];
    result[name] = value === "" || value == null ? null : Number(value);
    if (
      result[name] !== null &&
      (!Number.isFinite(result[name]) || Math.abs(result[name]) > max)
    )
      fail(400, "Coordonnées GPS invalides.");
  }
  if ((result.latitude === null) !== (result.longitude === null))
    fail(400, "Renseignez les deux coordonnées GPS.");
  return result;
}
async function rate(db, key, max = 8) {
  const row = await one(
    db,
    `INSERT INTO abk_rate_limits(key,count,window_start) VALUES($1,1,now())
 ON CONFLICT(key) DO UPDATE SET count=CASE WHEN abk_rate_limits.window_start<now()-interval '15 minutes' THEN 1 ELSE abk_rate_limits.count+1 END,
 window_start=CASE WHEN abk_rate_limits.window_start<now()-interval '15 minutes' THEN now() ELSE abk_rate_limits.window_start END RETURNING count`,
    [digest(key)],
  );
  if (row.count > max)
    fail(429, "Trop de tentatives. Réessayez dans 15 minutes.");
}
async function current(db, req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("abk_session="))
    ?.slice(12);
  if (!cookie) fail(401, "Connectez-vous à votre espace.");
  const row = await one(
    db,
    `SELECT u.id,u.email,u.name,u.role,s.csrf,s.token_hash FROM abk_sessions s JOIN abk_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,
    [digest(cookie)],
  );
  if (!row) fail(401, "Votre session a expiré.");
  return row;
}
async function access(db, user, project) {
  id(project);
  const p = await one(db, "SELECT * FROM abk_projects WHERE id=$1", [project]);
  if (!p) fail(404, "Projet introuvable.");
  if (user.role === "admin") return { ...p, can_update_tasks: true };
  const member = await one(
    db,
    "SELECT can_update_tasks FROM abk_members WHERE project_id=$1 AND user_id=$2",
    [project, user.id],
  );
  if (!member) fail(403, "Ce dossier ne vous est pas attribué.");
  return { ...p, ...member };
}
async function session(db, user) {
  const raw = token(),
    csrf = token();
  await db.query(
    "INSERT INTO abk_sessions(token_hash,user_id,csrf,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')",
    [digest(raw), user.id, csrf],
  );
  return { raw, csrf };
}
function sessionCookie(raw, clear = false) {
  return `abk_session=${raw}; Path=/; HttpOnly; SameSite=Strict; ${env.NODE_ENV === "production" ? "Secure; " : ""}Max-Age=${clear ? 0 : 43200}`;
}
async function deliver(address, link) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [address],
      subject: "Votre accès privé ABK",
      text: `Votre lien personnel ABK, à usage unique (activation : 48 heures ; réinitialisation : 1 heure) :\n${link}\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
    }),
  });
  if (!response.ok)
    throw Object.assign(
      new Error(
        "Invitation créée mais e-mail non envoyé. Copiez le lien depuis les accès.",
      ),
      { status: 502 },
    );
  return true;
}
async function invite(db, u, b) {
  admin(u);
  const address = email(b.email),
    role = choice(b.role, ["client", "contractor"]),
    project = id(b.project_id);
  const p = await access(db, u, project);
  const existing = await one(db, "SELECT role FROM abk_users WHERE email=$1", [
    address,
  ]);
  if (existing && existing.role !== role)
    fail(409, "Ce compte possède déjà un autre rôle.");
  if (role === "client") {
    const client = await one(db, "SELECT email FROM abk_clients WHERE id=$1", [
      p.client_id,
    ]);
    if (client.email !== address)
      fail(400, "Invitez l’adresse de la fiche client associée à ce projet.");
  }
  const raw = token(),
    invitation = randomUUID();
  await db.query(
    "UPDATE abk_invitations SET revoked_at=now() WHERE email=$1 AND project_id=$2 AND used_at IS NULL",
    [address, project],
  );
  await db.query(
    "INSERT INTO abk_invitations(id,email,name,role,project_id,token_hash,can_update_tasks,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,now()+interval '48 hours')",
    [
      invitation,
      address,
      text(b.name),
      role,
      project,
      digest(raw),
      role === "contractor" && b.can_update_tasks === true,
    ],
  );
  await audit(db, u, "invitation.created", invitation);
  // URL fragment is not sent to the server/access logs; exchanged by POST only.
  return {
    id: invitation,
    email: address,
    link: `${appOrigin()}/gestion/#invitation=${raw}`,
  };
}
async function activate(db, b) {
  const address = email(b.email),
    hash = await passwordHash(b.password),
    raw = text(b.token, 100);
  return transaction(db, async (tx) => {
    const inv = await one(
      tx,
      "SELECT * FROM abk_invitations WHERE token_hash=$1 AND email=$2 AND used_at IS NULL AND revoked_at IS NULL AND expires_at>now() FOR UPDATE",
      [digest(raw), address],
    );
    if (!inv)
      fail(400, "Lien invalide, expiré, déjà utilisé ou adresse différente.");
    let user = await one(
      tx,
      "SELECT * FROM abk_users WHERE email=$1 FOR UPDATE",
      [address],
    );
    if (inv.role === "reset") {
      if (!user || !user.active) fail(400, "Lien invalide.");
      const resetHash = await resetAccount(user.id, b.password);
      await tx.query("UPDATE abk_users SET password_hash=$1 WHERE id=$2", [
        resetHash,
        user.id,
      ]);
      await tx.query("DELETE FROM abk_sessions WHERE user_id=$1", [user.id]);
    } else {
      if (user) {
        // A project invitation never resets an existing account's password.
        if (
          user.role !== inv.role ||
          !user.active ||
          !(await verifyAccount(address, b.password, user))
        )
          fail(
            400,
            "Pour un compte existant, utilisez votre mot de passe actuel, ou demandez sa réinitialisation.",
          );
      } else {
        user = {
          id: randomUUID(),
          email: address,
          name: inv.name,
          role: inv.role,
        };
        const accountHash = await createAccount(
          user.id,
          address,
          b.password,
          inv.name,
        );
        await tx.query(
          "INSERT INTO abk_users(id,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5)",
          [user.id, address, inv.name, inv.role, accountHash],
        );
      }
      await tx.query(
        "INSERT INTO abk_members(project_id,user_id,can_update_tasks) VALUES($1,$2,$3) ON CONFLICT(project_id,user_id) DO UPDATE SET can_update_tasks=$3",
        [inv.project_id, user.id, inv.can_update_tasks],
      );
    }
    await tx.query("UPDATE abk_invitations SET used_at=now() WHERE id=$1", [
      inv.id,
    ]);
    await audit(tx, user, "account.activated", user.id);
    return session(tx, user);
  });
}
async function publicRequest(db, b, req) {
  if (b.website) return { ok: true };
  if (b.consent !== true)
    fail(400, "Votre accord pour traiter la demande est nécessaire.");
  await rate(
    db,
    "quote:" +
      String(
        req.headers["x-forwarded-for"] ||
          req.socket?.remoteAddress ||
          "unknown",
      ).split(",")[0],
    8,
  );
  if (env.TURNSTILE_SECRET_KEY) {
    const validation = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: text(b.challenge, 3000),
        }),
      },
    ).then((r) => r.json());
    if (
      !validation.success ||
      validation.hostname !== new URL(appOrigin()).hostname ||
      validation.action !== "quote"
    )
      fail(400, "Vérification anti-robot invalide.");
  }
  const request = randomUUID();
  await db.query(
    "INSERT INTO abk_requests(id,name,email,phone,category,content,source) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      request,
      text(b.name),
      email(b.email),
      text(b.phone, 50, false),
      category(b.category),
      text(b.content, 24000),
      text(b.source || "site", 120),
    ],
  );
  await audit(db, null, "request.received", request);
  return { ok: true, reference: request };
}
async function report(db, b) {
  const from = date(b.from),
    to = date(b.to);
  if (!from || !to || from > to) fail(400, "Choisissez une période valide.");
  const rows = await list(
    db,
    `SELECT l.*,p.title project_title FROM abk_ledger l LEFT JOIN abk_projects p ON p.id=l.project_id WHERE l.date >= $1 AND l.date <= $2 ORDER BY l.date,l.created_at`,
    [from, to],
  );
  const totals = {
    paid_income: 0,
    paid_expense: 0,
    invoiced_income: 0,
    planned_income: 0,
  };
  for (const r of rows) {
    const gross = Number(r.net_cents) + Number(r.vat_cents);
    if (r.state === "paid")
      totals[r.kind === "income" ? "paid_income" : "paid_expense"] += gross;
    if (r.kind === "income" && r.state === "invoiced")
      totals.invoiced_income += gross;
    if (r.kind === "income" && r.state === "planned")
      totals.planned_income += gross;
  }
  return { from, to, rows, totals };
}
async function routes(db, u, action, b, method) {
  if (action === "bootstrap") {
    const projects =
      u.role === "admin"
        ? await list(
            db,
            "SELECT p.*,c.name client_name FROM abk_projects p JOIN abk_clients c ON c.id=p.client_id ORDER BY p.created_at DESC",
          )
        : await list(
            db,
            "SELECT p.* FROM abk_projects p JOIN abk_members m ON m.project_id=p.id WHERE m.user_id=$1 ORDER BY p.created_at DESC",
            [u.id],
          );
    const tasks =
      u.role === "admin"
        ? await list(db, "SELECT * FROM abk_tasks")
        : await list(
            db,
            `SELECT t.* FROM abk_tasks t JOIN abk_members m ON m.project_id=t.project_id WHERE m.user_id=$1 AND (t.visibility='shared' OR ($2='client' AND t.visibility='client'))`,
            [u.id, u.role],
          );
    return {
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
      csrf: u.csrf,
      projects: projects.map((p) => projectData(u, p)),
      tasks,
      clients:
        u.role === "admin"
          ? await list(db, "SELECT * FROM abk_clients ORDER BY created_at DESC")
          : [],
      requests:
        u.role === "admin"
          ? await list(
              db,
              "SELECT * FROM abk_requests ORDER BY created_at DESC LIMIT 1000",
            )
          : [],
      people:
        u.role === "admin"
          ? await list(
              db,
              "SELECT u.id,u.name,u.email,u.role,u.active,u.company,u.trade,u.phone,u.notes,(SELECT coalesce(json_agg(m.project_id),'[]'::json) FROM abk_members m WHERE m.user_id=u.id) project_ids FROM abk_users u ORDER BY u.name",
            )
          : [],
      invitations:
        u.role === "admin"
          ? await list(
              db,
              "SELECT id,email,name,role,project_id,expires_at,used_at,revoked_at FROM abk_invitations ORDER BY created_at DESC LIMIT 200",
            )
          : [],
    };
  }
  if (action === "project") {
    const project = await access(db, u, b.id);
    const tasks = (
      await list(
        db,
        "SELECT t.*,a.name assignee_name FROM abk_tasks t LEFT JOIN abk_users a ON a.id=t.assignee_id WHERE t.project_id=$1 ORDER BY t.created_at",
        [project.id],
      )
    ).filter((t) => visible(u, t.visibility));
    const messages = (
      await list(
        db,
        "SELECT m.*,a.name author_name FROM abk_messages m JOIN abk_users a ON a.id=m.author_id WHERE project_id=$1 ORDER BY m.created_at LIMIT 1000",
        [project.id],
      )
    ).filter((m) => visible(u, m.visibility));
    const documents = (
      await list(
        db,
        "SELECT id,name,mime,size,visibility,created_at FROM abk_documents WHERE project_id=$1 ORDER BY created_at DESC",
        [project.id],
      )
    ).filter((d) => visible(u, d.visibility));
    const attachments = await list(
      db,
      "SELECT md.message_id,d.id,d.name,d.visibility FROM abk_message_documents md JOIN abk_documents d ON d.id=md.document_id WHERE d.project_id=$1",
      [project.id],
    );
    for (const message of messages)
      message.attachments = attachments
        .filter((d) => d.message_id === message.id && visible(u, d.visibility))
        .map(({ id, name }) => ({ id, name }));
    return {
      project: projectData(u, project),
      tasks,
      messages,
      documents,
      members:
        u.role === "admin"
          ? await list(
              db,
              "SELECT m.*,u.name,u.email,u.role FROM abk_members m JOIN abk_users u ON u.id=m.user_id WHERE project_id=$1",
              [project.id],
            )
          : [],
    };
  }
  if (action === "request-thread") {
    admin(u);
    return {
      messages: await list(
        db,
        "SELECT m.*,u.name author_name FROM abk_messages m JOIN abk_users u ON u.id=m.author_id WHERE request_id=$1 ORDER BY created_at",
        [id(b.id)],
      ),
    };
  }
  if (action === "conversations") {
    const rows = await list(
      db,
      `SELECT p.id,p.title,c.name client_name,
  (SELECT body FROM abk_messages m WHERE m.project_id=p.id AND ($2='admin' OR m.visibility='shared' OR ($2='client' AND m.visibility='client')) ORDER BY m.created_at DESC LIMIT 1) last_body,
  (SELECT max(created_at) FROM abk_messages m WHERE m.project_id=p.id AND ($2='admin' OR m.visibility='shared' OR ($2='client' AND m.visibility='client'))) last_at,
  (SELECT count(*) FROM abk_messages m WHERE m.project_id=p.id AND m.author_id<>$1 AND ($2='admin' OR m.visibility='shared' OR ($2='client' AND m.visibility='client')) AND m.created_at>coalesce((SELECT read_at FROM abk_reads r WHERE r.project_id=p.id AND r.user_id=$1),'1970-01-01'::timestamptz)) unread
  FROM abk_projects p JOIN abk_clients c ON c.id=p.client_id WHERE $2='admin' OR EXISTS(SELECT 1 FROM abk_members a WHERE a.project_id=p.id AND a.user_id=$1) ORDER BY last_at DESC NULLS LAST,p.created_at DESC`,
      [u.id, u.role],
    );
    return {
      rows: rows.map((r) =>
        u.role === "contractor" ? { ...r, client_name: "" } : r,
      ),
    };
  }
  if (action === "conversation-read") {
    const p = await access(db, u, id(b.project_id));
    await db.query(
      "INSERT INTO abk_reads(user_id,project_id) VALUES($1,$2) ON CONFLICT(user_id,project_id) DO UPDATE SET read_at=now()",
      [u.id, p.id],
    );
    return { ok: true };
  }
  if (action === "person-save") {
    admin(u);
    const uid = id(b.id);
    await db.query(
      "UPDATE abk_users SET name=$1,company=$2,trade=$3,phone=$4,notes=$5 WHERE id=$6",
      [
        text(b.name),
        text(b.company || "", 500, false),
        text(b.trade || "", 200, false),
        text(b.phone || "", 50, false),
        text(b.notes || "", 5000, false),
        uid,
      ],
    );
    await audit(db, u, "person.updated", uid);
    return { ok: true };
  }
  if (action === "calendar") {
    if (u.role === "client")
      fail(403, "Agenda réservé à ABK et aux partenaires.");
    const uid = u.role === "admin" && b.user_id ? id(b.user_id) : u.id;
    const rows = await list(
      db,
      `SELECT e.*,p.title project_title FROM abk_events e LEFT JOIN abk_projects p ON p.id=e.project_id WHERE e.contractor_id=$1 AND ($2='admin' OR e.project_id IS NULL OR EXISTS(SELECT 1 FROM abk_members m WHERE m.project_id=e.project_id AND m.user_id=$1)) ORDER BY e.starts_at`,
      [uid, u.role],
    );
    return { rows };
  }
  if (action === "event-save") {
    admin(u);
    const uid = id(b.contractor_id),
      pid = b.project_id ? id(b.project_id) : null;
    const who = await one(
      db,
      "SELECT id FROM abk_users WHERE id=$1 AND role='contractor' AND active=true FOR UPDATE",
      [uid],
    );
    if (!who) fail(400, "Choisissez un sous-traitant actif.");
    if (
      pid &&
      !(await one(
        db,
        "SELECT 1 FROM abk_members WHERE project_id=$1 AND user_id=$2",
        [pid, uid],
      ))
    )
      fail(
        400,
        "Attribuez le partenaire au projet avant de planifier une intervention.",
      );
    const starts = new Date(b.starts_at),
      ends = new Date(b.ends_at);
    if (
      !b.starts_at ||
      !b.ends_at ||
      !Number.isFinite(+starts) ||
      !Number.isFinite(+ends) ||
      ends <= starts
    )
      fail(400, "Choisissez des horaires valides.");
    const eid = b.id ? id(b.id) : randomUUID();
    const args = [
      uid,
      pid,
      text(b.title),
      starts.toISOString(),
      ends.toISOString(),
      text(b.description || "", 5000, false),
      eid,
    ];
    if (
      await one(
        db,
        "SELECT id FROM abk_events WHERE contractor_id=$1 AND starts_at<$2 AND ends_at>$3 AND id<>$4",
        [uid, ends.toISOString(), starts.toISOString(), eid],
      )
    )
      fail(400, "Ce partenaire possède déjà un créneau sur ces horaires.");
    if (b.id)
      await db.query(
        "UPDATE abk_events SET contractor_id=$1,project_id=$2,title=$3,starts_at=$4,ends_at=$5,description=$6 WHERE id=$7",
        args,
      );
    else
      await db.query(
        "INSERT INTO abk_events(contractor_id,project_id,title,starts_at,ends_at,description,id) VALUES($1,$2,$3,$4,$5,$6,$7)",
        args,
      );
    await audit(db, u, "event.saved", eid);
    return { id: eid };
  }
  if (action === "event-delete") {
    admin(u);
    await db.query("DELETE FROM abk_events WHERE id=$1", [id(b.id)]);
    await audit(db, u, "event.deleted", b.id);
    return { ok: true };
  }
  if (action === "client-save") {
    admin(u);
    const cid = b.id ? id(b.id) : randomUUID();
    if (b.id)
      await db.query(
        "UPDATE abk_clients SET name=$1,email=$2,phone=$3,address=$4,notes=$5 WHERE id=$6",
        [
          text(b.name),
          email(b.email),
          text(b.phone || "", 50, false),
          text(b.address || "", 1000, false),
          text(b.notes || "", 5000, false),
          cid,
        ],
      );
    else
      await db.query(
        "INSERT INTO abk_clients(id,name,email,phone,address,notes) VALUES($1,$2,$3,$4,$5,$6)",
        [
          cid,
          text(b.name),
          email(b.email),
          text(b.phone || "", 50, false),
          text(b.address || "", 1000, false),
          text(b.notes || "", 5000, false),
        ],
      );
    await audit(db, u, "client.saved", cid);
    return { id: cid };
  }
  if (action === "project-save") {
    admin(u);
    const pid = b.id ? id(b.id) : randomUUID();
    const args = [
      id(b.client_id),
      text(b.title),
      category(b.category),
      choice(b.status, [
        "planning",
        "active",
        "paused",
        "complete",
        "archived",
      ]),
      text(b.description || "", 10000, false),
      date(b.start_date),
      date(b.due_date),
    ];
    if (args[5] && args[6] && args[5] > args[6])
      fail(400, "La date de fin doit suivre le début du chantier.");
    if (b.id) {
      const old = await access(db, u, pid);
      if (old.client_id !== b.client_id)
        fail(
          400,
          "Le client d’un dossier existant ne peut pas être remplacé. Créez un nouveau dossier.",
        );
    }
    if (b.id)
      await db.query(
        "UPDATE abk_projects SET client_id=$1,title=$2,category=$3,status=$4,description=$5,start_date=$6,due_date=$7 WHERE id=$8",
        [...args, pid],
      );
    else
      await db.query(
        "INSERT INTO abk_projects(client_id,title,category,status,description,start_date,due_date,id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [...args, pid],
      );
    await db.query(
      "UPDATE abk_projects SET site_details=$1,internal_notes=$2,budget_cents=$3 WHERE id=$4",
      [
        JSON.stringify(siteData(b)),
        text(b.internal_notes || "", 10000, false),
        b.budget_cents === null || b.budget_cents === undefined
          ? null
          : cents(b.budget_cents),
        pid,
      ],
    );
    await audit(db, u, "project.saved", pid);
    return { id: pid };
  }
  if (action === "task-save") {
    const project = await access(db, u, id(b.project_id));
    const status = choice(b.status, ["todo", "doing", "done"]);
    const tid = b.id ? id(b.id) : randomUUID();
    if (u.role !== "admin") {
      if (u.role !== "contractor" || !project.can_update_tasks || !b.id)
        fail(403, "Mise à jour non autorisée.");
      const task = await one(
        db,
        "SELECT * FROM abk_tasks WHERE id=$1 AND project_id=$2",
        [tid, project.id],
      );
      if (!task || task.assignee_id !== u.id || !visible(u, task.visibility))
        fail(403, "Cette tâche ne vous est pas attribuée.");
      await db.query(
        "UPDATE abk_tasks SET status=$1,completed_at=CASE WHEN $1='done' THEN now() ELSE NULL END WHERE id=$2",
        [status, tid],
      );
    } else {
      const assignee = b.assignee_id ? id(b.assignee_id) : null;
      if (assignee) {
        const who = await one(
          db,
          "SELECT role FROM abk_users WHERE id=$1 AND active=true",
          [assignee],
        );
        if (!who || who.role === "client") fail(400, "Responsable invalide.");
        if (
          who.role === "contractor" &&
          !(await one(
            db,
            "SELECT 1 FROM abk_members WHERE project_id=$1 AND user_id=$2",
            [project.id, assignee],
          ))
        )
          fail(400, "Attribuez d’abord ce sous-traitant au projet.");
      }
      const args = [
        text(b.title),
        text(b.description || "", 5000, false),
        status,
        assignee,
        date(b.due_date),
        visibility(b.visibility),
      ];
      if (b.id) {
        const old = await one(
          db,
          "SELECT id FROM abk_tasks WHERE id=$1 AND project_id=$2",
          [tid, project.id],
        );
        if (!old) fail(404, "Tâche introuvable.");
        await db.query(
          "UPDATE abk_tasks SET title=$1,description=$2,status=$3,assignee_id=$4,due_date=$5,visibility=$6,completed_at=CASE WHEN $3='done' THEN coalesce(completed_at,now()) ELSE NULL END WHERE id=$7",
          [...args, tid],
        );
      } else
        await db.query(
          "INSERT INTO abk_tasks(title,description,status,assignee_id,due_date,visibility,completed_at,id,project_id) VALUES($1,$2,$3,$4,$5,$6,CASE WHEN $3='done' THEN now() ELSE NULL END,$7,$8)",
          [...args, tid, project.id],
        );
    }
    await audit(db, u, "task.updated", tid);
    return { id: tid };
  }
  if (action === "message") {
    const mid = randomUUID();
    let vis = "client";
    if (b.project_id) {
      await access(db, u, id(b.project_id));
      vis =
        u.role === "admin"
          ? visibility(b.visibility)
          : u.role === "contractor"
            ? "shared"
            : "client";
    } else {
      admin(u);
      id(b.request_id);
      vis = "internal";
    }
    const attachments = b.document_ids || [];
    if (!Array.isArray(attachments) || attachments.length > 5)
      fail(400, "Cinq pièces jointes maximum.");
    const body = text(b.body || "", 10000, false);
    if (!body && !attachments.length)
      fail(400, "Ajoutez un message ou un document.");
    await db.query(
      "INSERT INTO abk_messages(id,project_id,request_id,author_id,body,visibility) VALUES($1,$2,$3,$4,$5,$6)",
      [mid, b.project_id || null, b.request_id || null, u.id, body, vis],
    );
    for (const did of attachments) {
      const doc = await one(db, "SELECT * FROM abk_documents WHERE id=$1", [
        id(did),
      ]);
      if (
        !doc ||
        doc.project_id !== b.project_id ||
        !visible(u, doc.visibility) ||
        (vis === "shared" && doc.visibility !== "shared") ||
        (vis === "client" && doc.visibility === "internal")
      )
        fail(
          400,
          "Cette pièce jointe ne peut pas être partagée avec ces destinataires.",
        );
      await db.query(
        "INSERT INTO abk_message_documents(message_id,document_id) VALUES($1,$2)",
        [mid, did],
      );
    }
    await audit(db, u, "message.created", mid);
    return { id: mid };
  }
  if (action === "request-update") {
    admin(u);
    const rid = id(b.id);
    await db.query("UPDATE abk_requests SET status=$1 WHERE id=$2", [
      choice(b.status, ["new", "contacted", "qualified", "closed"]),
      rid,
    ]);
    await audit(db, u, "request.updated", rid);
    return { ok: true };
  }
  if (action === "request-convert") {
    admin(u);
    const r = await one(
      db,
      "SELECT * FROM abk_requests WHERE id=$1 FOR UPDATE",
      [id(b.id)],
    );
    if (!r) fail(404, "Demande introuvable.");
    if (r.project_id) return { id: r.project_id };
    const cid = b.client_id ? id(b.client_id) : randomUUID(),
      pid = randomUUID();
    if (!b.client_id)
      await db.query(
        "INSERT INTO abk_clients(id,name,email,phone) VALUES($1,$2,$3,$4)",
        [cid, r.name, r.email, r.phone],
      );
    await db.query(
      "INSERT INTO abk_projects(id,client_id,title,category,description) VALUES($1,$2,$3,$4,$5)",
      [pid, cid, text(b.title), r.category, ""],
    );
    await db.query(
      "UPDATE abk_requests SET client_id=$1,project_id=$2,status='converted' WHERE id=$3",
      [cid, pid, r.id],
    );
    await audit(db, u, "request.converted", r.id);
    return { id: pid };
  }
  if (action === "member-save") {
    admin(u);
    const p = await access(db, u, id(b.project_id)),
      uid = id(b.user_id);
    const who = await one(
      db,
      "SELECT * FROM abk_users WHERE id=$1 AND active=true",
      [uid],
    );
    if (!who || who.role === "admin") fail(400, "Compte invalide.");
    if (who.role === "client") {
      const client = await one(
        db,
        "SELECT email FROM abk_clients WHERE id=$1",
        [p.client_id],
      );
      if (client.email !== who.email)
        fail(400, "Le compte doit correspondre au client de ce projet.");
    }
    await db.query(
      "INSERT INTO abk_members(project_id,user_id,can_update_tasks) VALUES($1,$2,$3) ON CONFLICT(project_id,user_id) DO UPDATE SET can_update_tasks=$3",
      [p.id, uid, who.role === "contractor" && b.can_update_tasks === true],
    );
    await audit(db, u, "member.assigned", p.id);
    return { ok: true };
  }
  if (action === "member-revoke") {
    admin(u);
    await db.query(
      "DELETE FROM abk_members WHERE project_id=$1 AND user_id=$2",
      [id(b.project_id), id(b.user_id)],
    );
    await db.query(
      "UPDATE abk_invitations SET revoked_at=now() WHERE project_id=$1 AND email=(SELECT email FROM abk_users WHERE id=$2) AND used_at IS NULL",
      [b.project_id, b.user_id],
    );
    await audit(db, u, "member.revoked", b.project_id);
    return { ok: true };
  }
  if (action === "invitation") {
    return invite(db, u, b);
  }
  if (action === "invitation-revoke") {
    admin(u);
    await db.query("UPDATE abk_invitations SET revoked_at=now() WHERE id=$1", [
      id(b.id),
    ]);
    await audit(db, u, "invitation.revoked", b.id);
    return { ok: true };
  }
  if (action === "user-disable") {
    admin(u);
    const uid = id(b.id);
    if (uid === u.id) fail(400, "Vous ne pouvez pas désactiver votre compte.");
    await db.query(
      "UPDATE abk_users SET active=false WHERE id=$1 AND role<>$2",
      [uid, "admin"],
    );
    await db.query("DELETE FROM abk_sessions WHERE user_id=$1", [uid]);
    await audit(db, u, "user.disabled", uid);
    return { ok: true };
  }
  if (action === "document-upload") {
    await access(db, u, id(b.project_id));
    const d = documentPayload(b),
      did = randomUUID();
    const vis =
      u.role === "admin"
        ? visibility(b.visibility)
        : u.role === "contractor"
          ? "shared"
          : "client";
    await db.query(
      "INSERT INTO abk_documents(id,project_id,author_id,name,mime,bytes,size,visibility) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [did, b.project_id, u.id, d.name, d.mime, d.bytes, d.bytes.length, vis],
    );
    await audit(db, u, "document.uploaded", did);
    return { id: did };
  }
  if (action === "document") {
    const d = await one(db, "SELECT * FROM abk_documents WHERE id=$1", [
      id(b.id),
    ]);
    if (!d) fail(404, "Document introuvable.");
    await access(db, u, d.project_id);
    if (!visible(u, d.visibility)) fail(403, "Document privé.");
    await audit(db, u, "document.downloaded", d.id);
    return { binary: Buffer.from(d.bytes), type: d.mime, name: d.name };
  }
  if (action === "document-delete") {
    admin(u);
    await db.query("DELETE FROM abk_documents WHERE id=$1", [id(b.id)]);
    await audit(db, u, "document.deleted", b.id);
    return { ok: true };
  }
  if (action === "finance") {
    admin(u);
    return report(db, b);
  }
  if (action === "ledger-save") {
    admin(u);
    const lid = b.id ? id(b.id) : randomUUID();
    const args = [
      b.project_id ? id(b.project_id) : null,
      choice(b.kind, ["income", "expense"]),
      choice(b.state, ["planned", "invoiced", "paid"]),
      text(b.label),
      text(b.category),
      date(b.date),
      cents(b.net_cents),
      cents(b.vat_cents),
      text(b.note || "", 5000, false),
    ];
    if (!args[5]) fail(400, "Date nécessaire.");
    if (b.id)
      await db.query(
        "UPDATE abk_ledger SET project_id=$1,kind=$2,state=$3,label=$4,category=$5,date=$6,net_cents=$7,vat_cents=$8,note=$9 WHERE id=$10",
        [...args, lid],
      );
    else
      await db.query(
        "INSERT INTO abk_ledger(project_id,kind,state,label,category,date,net_cents,vat_cents,note,id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [...args, lid],
      );
    await audit(db, u, "ledger.saved", lid);
    return { id: lid };
  }
  if (action === "audit") {
    admin(u);
    return {
      rows: await list(
        db,
        "SELECT a.*,u.name actor_name FROM abk_audit a LEFT JOIN abk_users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 500",
      ),
    };
  }
  if (action === "report-csv" || action === "report-pdf") {
    admin(u);
    const r = await report(db, b);
    await audit(db, u, "finance.exported", r.from + ":" + r.to);
    if (action === "report-csv")
      return {
        binary: Buffer.from(
          "\ufeff" +
            [
              [
                "Date",
                "Projet",
                "Type",
                "État",
                "Libellé",
                "Catégorie",
                "HT EUR",
                "TVA EUR",
                "TTC EUR",
              ],
              ...r.rows.map((x) => [
                dateLabel(x.date),
                x.project_title || "",
                x.kind,
                x.state,
                x.label,
                x.category,
                Number(x.net_cents) / 100,
                Number(x.vat_cents) / 100,
                (Number(x.net_cents) + Number(x.vat_cents)) / 100,
              ]),
            ]
              .map((row) => row.map(csvCell).join(";"))
              .join("\r\n"),
        ),
        type: "text/csv; charset=utf-8",
        name: `abk-gestion-${r.from}-${r.to}.csv`,
      };
    const doc = new PDFDocument({ size: "A4", margin: 45 }),
      chunks = [];
    const result = new Promise((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(chunks))),
    );
    doc.on("data", (b) => chunks.push(b));
    doc.fillColor("#062c5d").fontSize(24).text("ABK | Rapport de gestion");
    doc.fontSize(11).text(`${r.from} au ${r.to}`);
    doc.moveDown();
    const euro = (v) => (v / 100).toFixed(2) + " EUR";
    doc.text(`Encaissements TTC : ${euro(r.totals.paid_income)}`);
    doc.text(`Décaissements TTC : ${euro(r.totals.paid_expense)}`);
    doc.text(
      `Solde TTC de la période : ${euro(r.totals.paid_income - r.totals.paid_expense)}`,
    );
    doc.text(
      `Recettes facturées non encaissées : ${euro(r.totals.invoiced_income)}`,
    );
    doc.text(`Recettes prévues : ${euro(r.totals.planned_income)}`);
    doc.moveDown();
    const groups = new Map();
    for (const x of r.rows) {
      const key = `${x.project_title || "Hors projet"} / ${x.category}`;
      const g = groups.get(key) || { income: 0, expense: 0 };
      if (x.state === "paid")
        g[x.kind] += Number(x.net_cents) + Number(x.vat_cents);
      groups.set(key, g);
    }
    doc.fontSize(15).text("Ventilation des flux payés");
    for (const [key, g] of groups)
      doc
        .fontSize(10)
        .text(
          `${key} : entrées ${euro(g.income)} / sorties ${euro(g.expense)}`,
        );
    doc.moveDown();
    doc.fontSize(15).text("Détail des écritures");
    for (const x of r.rows) {
      doc.moveDown(0.4);
      doc
        .fontSize(10)
        .text(
          `${dateLabel(x.date)} | ${x.project_title || "Hors projet"} | ${x.kind} / ${x.state}`,
        );
      doc.text(
        `${x.label} | ${x.category} | HT ${euro(Number(x.net_cents))} | TVA ${euro(Number(x.vat_cents))} | TTC ${euro(Number(x.net_cents) + Number(x.vat_cents))}`,
      );
      if (x.note) doc.fontSize(9).text(x.note);
    }
    doc.moveDown();
    doc
      .fontSize(9)
      .text(
        "Suivi de gestion interne. Ce rapport ne remplace pas les comptes légaux, les justificatifs ni une validation comptable.",
      );
    doc.end();
    return {
      binary: await result,
      type: "application/pdf",
      name: `abk-rapport-${r.from}-${r.to}.pdf`,
    };
  }
  fail(404, "Fonction introuvable.");
}

export function createHandler(getDB = database) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    try {
      const url = new URL(req.url, appOrigin()),
        action = url.searchParams.get("action") || "bootstrap";
      const method = req.method || "GET";
      if (!["GET", "POST"].includes(method))
        fail(405, "Méthode non autorisée.");
      const readonly = [
        "bootstrap",
        "project",
        "request-thread",
        "document",
        "finance",
        "report-pdf",
        "report-csv",
        "audit",
        "health",
        "calendar",
        "conversations",
      ];
      if (method === "GET" && !readonly.includes(action))
        fail(405, "Utilisez POST.");
      if (method === "POST") {
        const origin = req.headers.origin;
        if (origin !== appOrigin()) fail(403, "Origine non autorisée.");
        if (!(req.headers["content-type"] || "").startsWith("application/json"))
          fail(415, "Format JSON requis.");
      }
      let b =
        method === "GET" ? Object.fromEntries(url.searchParams) : req.body;
      if (typeof b === "string") {
        if (Buffer.byteLength(b) > 4200000)
          fail(413, "Contenu trop volumineux.");
        b = JSON.parse(b);
      }
      if (!b || typeof b !== "object" || Array.isArray(b))
        fail(400, "Requête invalide.");
      const db = getDB();
      if (action === "health") {
        await db.query("SELECT id FROM abk_users LIMIT 1");
        return res.status(200).json({
          ready: true,
          quotes: true,
          challenge: !!env.TURNSTILE_SECRET_KEY,
        });
      }
      let result;
      const ip = String(
        req.headers["x-forwarded-for"] ||
          req.socket?.remoteAddress ||
          "unknown",
      ).split(",")[0];
      if (action === "login") {
        const address = email(b.email);
        await rate(db, "login-ip:" + ip, 25);
        await rate(db, "login-account:" + address, 8);
        const user = await one(
          db,
          "SELECT * FROM abk_users WHERE email=$1 AND active=true",
          [address],
        );
        let ok = false;
        try {
          ok = await verifyAccount(address, b.password, user);
        } catch (err) {
          if (err.status === 503 || err.status === 429) throw err;
        }
        if (!user || !ok) fail(401, "Adresse ou mot de passe incorrect.");
        await db.query("DELETE FROM abk_rate_limits WHERE key=$1", [
          digest("login-account:" + address),
        ]);
        const s = await session(db, user);
        res.setHeader("Set-Cookie", sessionCookie(s.raw));
        result = { ok: true };
        await audit(db, user, "account.login", user.id);
      } else if (action === "activate") {
        await rate(db, "activate:" + ip, 15);
        const s = await activate(db, b);
        res.setHeader("Set-Cookie", sessionCookie(s.raw));
        result = { ok: true };
      } else if (action === "password-reset") {
        await rate(db, "reset:" + ip, 6);
        const address = email(b.email),
          user = await one(
            db,
            "SELECT * FROM abk_users WHERE email=$1 AND active=true",
            [address],
          );
        if (user && env.RESEND_API_KEY && env.EMAIL_FROM) {
          const raw = token();
          await db.query(
            "INSERT INTO abk_invitations(id,email,name,role,token_hash,expires_at) VALUES($1,$2,$3,'reset',$4,now()+interval '1 hour')",
            [randomUUID(), user.email, user.name, digest(raw)],
          );
          try {
            await deliver(address, `${appOrigin()}/gestion/#invitation=${raw}`);
          } catch {
            console.error("ABK reset delivery failed");
          }
        }
        result = {
          ok: true,
          message:
            "Si cette adresse possède un compte et que l’envoi est configuré, un lien sera envoyé.",
        };
      } else if (action === "quote") result = await publicRequest(db, b, req);
      else {
        const u = await current(db, req);
        if (method === "POST" && req.headers["x-csrf-token"] !== u.csrf)
          fail(403, "Session à actualiser.");
        if (action === "logout") {
          await db.query("DELETE FROM abk_sessions WHERE token_hash=$1", [
            u.token_hash,
          ]);
          res.setHeader("Set-Cookie", sessionCookie("", true));
          result = { ok: true };
        } else if (action === "password-change") {
          await rate(db, "password-change:" + u.id, 6);
          if (
            !(await verifyAccount(
              u.email,
              b.current_password,
              await one(db, "SELECT * FROM abk_users WHERE id=$1", [u.id]),
            ))
          )
            fail(400, "Votre mot de passe actuel est incorrect.");
          await passwordHash(b.new_password);
          const hash = await resetAccount(u.id, b.new_password);
          const s = await transaction(db, async (tx) => {
            await tx.query(
              "UPDATE abk_users SET password_hash=$1 WHERE id=$2",
              [hash, u.id],
            );
            await tx.query("DELETE FROM abk_sessions WHERE user_id=$1", [u.id]);
            await audit(tx, u, "account.password_changed", u.id);
            return session(tx, u);
          });
          res.setHeader("Set-Cookie", sessionCookie(s.raw));
          result = { ok: true };
        } else
          result =
            method === "POST"
              ? await transaction(db, (tx) => routes(tx, u, action, b, method))
              : await routes(db, u, action, b, method);
        if (action === "invitation" && b.send_email === true) {
          try {
            result.sent = await deliver(result.email, result.link);
          } catch {
            result.sent = false;
            result.warning =
              "E-mail non envoyé. Copiez et partagez le lien personnel.";
          }
        }
      }
      if (result?.binary) {
        res.setHeader("Content-Type", result.type);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename*=UTF-8''${encodeURIComponent(result.name)}`,
        );
        return res.status(200).send(result.binary);
      }
      res.status(200).json(result);
    } catch (e) {
      const status =
        e.status || (["23505", "23503", "23514"].includes(e.code) ? 409 : 500);
      if (status === 500) console.error("ABK API error", e.code || e.name);
      res.status(status).json({
        error:
          status === 500
            ? "Erreur serveur. Aucune action confirmée."
            : status === 409
              ? "Conflit de données : vérifiez la fiche liée."
              : e.message,
      });
    }
  };
}
export default createHandler();
