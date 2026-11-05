// Explicitly requested learning data. Additive and idempotent; never resets real records.
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import PDFDocument from "pdfkit";

const q = (v) =>
  v === null || v === undefined
    ? "NULL"
    : typeof v === "boolean"
      ? v
        ? "true"
        : "false"
      : typeof v === "number"
        ? String(v)
        : "'" +
          String(typeof v === "object" ? JSON.stringify(v) : v).replaceAll(
            "'",
            "''",
          ) +
          "'";
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const administrator =
  "(SELECT id FROM abk_users WHERE role='admin' ORDER BY created_at LIMIT 1)";
async function examplePDF(title, body) {
  const doc = new PDFDocument({ size: "A4", margin: 55 }),
    chunks = [];
  const buffer = new Promise((resolve, reject) => {
    doc.on("data", (b) => chunks.push(b));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.fillColor("#102c4f").fontSize(26).text("ABK | EXEMPLE FICTIF");
  doc.moveDown().fontSize(18).text(title);
  doc.moveDown().fontSize(12).text(body, { lineGap: 6 });
  doc
    .moveDown(2)
    .fillColor("#a42828")
    .fontSize(13)
    .text(
      "DOCUMENT DE DEMONSTRATION\nSans valeur contractuelle ou comptable.\nAucun paiement a effectuer.",
    );
  doc.end();
  return buffer;
}
export async function exampleSQL() {
  const source = await readFile(
    new URL("../demo/demo.js", import.meta.url),
    "utf8",
  );
  const cutoff = source.indexOf("  function result(action, b)");
  if (cutoff < 0)
    throw Error("Example source layout changed; inspect before seeding.");
  const context = {};
  vm.runInNewContext(
    source.slice(0, cutoff) +
      "globalThis.records={people,clients,projects,tasks,messages,documents,requests,events,ledger};})();",
    context,
    { timeout: 1000 },
  );
  const d = JSON.parse(JSON.stringify(context.records)),
    sql = ["BEGIN;"];
  const insert = (table, row, raw = {}) => {
    const keys = Object.keys(row);
    sql.push(
      `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map((k) => raw[k] || q(row[k])).join(",")}) ON CONFLICT DO NOTHING;`,
    );
  };
  for (const p of d.people.filter((p) => p.role !== "admin"))
    insert("abk_users", {
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      active: true,
      company: p.company,
      trade: p.trade,
      phone: p.phone,
      notes:
        p.notes +
        " Profil fictif sans compte de connexion ni envoi de notification.",
    });
  for (const c of d.clients) {
    insert("abk_clients", c);
    insert("abk_users", {
      id: c.id,
      email: c.email,
      name: c.name,
      role: "client",
      active: true,
      notes:
        "Profil client fictif pour les exemples de conversation ; aucun compte de connexion.",
    });
  }
  for (const { client_name, ...p } of d.projects) insert("abk_projects", p);
  for (const p of d.people.filter((p) => p.role === "contractor"))
    for (const project_id of p.project_ids)
      insert("abk_members", {
        project_id,
        user_id: p.id,
        can_update_tasks: true,
      });
  for (const c of d.clients)
    for (const p of d.projects.filter((p) => p.client_id === c.id))
      insert("abk_members", {
        project_id: p.id,
        user_id: c.id,
        can_update_tasks: false,
      });
  for (const { assignee_name, ...task } of d.tasks)
    insert("abk_tasks", {
      ...task,
      completed_at: task.status === "done" ? new Date().toISOString() : null,
    });
  for (const r of d.requests)
    insert("abk_requests", { ...r, source: "EXEMPLE · " + r.source });
  for (const { project_title, ...ev } of d.events) insert("abk_events", ev);
  for (const { project_title, ...entry } of d.ledger)
    insert("abk_ledger", entry);
  for (const m of d.messages) {
    const { attachments, author_name, ...row } = m;
    insert(
      "abk_messages",
      row,
      m.author_id === uuid(1) ? { author_id: administrator } : {},
    );
  }
  for (const [i, document] of d.documents.entries()) {
    const bytes = await examplePDF(
      i === 0
        ? "Facture fictive - prise en main"
        : "Plan d’implantation - exemple pédagogique",
      i === 0
        ? "Chantier piscine et terrasse - exemple.\nCe fichier illustre le partage d’une facture PDF existante dans la messagerie.\nToutes les informations sont fictives et ce document ne constitue pas une facture émise."
        : "Chantier piscine et terrasse - exemple.\nCe fichier illustre le classement des plans dans un dossier chantier.\nAucune implantation, cote ou prescription technique ne doit être déduite de ce document.",
    );
    insert(
      "abk_documents",
      {
        id: document.id,
        project_id: document.project_id,
        author_id: null,
        name:
          i === 0
            ? "EXEMPLE - facture fictive.pdf"
            : "EXEMPLE - plan pédagogique.pdf",
        mime: "application/pdf",
        bytes: null,
        size: bytes.length,
        visibility: document.visibility,
        created_at: document.created_at,
      },
      {
        author_id: administrator,
        bytes: `decode(${q(bytes.toString("base64"))},'base64')`,
      },
    );
  }
  for (const m of d.messages)
    for (const a of m.attachments || [])
      insert("abk_message_documents", { message_id: m.id, document_id: a.id });
  insert(
    "abk_audit",
    {
      id: uuid(95),
      actor_id: null,
      action: "examples.added_at_owner_request",
      entity_id: "learning-data-20261025",
    },
    { actor_id: administrator },
  );
  sql.push("COMMIT;");
  return sql.join("\n");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(await exampleSQL());
