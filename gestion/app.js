"use strict";
const root = document.querySelector("#app"),
  dialog = document.querySelector("#modal");
let state = {},
  view = "dashboard",
  projectId = null,
  projectTab = "tasks",
  details = null,
  finance = null,
  personId = null,
  personTab = "profile",
  calendarData = null,
  conversationId = null,
  conversationRows = [];
const labels = {
  admin: "Administration",
  client: "Client",
  contractor: "Sous-traitant",
  piscine: "Piscines extérieures",
  renovation: "Bâtiment & rénovation",
  incendie: "Réserve incendie",
  planning: "À planifier",
  active: "En cours",
  paused: "En pause",
  complete: "Terminé",
  archived: "Archivé",
  todo: "À faire",
  doing: "En cours",
  done: "Terminé",
  new: "Nouvelle",
  contacted: "Contactée",
  qualified: "Qualifiée",
  converted: "Projet créé",
  closed: "Clôturée",
  internal: "ABK uniquement",
  shared: "Tous les membres du projet",
  income: "Recette",
  expense: "Dépense",
  planned: "Prévu",
  invoiced: "Facturé",
  paid: "Payé",
};
const e = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const label = (v) => labels[v] || v,
  admin = () => state.user?.role === "admin";
const day = (v) => (v ? String(v).slice(0, 10) : "—"),
  money = (v) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(Number(v || 0) / 100);
const badge = (v) => `<span class="badge ${e(v)}">${e(label(v))}</span>`;
const btn = (text, action, id = "", cls = "") =>
  `<button type="button" class="${cls}" data-action="${action}" data-id="${e(id)}">${text}</button>`;
const options = (rows, value) =>
  rows
    .map(
      ([id, name]) =>
        `<option value="${e(id)}" ${id === value ? "selected" : ""}>${e(name)}</option>`,
    )
    .join("");
const select = (name, title, rows, value = "", required = true) =>
  `<label>${title}<select aria-label="${e(title)}" name="${name}" ${required ? "required" : ""}>${options(rows, value)}</select></label>`;
const input = (name, title, value = "", type = "text", required = false) =>
  `<label>${title}<input name="${name}" type="${type}" value="${e(value)}" ${required ? "required" : ""} ${type === "password" ? 'minlength="12" maxlength="128" autocomplete="current-password"' : ""}></label>`;
const area = (name, title, value = "") =>
  `<label class="full">${title}<textarea name="${name}" maxlength="10000">${e(value)}</textarea></label>`;
const vis = () => [
  ["internal", "ABK uniquement"],
  ["client", "ABK et client"],
  ["shared", "Tous les membres du projet"],
];
function notify(message) {
  document.querySelector("#notice").textContent = message;
  setTimeout(() => (document.querySelector("#notice").textContent = ""), 6500);
}
async function api(action, body, query = {}) {
  const url = "/api/gestion?" + new URLSearchParams({ action, ...query });
  const response = await fetch(url, {
    credentials: "same-origin",
    method: body ? "POST" : "GET",
    headers: body
      ? { "Content-Type": "application/json", "X-CSRF-Token": state.csrf || "" }
      : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = Error(data.error || "Action impossible.");
    error.status = response.status;
    throw error;
  }
  return data;
}
function modal(title, fields, save) {
  document.querySelector("#modal-content").innerHTML =
    `<h2>${e(title)}</h2><form id="edit-form"><div class="form-grid">${fields}</div><p class="error" data-error></p><button class="primary">Enregistrer</button></form>`;
  dialog.showModal();
  document.querySelector("#edit-form").onsubmit = async (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget,
      b = form.querySelector("button");
    b.disabled = true;
    try {
      const result = await save(Object.fromEntries(new FormData(form)));
      if (result === false) return;
      dialog.close();
      await refresh();
      notify("Enregistrement effectué.");
    } catch (err) {
      form.querySelector("[data-error]").textContent = err.message;
    } finally {
      b.disabled = false;
    }
  };
}
dialog.querySelector(".close").onclick = () => dialog.close();
function auth(message = "") {
  const raw = new URLSearchParams(location.hash.slice(1)).get("invitation");
  root.innerHTML = `<main class="auth"><a class="brand" href="/">ABK<span>Bâti & Piscine</span></a><p class="eyebrow">Votre espace privé</p><h1>${raw ? "Activez votre accès." : "Votre projet, au même endroit."}</h1><p class="muted">${raw ? "Saisissez l’adresse invitée et choisissez un mot de passe de 12 caractères minimum. Si vous avez déjà un compte, utilisez votre mot de passe actuel." : "Clients, partenaires et équipe ABK : connectez-vous pour retrouver vos dossiers."}</p><form id="auth-form">${input("email", "Adresse e-mail", "", "email", true)}${input("password", raw ? "Mot de passe (12 caractères minimum)" : "Mot de passe", "", "password", true)}<p class="error" data-error>${e(message)}</p><button class="primary">${raw ? "Activer mon accès" : "Me connecter"}</button></form>${btn("Mot de passe oublié", "reset", "", "link")}<p class="subtle">Accès sur invitation. Vos documents sont réservés aux personnes autorisées.</p><a href="/" class="subtle">Retour au site ABK</a></main>`;
  document.querySelector("#auth-form").onsubmit = async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget,
      b = f.querySelector("button");
    b.disabled = true;
    try {
      await api(raw ? "activate" : "login", {
        ...Object.fromEntries(new FormData(f)),
        token: raw,
      });
      history.replaceState(null, "", location.pathname);
      await refresh();
    } catch (err) {
      f.querySelector("[data-error]").textContent = err.message;
    } finally {
      b.disabled = false;
    }
  };
}
const table = (heads, rows) =>
  `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">Aucun élément pour le moment.</td></tr>`}</tbody></table></div>`;
function progress(p) {
  const tasks = state.tasks.filter((t) => t.project_id === p.id),
    done = tasks.filter((t) => t.status === "done").length;
  return `<small>${done} / ${tasks.length} tâches terminées</small><br><progress max="${tasks.length || 1}" value="${done}" aria-label="Avancement des tâches"></progress>`;
}
function projectRows(projects) {
  return table(
    ["Projet", "Expertise", "État", "Échéance", "Avancement", ""],
    projects.map((p) => [
      `<b>${e(p.title)}</b><p class="muted">${e(p.client_name || "")}</p>`,
      e(label(p.category)),
      badge(p.status),
      e(day(p.due_date)),
      progress(p),
      btn("Ouvrir", "project", p.id),
    ]),
  );
}
function shell(content) {
  const nav = admin()
    ? [
        ["dashboard", "Vue d’ensemble"],
        ["requests", "Demandes"],
        ["messages", "Messagerie"],
        ["clients", "Clients"],
        ["projects", "Chantiers"],
        ["people", "Accès & partenaires"],
        ["finance", "Comptabilité"],
        ["audit", "Journal d’activité"],
      ]
    : [
        ["dashboard", "Vue d’ensemble"],
        ["projects", "Mes projets"],
        ["messages", "Messagerie"],
        ...(state.user.role === "contractor"
          ? [["calendar", "Mon agenda"]]
          : []),
      ];
  root.innerHTML = `<aside class="sidebar"><a class="brand" href="/">ABK<span>Bâti & Piscine</span></a><nav aria-label="Espace de gestion">${nav.map(([id, title]) => btn(title, "nav", id, view === id ? "active" : "")).join("")}</nav><footer><span>${e(state.user.name)}<br>${e(label(state.user.role))}</span><a href="/">Voir le site public</a>${btn("Changer mon mot de passe", "password-change")}${btn("Déconnexion", "logout")}</footer></aside><main class="workspace"><div class="topbar"><span>ESPACE PRIVÉ · ${e(label(state.user.role))}</span><span>${e(state.user.name)} ${btn("Mot de passe", "password-change", "", "link")} ${btn("Déconnexion", "logout", "", "link")}</span></div>${content}</main>`;
}
const heading = (title, subtitle = "", action = "") =>
  `<div class="heading"><div><div class="eyebrow">ABK · ${admin() ? "Gestion" : "Suivi de chantier"}</div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
function dashboard() {
  const open = state.projects.filter(
    (p) => !["complete", "archived"].includes(p.status),
  );
  const pending = state.tasks.filter((t) => t.status !== "done");
  const overdue = pending.filter(
    (t) =>
      t.due_date && day(t.due_date) < new Date().toISOString().slice(0, 10),
  );
  const metric = (title, note, count) =>
    `<div class="metric"><small>${title}</small><b>${count}</b><small>${note}</small></div>`;
  return (
    heading(
      "Chaque projet, une vision claire.",
      "Demandes, échéances et avancement de vos chantiers.",
    ) +
    `<div class="metrics">${metric("Projets ouverts", "Dossiers en préparation et en cours", open.length)}${metric("Tâches à réaliser", "Sur les projets accessibles", pending.length)}${metric("Échéances dépassées", "À revoir avec le responsable", overdue.length)}${metric(admin() ? "Nouvelles demandes" : "Tâches terminées", admin() ? "Dans votre boîte de réception" : "Avancement de vos dossiers", admin() ? state.requests.filter((r) => r.status === "new").length : state.tasks.filter((t) => t.status === "done").length)}</div><h2>Vos projets en cours</h2>${projectRows(open)}<section class="panel"><h2>À suivre prochainement</h2>${table(
      ["Tâche", "Projet", "Échéance", "État"],
      [...pending]
        .sort((a, b) =>
          (a.due_date || "9999").localeCompare(b.due_date || "9999"),
        )
        .slice(0, 8)
        .map((t) => [
          e(t.title),
          e(state.projects.find((p) => p.id === t.project_id)?.title),
          day(t.due_date),
          badge(t.status),
        ]),
    )}</section>`
  );
}
function render() {
  let content;
  if (personId) {
    renderPerson();
    return;
  }
  if (projectId && details) {
    renderProject();
    return;
  }
  if (view === "calendar") {
    renderCalendar();
    return;
  }
  if (view === "messages") {
    loadInbox();
    return;
  }
  if (view === "dashboard") content = dashboard();
  if (view === "projects")
    content =
      heading(
        admin() ? "Les chantiers." : "Mes projets.",
        "Un dossier centralisé pour chaque projet.",
        admin() ? btn("Nouveau projet", "project-edit", "", "primary") : "",
      ) + projectRows(state.projects);
  if (view === "clients")
    content =
      heading(
        "Les clients.",
        "Plusieurs projets peuvent être attribués à une même fiche.",
        btn("Ajouter un client", "client-edit", "", "primary"),
      ) +
      table(
        ["Client", "Contact", "Adresse", "Projets", ""],
        state.clients.map((c) => [
          `<b>${e(c.name)}</b>`,
          `<a href="mailto:${e(c.email)}">${e(c.email)}</a><p>${e(c.phone)}</p>`,
          e(c.address),
          state.projects.filter((p) => p.client_id === c.id).length,
          btn("Modifier", "client-edit", c.id),
        ]),
      );
  if (view === "requests")
    content =
      heading(
        "Demandes & messagerie.",
        "Les demandes reçues sont regroupées ici avant la création d’un chantier.",
      ) +
      `<label class="search">Rechercher une demande<input id="request-search" type="search" placeholder="Nom, e-mail, expertise…"></label><div id="request-list">${requestRows(state.requests)}</div>`;
  if (view === "people")
    content =
      heading(
        "Les bonnes personnes, au bon dossier.",
        "Invitez les clients et les sous-traitants depuis leur projet.",
      ) +
      table(
        ["Nom", "E-mail", "Profil", "Compte", ""],
        state.people.map((p) => [
          btn(e(p.name), "person", p.id, "link") +
            `<p class="muted">${e(p.company)}</p>`,
          e(p.email),
          e(p.trade || label(p.role)),
          p.active ? "Actif" : "Désactivé",
          p.role !== "admin" && p.active
            ? btn("Désactiver", "user-disable", p.id, "danger")
            : "",
        ]),
      ) +
      `<section class="panel"><h2>Invitations récentes</h2>${table(
        ["Destinataire", "Projet", "Expiration", "État", ""],
        state.invitations.map((i) => [
          e(i.email),
          e(
            state.projects.find((p) => p.id === i.project_id)?.title ||
              "Réinitialisation",
          ),
          day(i.expires_at),
          i.used_at
            ? "Utilisée"
            : i.revoked_at
              ? "Révoquée"
              : new Date(i.expires_at) < new Date()
                ? "Expirée"
                : "En attente",
          !i.used_at && !i.revoked_at
            ? btn("Révoquer", "invitation-revoke", i.id)
            : "",
        ]),
      )}</section>`;
  if (view === "finance") {
    renderFinance();
    return;
  }
  if (view === "audit") {
    loadAudit();
    return;
  }
  shell(content || dashboard());
}
const requestRows = (rows) =>
  table(
    ["Demande", "Expertise", "Date", "État", ""],
    rows.map((r) => [
      `<b>${e(r.name)}</b><p>${e(r.email)}</p>`,
      e(label(r.category)),
      day(r.created_at),
      badge(r.status),
      btn("Consulter", "request", r.id),
    ]),
  );
function renderProject() {
  const p = details.project;
  const tabs = [
    ["site", "Fiche chantier"],
    ["tasks", "Planning & tâches"],
    ["documents", "Documents"],
    ["messages", "Messages"],
    ...(admin() ? [["access", "Accès au dossier"]] : []),
  ];
  shell(
    heading(
      e(p.title),
      `${e(label(p.category))} · ${e(label(p.status))}`,
      `<div class="inline">${btn("Tous les projets", "nav", "projects")}${admin() ? btn("Modifier", "project-edit", p.id) : ""}</div>`,
    ) +
      `<p class="pre">${e(p.description)}</p><p class="muted">Début : ${day(p.start_date)} · Échéance : ${day(p.due_date)}</p><div class="tabs" role="navigation" aria-label="Dossier">${tabs.map(([key, title]) => btn(title, "tab", key, projectTab === key ? "active" : "")).join("")}</div>` +
      projectContent(),
  );
}
function projectContent() {
  if (projectTab === "site") return siteContent(details.project);
  if (projectTab === "tasks")
    return (
      `<div class="heading"><h2>Le déroulement du chantier</h2>${admin() ? btn("Ajouter une tâche", "task-edit", "", "primary") : ""}</div>` +
      table(
        ["Tâche", "Responsable", "Échéance", "État", ""],
        details.tasks.map((t) => [
          `<div class="task-detail"><span class="task-title">${e(t.title)}</span><p class="pre muted">${e(t.description)}</p>${admin() ? badge(t.visibility) : ""}</div>`,
          e(
            state.people.find((p) => p.id === t.assignee_id)?.name ||
              t.assignee_name ||
              (t.assignee_id === state.user.id
                ? "Moi"
                : t.assignee_id
                  ? "Équipe ABK"
                  : "À attribuer"),
          ),
          day(t.due_date),
          badge(t.status),
          admin()
            ? btn("Modifier", "task-edit", t.id)
            : state.user.role === "contractor" &&
                details.project.can_update_tasks &&
                t.assignee_id === state.user.id
              ? btn(
                  t.status === "done" ? "Reprendre" : "Mettre à jour",
                  "task-status",
                  t.id,
                )
              : "",
        ]),
      )
    );
  if (projectTab === "documents")
    return (
      `<h2>Plans, photos et documents</h2><div class="dropzone" id="dropzone"><p>Glissez vos fichiers ici ou choisissez-les ci-dessous.</p><label>PDF, PNG, JPEG · 3 Mo maximum par fichier<input type="file" id="files" multiple accept="application/pdf,image/png,image/jpeg"></label>${admin() ? select("document_visibility", "Visible par", vis(), "client") : ""}</div>` +
      table(
        ["Document", "Visibilité", "Taille", ""],
        details.documents.map((d) => [
          e(d.name),
          badge(d.visibility),
          `${Math.ceil(d.size / 1024)} Ko`,
          `<a class="button" href="/api/gestion?action=document&id=${e(d.id)}">Télécharger</a> ${admin() ? btn("Supprimer", "document-delete", d.id, "danger") : ""}`,
        ]),
      )
    );
  if (projectTab === "messages")
    return `<h2>Échanges du projet</h2><p class="muted">${admin() ? "Choisissez les destinataires avant chaque message." : state.user.role === "client" ? "Vos échanges sont partagés avec ABK." : "Vos messages sont visibles par tous les membres du projet."}</p><div class="thread">${details.messages.map((m) => `<article class="message"><b>${e(m.author_name)}</b> ${badge(m.visibility)}<p class="pre">${e(m.body)}</p>${attachmentLinks(m)}<small>${e(new Date(m.created_at).toLocaleString("fr-FR"))}</small></article>`).join("") || '<p class="empty">Aucun échange pour le moment.</p>'}</div><form id="message-form">${area("body", "Votre message")}${admin() ? select("visibility", "Visible par", vis(), "client") : ""}<label>Documents / factures PDF (5 maximum, 3 Mo chacun)<input type="file" name="attachments" multiple accept="application/pdf,image/png,image/jpeg"></label><p class="error" data-error></p><button class="primary">Envoyer dans le dossier</button></form>`;
  return (
    `<div class="heading"><h2>Accès autorisés</h2>${btn("Inviter une personne", "invite", "", "primary")} ${btn("Attribuer un compte existant", "assign")}</div><p class="muted">Le client accède à ses échanges et documents. Un sous-traitant accède aux éléments partagés ; sa mise à jour des tâches nécessite une autorisation.</p>` +
    table(
      ["Personne", "Rôle", "Tâches", ""],
      details.members.map((m) => [
        `${e(m.name)}<p>${e(m.email)}</p>`,
        e(label(m.role)),
        m.can_update_tasks ? "Mise à jour autorisée" : "Lecture",
        btn("Retirer l’accès", "member-revoke", m.user_id, "danger"),
      ]),
    ) +
    `<div id="invite-result"></div>`
  );
}
async function refresh() {
  state = await api("bootstrap");
  if (projectId) details = await api("project", null, { id: projectId });
  render();
}
function clientEdit(id) {
  const c = state.clients.find((x) => x.id === id) || {};
  modal(
    id ? "Modifier le client" : "Nouveau client",
    input("name", "Nom / raison sociale", c.name, "text", true) +
      input("email", "E-mail", c.email, "email", true) +
      input("phone", "Téléphone", c.phone) +
      input("address", "Adresse", c.address) +
      area("notes", "Notes internes à ABK", c.notes),
    (b) => api("client-save", { ...b, id: id || undefined }),
  );
}
function projectEdit(id) {
  if (!state.clients.length) {
    notify("Ajoutez d’abord une fiche client.");
    clientEdit("");
    return;
  }
  const p = state.projects.find((x) => x.id === id) || {},
    s = p.site_details || {};
  const group = (title, content) =>
    `<fieldset class="full project-group"><legend>${title}</legend><div class="form-grid">${content}</div></fieldset>`;
  modal(
    id ? "Modifier le dossier chantier" : "Nouveau dossier chantier",
    group(
      "Projet et client",
      input("title", "Intitulé", p.title, "text", true) +
        select(
          "client_id",
          "Client",
          state.clients.map((c) => [c.id, c.name]),
          p.client_id,
        ) +
        select(
          "category",
          "Expertise",
          ["piscine", "renovation", "incendie"].map((c) => [c, label(c)]),
          p.category,
        ) +
        select(
          "status",
          "État",
          ["planning", "active", "paused", "complete", "archived"].map((v) => [
            v,
            label(v),
          ]),
          p.status || "planning",
        ) +
        input(
          "start_date",
          "Date de début",
          p.start_date ? day(p.start_date) : "",
          "date",
        ) +
        input(
          "due_date",
          "Échéance",
          p.due_date ? day(p.due_date) : "",
          "date",
        ),
    ) +
      group(
        "Lieu et contact du chantier",
        input("site_address", "Adresse du chantier", s.address) +
          input("site_postcode", "Code postal", s.postcode) +
          input("site_city", "Ville", s.city) +
          input("site_contact_name", "Contact sur place", s.contact_name) +
          input(
            "site_contact_phone",
            "Téléphone sur place",
            s.contact_phone,
            "tel",
          ) +
          input(
            "site_contact_email",
            "E-mail du contact",
            s.contact_email,
            "email",
          ) +
          input("site_latitude", "Latitude GPS", s.latitude ?? "") +
          input("site_longitude", "Longitude GPS", s.longitude ?? "") +
          `<div class="full">${btn("Utiliser ma position actuelle", "geolocate")}<p class="subtle">À utiliser uniquement lorsque vous êtes sur le chantier. L’itinéraire peut aussi être ouvert à partir de l’adresse.</p></div>`,
      ) +
      group(
        "Travaux et organisation",
        input("site_building_type", "Type de bien / terrain", s.building_type) +
          input(
            "site_occupancy",
            "Occupation pendant les travaux",
            s.occupancy,
          ) +
          input("site_surface", "Surface / dimensions concernées", s.surface) +
          input("site_working_hours", "Horaires autorisés", s.working_hours) +
          area(
            "site_work_scope",
            "Périmètre des travaux et livrables",
            s.work_scope,
          ) +
          area(
            "site_access_notes",
            "Accès au logement / terrain (partagé avec les membres)",
            s.access_notes,
          ) +
          input(
            "site_parking",
            "Stationnement, livraisons et engins",
            s.parking,
          ) +
          input(
            "site_utilities",
            "Eau, électricité et coupures à prévoir",
            s.utilities,
          ) +
          area(
            "site_risks",
            "Risques connus et précautions à confirmer",
            s.risks,
          ),
      ) +
      group(
        "Autorisations et dossier technique",
        input(
          "site_permit_status",
          "État des autorisations / déclaration préalable",
          s.permit_status,
        ) +
          input(
            "site_permit_reference",
            "Référence et date de l’autorisation",
            s.permit_reference,
          ) +
          input(
            "site_insurance_reference",
            "Références des attestations à vérifier",
            s.insurance_reference,
          ) +
          area(
            "description",
            "Présentation et consignes générales partagées",
            p.description,
          ) +
          `<p class="subtle full">Ajoutez les plans, devis signés, diagnostics, autorisations et attestations dans l’onglet Documents après création du dossier.</p>`,
      ) +
      group(
        "Informations privées ABK",
        `<label>Budget de gestion HT (EUR)<input name="budget" type="number" min="0" step="0.01" value="${p.budget_cents == null ? "" : Number(p.budget_cents) / 100}"></label>` +
          area(
            "internal_notes",
            "Notes internes, réserves commerciales ou codes sensibles",
            p.internal_notes,
          ) +
          `<p class="subtle full">Ces informations sont réservées aux administrateurs. Évitez les codes d’accès sensibles dans les champs partagés.</p>`,
      ),
    (data) => {
      const site_details = {};
      for (const [key, value] of Object.entries(data))
        if (key.startsWith("site_")) site_details[key.slice(5)] = value;
      return api("project-save", {
        ...data,
        site_details,
        budget_cents:
          data.budget === "" ? null : Math.round(Number(data.budget) * 100),
        id: id || undefined,
      });
    },
  );
}
function taskEdit(id) {
  const t = details.tasks.find((x) => x.id === id) || {};
  const people = state.people.filter(
    (u) =>
      u.active &&
      (u.role === "admin" ||
        details.members.some(
          (m) => m.user_id === u.id && m.role === "contractor",
        )),
  );
  modal(
    id ? "Modifier la tâche" : "Nouvelle tâche",
    input("title", "Tâche", t.title, "text", true) +
      select(
        "status",
        "État",
        ["todo", "doing", "done"].map((s) => [s, label(s)]),
        t.status || "todo",
      ) +
      select(
        "assignee_id",
        "Responsable",
        [["", "À attribuer"], ...people.map((p) => [p.id, p.name])],
        t.assignee_id,
        false,
      ) +
      input("due_date", "Échéance", t.due_date ? day(t.due_date) : "", "date") +
      select("visibility", "Visible par", vis(), t.visibility || "client") +
      area("description", "Détail de la tâche", t.description),
    (b) =>
      api("task-save", { ...b, id: id || undefined, project_id: projectId }),
  );
}
function invite() {
  modal(
    "Inviter au projet",
    input("name", "Nom et prénom", "", "text", true) +
      input("email", "E-mail invité", "", "email", true) +
      select("role", "Profil", [
        ["client", "Client"],
        ["contractor", "Sous-traitant"],
      ]) +
      `<label class="check"><input type="checkbox" name="can_update_tasks">Autoriser le sous-traitant à mettre à jour ses tâches</label><label class="check full"><input type="checkbox" name="send_email" checked>Envoyer aussi par e-mail si la messagerie est configurée</label><p class="subtle full">Le lien personnel expire après 48 heures. Le client invité doit correspondre à la fiche client du projet.</p>`,
    async (b) => {
      const r = await api("invitation", {
        ...b,
        project_id: projectId,
        can_update_tasks: b.can_update_tasks === "on",
        send_email: b.send_email === "on",
      });
      dialog.close();
      await refresh();
      projectTab = "access";
      renderProject();
      document.querySelector("#invite-result").innerHTML =
        `<div class="invite-result"><h3>Invitation créée</h3><p>${r.sent ? "E-mail envoyé." : "E-mail non envoyé : partagez ce lien personnel par votre canal habituel."}</p><label>Lien à copier<textarea readonly id="invite-link">${e(r.link)}</textarea></label>${btn("Copier le lien", "copy-invite")}<p class="subtle">À transmettre uniquement à ${e(r.email)}. Le lien ne sera plus affiché après fermeture de cette vue.</p></div>`;
      return false;
    },
  );
}
async function requestOpen(id) {
  const r = state.requests.find((x) => x.id === id);
  const thread = await api("request-thread", null, { id });
  document.querySelector("#modal-content").innerHTML =
    `<h2>${e(r.name)}</h2><p>${e(r.email)} · ${e(r.phone)}</p><p>${badge(r.category)} ${badge(r.status)}</p><div class="pre panel">${e(r.content)}</div><form id="request-status">${select(
      "status",
      "État",
      ["new", "contacted", "qualified", "closed"].map((s) => [s, label(s)]),
      r.status,
    )}<button>Mettre à jour</button></form><div class="actions">${r.project_id ? btn("Ouvrir le projet", "project", r.project_id) : btn("Créer un projet depuis la demande", "convert", r.id, "primary")}</div><h3>Notes et messagerie internes</h3>${thread.messages.map((m) => `<article class="message"><b>${e(m.author_name)}</b><p class="pre">${e(m.body)}</p></article>`).join("")}<form id="request-message">${area("body", "Ajouter une note interne")}<button>Enregistrer la note</button></form><p class="error" id="request-error"></p>`;
  dialog.showModal();
  document.querySelector("#request-status").onsubmit = async (ev) => {
    ev.preventDefault();
    try {
      await api("request-update", {
        id,
        status: new FormData(ev.currentTarget).get("status"),
      });
      await refresh();
      notify("État mis à jour.");
    } catch (err) {
      document.querySelector("#request-error").textContent = err.message;
    }
  };
  document.querySelector("#request-message").onsubmit = async (ev) => {
    ev.preventDefault();
    try {
      await api("message", {
        request_id: id,
        body: new FormData(ev.currentTarget).get("body"),
      });
      dialog.close();
      await requestOpen(id);
    } catch (err) {
      document.querySelector("#request-error").textContent = err.message;
    }
  };
}
function renderFinance() {
  const year = new Date().getFullYear(),
    from = finance?.from || `${year}-01-01`,
    to = finance?.to || `${year}-12-31`;
  shell(
    heading(
      "Les finances, lisibles.",
      "Suivi interne des recettes et dépenses. Montants de synthèse TTC.",
      btn("Ajouter une écriture", "ledger-edit", "", "primary"),
    ) +
      `<form id="finance-filter" class="filters">${input("from", "Du", from, "date", true)}${input("to", "Au", to, "date", true)}<button>Afficher</button></form><div id="finance-data">${finance ? financeContent() : ""}</div>`,
  );
  if (!finance) loadFinance(from, to);
}
function financeContent() {
  const t = finance.totals;
  return `<div class="metrics">${[
    ["Encaissé", t.paid_income],
    ["Décaissé", t.paid_expense],
    ["Solde des flux", t.paid_income - t.paid_expense],
    ["Facturé à encaisser", t.invoiced_income],
  ]
    .map(
      ([title, v]) =>
        `<div class="metric"><small>${title}</small><b>${money(v)}</b></div>`,
    )
    .join(
      "",
    )}</div><div class="actions"><p class="muted">Recettes prévues : ${money(t.planned_income)}</p><div class="inline"><a class="button" href="/api/gestion?${new URLSearchParams({ action: "report-pdf", from: finance.from, to: finance.to })}">Rapport PDF</a><a class="button" href="/api/gestion?${new URLSearchParams({ action: "report-csv", from: finance.from, to: finance.to })}">Export CSV</a></div></div>${table(
    ["Date", "Écriture", "Projet", "État", "HT", "TVA", "TTC", ""],
    finance.rows.map((r) => [
      day(r.date),
      `${badge(r.kind)}<p>${e(r.label)}</p><small>${e(r.category)}</small>`,
      e(r.project_title || "Hors projet"),
      badge(r.state),
      money(r.net_cents),
      money(r.vat_cents),
      money(Number(r.net_cents) + Number(r.vat_cents)),
      btn("Modifier", "ledger-edit", r.id),
    ]),
  )}<p class="subtle">Ce suivi de gestion ne remplace pas les comptes légaux et les justificatifs comptables.</p>`;
}
async function loadFinance(from, to) {
  try {
    finance = await api("finance", null, { from, to });
    renderFinance();
  } catch (err) {
    notify(err.message);
  }
}
function ledgerEdit(id) {
  const r = finance?.rows.find((x) => x.id === id) || {};
  modal(
    id ? "Modifier l’écriture" : "Nouvelle écriture",
    input("label", "Libellé", r.label, "text", true) +
      input("category", "Catégorie de gestion", r.category, "text", true) +
      select(
        "kind",
        "Type",
        [
          ["income", "Recette"],
          ["expense", "Dépense"],
        ],
        r.kind,
      ) +
      select(
        "state",
        "État",
        [
          ["planned", "Prévu"],
          ["invoiced", "Facturé"],
          ["paid", "Payé"],
        ],
        r.state,
      ) +
      input(
        "date",
        "Date",
        r.date ? day(r.date) : new Date().toISOString().slice(0, 10),
        "date",
        true,
      ) +
      select(
        "project_id",
        "Projet",
        [["", "Hors projet"], ...state.projects.map((p) => [p.id, p.title])],
        r.project_id,
        false,
      ) +
      `<label>Montant HT (EUR)<input name="net" type="number" step="0.01" min="0" required value="${Number(r.net_cents || 0) / 100}"></label><label>TVA (EUR)<input name="vat" type="number" step="0.01" min="0" required value="${Number(r.vat_cents || 0) / 100}"></label>` +
      area("note", "Note interne", r.note),
    async (b) => {
      await api("ledger-save", {
        ...b,
        id: id || undefined,
        net_cents: Math.round(Number(b.net) * 100),
        vat_cents: Math.round(Number(b.vat) * 100),
      });
      if (finance)
        finance = await api("finance", null, {
          from: finance.from,
          to: finance.to,
        });
    },
  );
}
async function loadAudit() {
  try {
    const r = await api("audit");
    if (view === "audit")
      shell(
        heading(
          "Le journal d’activité.",
          "Les 500 dernières opérations sur les comptes, dossiers et finances.",
        ) +
          table(
            ["Date", "Personne", "Action", "Référence"],
            r.rows.map((a) => [
              e(new Date(a.created_at).toLocaleString("fr-FR")),
              e(a.actor_name || "Formulaire public"),
              e(a.action),
              e(a.entity_id),
            ]),
          ),
      );
  } catch (err) {
    notify(err.message);
  }
}
document.addEventListener("click", async (ev) => {
  const b = ev.target.closest("[data-action]");
  if (!b) return;
  const action = b.dataset.action,
    id = b.dataset.id;
  try {
    if (action === "nav") {
      personId = null;
      calendarData = null;
      projectId = null;
      details = null;
      view = id;
      render();
    } else if (action === "project") {
      personId = null;
      if (dialog.open) dialog.close();
      projectId = id;
      projectTab = "tasks";
      details = await api("project", null, { id });
      view = "projects";
      renderProject();
    } else if (action === "tab") {
      projectTab = id;
      renderProject();
    } else if (action === "conversation") {
      conversationId = id;
      await api("conversation-read", { project_id: id });
      await loadInbox();
    } else if (action === "conversation-back") {
      conversationId = null;
      await loadInbox();
    } else if (action === "password-change") {
      modal(
        "Changer mon mot de passe",
        input("current_password", "Mot de passe actuel", "", "password", true) +
          input(
            "new_password",
            "Nouveau mot de passe (12 caractères minimum)",
            "",
            "password",
            true,
          ),
        (data) => api("password-change", data),
      );
    } else if (action === "logout") {
      await api("logout", {});
      state = {};
      projectId = null;
      auth();
    } else if (action === "geolocate") {
      if (!navigator.geolocation) {
        notify("Géolocalisation indisponible.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          dialog.querySelector("[name=site_latitude]").value =
            pos.coords.latitude.toFixed(6);
          dialog.querySelector("[name=site_longitude]").value =
            pos.coords.longitude.toFixed(6);
          notify("Position ajoutée au formulaire.");
        },
        () => notify("Position indisponible. Saisissez l’adresse du chantier."),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else if (action === "person") {
      personId = id;
      projectId = null;
      personTab = "profile";
      calendarData = await api("calendar", null, { user_id: id });
      renderPerson();
    } else if (action === "person-tab") {
      personTab = id;
      renderPerson();
    } else if (action === "person-edit") personEdit();
    else if (action === "event-edit") eventEdit(id);
    else if (action === "client-edit") clientEdit(id);
    else if (action === "project-edit") projectEdit(id);
    else if (action === "task-edit") taskEdit(id);
    else if (action === "request") await requestOpen(id);
    else if (action === "convert") {
      dialog.close();
      modal(
        "Créer le chantier",
        input("title", "Nom du projet", "", "text", true) +
          select(
            "client_id",
            "Rattacher à un client existant (facultatif)",
            [
              ["", "Créer la fiche du demandeur"],
              ...state.clients.map((c) => [c.id, c.name]),
            ],
            "",
            false,
          ),
        async (data) => {
          await api("request-convert", { ...data, id });
        },
      );
    } else if (action === "task-status")
      modal(
        "Mettre à jour ma tâche",
        select(
          "status",
          "Avancement",
          ["todo", "doing", "done"].map((s) => [s, label(s)]),
          details.tasks.find((t) => t.id === id).status,
        ),
        (data) => api("task-save", { ...data, id, project_id: projectId }),
      );
    else if (action === "invite") invite();
    else if (action === "assign")
      modal(
        "Attribuer un accès",
        select(
          "user_id",
          "Compte existant",
          state.people
            .filter((p) => p.role !== "admin" && p.active)
            .map((p) => [p.id, `${p.name} · ${label(p.role)}`]),
        ) +
          `<label class="check"><input type="checkbox" name="can_update_tasks">Autoriser la mise à jour des tâches attribuées</label>`,
        (data) =>
          api("member-save", {
            ...data,
            project_id: projectId,
            can_update_tasks: data.can_update_tasks === "on",
          }),
      );
    else if (action === "copy-invite") {
      await navigator.clipboard.writeText(
        document.querySelector("#invite-link").value,
      );
      notify("Lien copié.");
    } else if (
      [
        "user-disable",
        "invitation-revoke",
        "document-delete",
        "member-revoke",
        "event-delete",
      ].includes(action)
    ) {
      if (!confirm("Confirmer cette action ?")) return;
      await api(
        action,
        action === "member-revoke"
          ? { user_id: id, project_id: projectId }
          : { id },
      );
      if (personId)
        calendarData = await api("calendar", null, { user_id: personId });
      await refresh();
      notify("Action effectuée.");
    } else if (action === "ledger-edit") ledgerEdit(id);
    else if (action === "reset")
      modal(
        "Réinitialiser le mot de passe",
        input("email", "Adresse e-mail", "", "email", true),
        async (data) => {
          const r = await api("password-reset", data);
          notify(r.message);
        },
      );
  } catch (err) {
    notify(err.message);
  }
});
document.addEventListener("input", (ev) => {
  if (ev.target.id === "request-search") {
    const q = ev.target.value.toLowerCase();
    document.querySelector("#request-list").innerHTML = requestRows(
      state.requests.filter((r) =>
        `${r.name} ${r.email} ${label(r.category)} ${label(r.status)}`
          .toLowerCase()
          .includes(q),
      ),
    );
  }
});
document.addEventListener("submit", async (ev) => {
  if (
    !["message-form", "finance-filter", "inbox-compose"].includes(ev.target.id)
  )
    return;
  ev.preventDefault();
  const form = ev.target,
    data = Object.fromEntries(new FormData(form));
  try {
    if (form.id === "finance-filter") await loadFinance(data.from, data.to);
    else {
      const b = form.querySelector("button");
      b.disabled = true;
      const pid = form.id === "inbox-compose" ? conversationId : projectId,
        files = [...(form.querySelector("[name=attachments]")?.files || [])];
      if (files.length > 5) throw Error("Cinq pièces jointes maximum.");
      const document_ids = [];
      for (const file of files) {
        if (file.size > 3000000)
          throw Error("Chaque fichier doit faire moins de 3 Mo.");
        const content = await fileData(file);
        const saved = await api("document-upload", {
          project_id: pid,
          name: file.name,
          data: content,
          visibility: data.visibility || "client",
        });
        document_ids.push(saved.id);
      }
      await api("message", { ...data, project_id: pid, document_ids });
      if (form.id === "inbox-compose") await loadInbox();
      else await refresh();
      notify("Message et documents enregistrés.");
    }
  } catch (err) {
    const target = form.querySelector("[data-error]");
    if (target) target.textContent = err.message;
    else notify(err.message);
    form.querySelector("button").disabled = false;
  }
});
async function upload(files) {
  for (const file of files) {
    if (file.size > 3000000) {
      notify(`${file.name} dépasse 3 Mo.`);
      continue;
    }
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await api("document-upload", {
        project_id: projectId,
        name: file.name,
        data,
        visibility:
          document.querySelector("[name=document_visibility]")?.value ||
          "client",
      });
      notify(`${file.name} ajouté.`);
    } catch (err) {
      notify(err.message);
    }
  }
  await refresh();
}
document.addEventListener("change", (ev) => {
  if (ev.target.id === "files") upload([...ev.target.files]);
});
document.addEventListener("dragover", (ev) => {
  if (ev.target.closest("#dropzone")) {
    ev.preventDefault();
    document.querySelector("#dropzone").classList.add("drag");
  }
});
document.addEventListener("dragleave", (ev) => {
  if (ev.target.closest("#dropzone"))
    document.querySelector("#dropzone").classList.remove("drag");
});
document.addEventListener("drop", (ev) => {
  if (ev.target.closest("#dropzone")) {
    ev.preventDefault();
    upload([...ev.dataTransfer.files]);
  }
});
function personEdit() {
  const p = state.people.find((p) => p.id === personId);
  modal(
    "Fiche partenaire",
    input("name", "Nom et prénom", p.name, "text", true) +
      input("company", "Société", p.company) +
      input("trade", "Métier / rôle sur les chantiers", p.trade) +
      input("phone", "Téléphone", p.phone) +
      area("notes", "Notes internes ABK", p.notes),
    (data) => api("person-save", { ...data, id: personId }),
  );
}
function agendaRows(rows) {
  return table(
    ["Intervention", "Début", "Fin", "Projet", ""],
    rows.map((r) => [
      `<b>${e(r.title)}</b><p class="pre muted">${e(r.description)}</p>`,
      e(new Date(r.starts_at).toLocaleString("fr-FR")),
      e(new Date(r.ends_at).toLocaleString("fr-FR")),
      e(r.project_title || "Indisponibilité / hors chantier"),
      admin()
        ? btn("Modifier", "event-edit", r.id) +
          " " +
          btn("Supprimer", "event-delete", r.id, "danger")
        : "",
    ]),
  );
}
function renderPerson() {
  const p = state.people.find((p) => p.id === personId);
  if (!p) {
    personId = null;
    render();
    return;
  }
  const assigned = state.projects.filter((pr) =>
    (p.project_ids || []).includes(pr.id),
  );
  shell(
    heading(
      e(p.name),
      `${e(p.company || "Partenaire ABK")} · ${e(p.trade || label(p.role))}`,
      btn("Tous les partenaires", "nav", "people"),
    ) +
      `<div class="tabs">${btn("Fiche partenaire", "person-tab", "profile", personTab === "profile" ? "active" : "")}${p.role === "contractor" ? btn("Agenda", "person-tab", "calendar", personTab === "calendar" ? "active" : "") : ""}</div>` +
      (personTab === "calendar"
        ? `<div class="heading"><h2>Agenda des interventions</h2>${btn("Planifier une intervention", "event-edit", "", "primary")}</div><p class="muted">Horaires affichés dans le fuseau de votre navigateur. Les chevauchements sont bloqués.</p>${agendaRows(calendarData?.rows || [])}`
        : `<section class="panel"><div class="heading"><h2>Coordonnées et rôle</h2>${btn("Modifier la fiche", "person-edit")}</div><p><b>${e(p.company || "Société à renseigner")}</b><br>${e(p.trade || label(p.role))}</p><p><a href="mailto:${e(p.email)}">${e(p.email)}</a><br>${e(p.phone)}</p><h3>Notes internes</h3><p class="pre">${e(p.notes || "Aucune note.")}</p></section><h2>Projets attribués</h2>${projectRows(assigned)}<section class="panel"><h2>Tâches attribuées</h2>${table(
            ["Tâche", "Échéance", "État"],
            state.tasks
              .filter((t) => t.assignee_id === p.id)
              .map((t) => [e(t.title), day(t.due_date), badge(t.status)]),
          )}</section>`),
  );
}
async function renderCalendar() {
  if (!calendarData) {
    try {
      calendarData = await api("calendar");
      if (view === "calendar") renderCalendar();
    } catch (err) {
      notify(err.message);
    }
    return;
  }
  shell(
    heading(
      "Mon agenda.",
      "Vos interventions planifiées par ABK. Horaires dans le fuseau de votre navigateur.",
    ) +
      agendaRows(calendarData.rows) +
      `<section class="panel"><h2>Mes échéances de tâches</h2>${table(
        ["Tâche", "Échéance", "État"],
        state.tasks
          .filter((t) => t.assignee_id === state.user.id)
          .map((t) => [e(t.title), day(t.due_date), badge(t.status)]),
      )}</section>`,
  );
}
function eventEdit(id) {
  const r = calendarData?.rows.find((r) => r.id === id) || {},
    uid = personId || r.contractor_id;
  const local = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  modal(
    id ? "Modifier l’intervention" : "Planifier une intervention",
    input("title", "Intervention", r.title, "text", true) +
      select(
        "contractor_id",
        "Sous-traitant",
        state.people
          .filter((p) => p.role === "contractor" && p.active)
          .map((p) => [p.id, p.name]),
        uid,
      ) +
      select(
        "project_id",
        "Projet attribué (ou hors chantier)",
        [
          ["", "Hors chantier / indisponibilité"],
          ...state.projects.map((p) => [p.id, p.title]),
        ],
        r.project_id,
        false,
      ) +
      input(
        "starts_at",
        "Début (heure locale)",
        local(r.starts_at),
        "datetime-local",
        true,
      ) +
      input(
        "ends_at",
        "Fin (heure locale)",
        local(r.ends_at),
        "datetime-local",
        true,
      ) +
      area(
        "description",
        "Consignes visibles par ce partenaire",
        r.description,
      ),
    async (data) => {
      await api("event-save", {
        ...data,
        id: id || undefined,
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
      });
      calendarData = await api("calendar", null, {
        user_id: data.contractor_id,
      });
    },
  );
}
function siteContent(p) {
  const s = p.site_details || {},
    address = [s.address, s.postcode, s.city].filter(Boolean).join(" "),
    destination =
      s.latitude != null && s.longitude != null
        ? `${s.latitude},${s.longitude}`
        : address;
  const fields = (rows) =>
    rows
      .filter(([, v]) => v)
      .map(
        ([title, value]) =>
          `<div class="site-field"><h3>${e(title)}</h3><p class="pre">${e(value)}</p></div>`,
      )
      .join("") || '<p class="muted">À compléter dans le dossier.</p>';
  return `<div class="heading"><h2>Fiche chantier</h2>${admin() ? btn("Compléter le dossier", "project-edit", p.id, "primary") : ""}</div><div class="grid"><section class="panel"><h2>Lieu et contact</h2>${fields(
    [
      ["Adresse", address],
      ["Contact sur place", s.contact_name],
      ["Téléphone", s.contact_phone],
      ["E-mail", s.contact_email],
    ],
  )}${destination ? `<a class="button primary" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}" target="_blank" rel="noopener noreferrer">Ouvrir l’itinéraire</a>` : ""}</section><section class="panel"><h2>Accès et organisation</h2>${fields(
    [
      ["Consignes d’accès", s.access_notes],
      ["Stationnement et livraisons", s.parking],
      ["Horaires", s.working_hours],
      ["Réseaux et alimentation", s.utilities],
    ],
  )}</section><section class="panel"><h2>Le périmètre des travaux</h2>${fields([
    ["Type de bien", s.building_type],
    ["Occupation", s.occupancy],
    ["Surface / dimensions", s.surface],
    ["Travaux et livrables", s.work_scope],
    ["Contraintes et risques connus", s.risks],
  ])}</section><section class="panel"><h2>Autorisations et documents</h2>${fields(
    [
      ["État des autorisations", s.permit_status],
      ["Référence", s.permit_reference],
      ["Attestations à vérifier", s.insurance_reference],
    ],
  )}<p class="muted">Retrouvez les pièces déposées dans l’onglet Documents.</p></section>${admin() ? `<section class="panel"><h2>Informations privées ABK</h2>${p.budget_cents != null ? `<p>Budget de gestion HT : ${money(p.budget_cents)}</p>` : ""}<p class="pre">${e(p.internal_notes || "Aucune note interne.")}</p></section>` : ""}</div>`;
}
function attachmentLinks(message) {
  return (message.attachments || [])
    .map(
      (d) =>
        `<a class="attachment" href="/api/gestion?action=document&id=${e(d.id)}">↧ ${e(d.name)}</a>`,
    )
    .join("");
}
function fileData(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(Error("Fichier illisible."));
    r.readAsDataURL(file);
  });
}
async function loadInbox() {
  try {
    conversationRows = (await api("conversations")).rows;
    let conversation = conversationId
      ? await api("project", null, { id: conversationId })
      : null;
    if (view !== "messages") return;
    const list =
      conversationRows
        .map(
          (c) =>
            `<button class="conversation-item ${c.id === conversationId ? "selected" : ""}" data-action="conversation" data-id="${e(c.id)}"><span class="inline"><b>${e(c.title)}</b>${Number(c.unread) ? `<span class="badge new">${Number(c.unread)}</span>` : ""}</span><small>${e(admin() ? c.client_name : "Équipe ABK")}</small><span class="conversation-preview">${e(c.last_body || "Documents et échanges du projet")}</span></button>`,
        )
        .join("") ||
      '<p class="empty">Les conversations apparaîtront avec vos projets.</p>';
    shell(
      heading(
        "La messagerie.",
        "Conversations, documents et factures partagés dans leur dossier.",
      ) +
        `<div class="inbox ${conversation ? "is-open" : ""}"><aside class="conversation-list" aria-label="Conversations"><h2>Conversations</h2>${list}</aside><section class="conversation-thread">${conversation ? `<div class="heading"><div><h2>${e(conversation.project.title)}</h2><p>${e(admin() ? conversationRows.find((c) => c.id === conversationId)?.client_name || "" : "Équipe ABK")}</p></div>${btn("Toutes les conversations", "conversation-back", "", "mobile-back")}</div><div class="thread" id="inbox-thread">${conversation.messages.map((m) => `<article class="message ${m.author_id === state.user.id ? "mine" : ""}"><small>${e(m.author_name)} · ${e(new Date(m.created_at).toLocaleString("fr-FR"))} · ${e(label(m.visibility))}</small><p class="pre">${e(m.body)}</p>${attachmentLinks(m)}</article>`).join("") || '<p class="empty">Commencez la conversation.</p>'}</div><form id="inbox-compose">${area("body", "Votre message")}${admin() ? select("visibility", "Destinataires", vis(), "client") : ""}<label>Documents ou factures PDF (5 maximum, 3 Mo chacun)<input name="attachments" type="file" multiple accept="application/pdf,image/png,image/jpeg"></label><p class="error" data-error></p><button class="primary">Envoyer le message</button></form>` : '<div class="empty"><h2>Vos échanges, au même endroit.</h2><p>Sélectionnez une conversation pour retrouver les messages et pièces jointes.</p></div>'}</section></div>`,
    );
    const thread = document.querySelector("#inbox-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  } catch (err) {
    notify(err.message);
  }
}
if (location.hash.includes("invitation=")) auth();
else refresh().catch((err) => auth(err.status === 401 ? "" : err.message));
