/* Public, read-only presentation. Every record below is fictitious.
   This page never sends application API calls and never stores personal data. */
(() => {
  const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const now = new Date(),
    date = (offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    };
  const stamp = (offset = 0) => date(offset) + "T09:00:00.000Z";
  const people = [
    {
      id: uuid(1),
      name: "Équipe ABK · présentation",
      email: "direction@abk.example",
      role: "admin",
      active: true,
      company: "ABK",
      trade: "Direction et coordination",
      phone: "",
      notes: "Profil fictif de présentation.",
      project_ids: [uuid(10), uuid(11), uuid(12)],
    },
    {
      id: uuid(2),
      name: "Partenaire maçonnerie · exemple",
      email: "maconnerie@abk.example",
      role: "contractor",
      active: true,
      company: "Atelier partenaire · exemple",
      trade: "Maçonnerie et terrassement",
      phone: "Non renseigné",
      notes:
        "Fiche fictive. Les coordonnées et notes privées seront renseignées dans la version réelle.",
      project_ids: [uuid(10), uuid(11)],
    },
    {
      id: uuid(3),
      name: "Partenaire équipements · exemple",
      email: "equipements@abk.example",
      role: "contractor",
      active: true,
      company: "Équipements · exemple",
      trade: "Installation et raccordement",
      phone: "Non renseigné",
      notes: "Exemple de profil sous-traitant.",
      project_ids: [uuid(10), uuid(12)],
    },
  ];
  const clients = [
    {
      id: uuid(20),
      name: "Client piscine · exemple",
      email: "piscine@client.example",
      phone: "Non renseigné",
      address: "Adresse de présentation",
      notes: "Données fictives.",
    },
    {
      id: uuid(21),
      name: "Client rénovation · exemple",
      email: "renovation@client.example",
      phone: "Non renseigné",
      address: "Adresse de présentation",
      notes: "Données fictives.",
    },
    {
      id: uuid(22),
      name: "Client réserve incendie · exemple",
      email: "incendie@client.example",
      phone: "Non renseigné",
      address: "Adresse de présentation",
      notes: "Données fictives.",
    },
  ];
  const projects = [
    {
      id: uuid(10),
      client_id: uuid(20),
      client_name: clients[0].name,
      title: "Piscine & terrasse · exemple",
      category: "piscine",
      status: "active",
      start_date: date(-12),
      due_date: date(25),
      description:
        "Création d’un bassin et aménagement de sa terrasse. Dossier fictif pour présenter le suivi ABK.",
      budget_cents: 4200000,
      internal_notes:
        "Exemple de note interne réservée à ABK. Aucun engagement commercial réel.",
      site_details: {
        address: "Adresse fictive du chantier",
        city: "Commune à renseigner",
        contact_name: "Contact client · exemple",
        contact_phone: "Non renseigné",
        building_type: "Maison individuelle",
        occupancy: "Logement occupé",
        surface: "Bassin et terrasse — dimensions à confirmer",
        work_scope:
          "Terrassement, structure du bassin, réseaux, filtration et aménagement extérieur.",
        access_notes:
          "Prévoir une visite technique pour confirmer le passage des engins.",
        parking: "Zone de livraison à définir avec le client.",
        working_hours: "Horaires à valider avant intervention",
        utilities: "Repérage des réseaux existants avant terrassement",
        risks: "Accès et réseaux à vérifier sur site",
        permit_status: "Dossier administratif à vérifier",
        permit_reference: "Exemple — aucune autorisation réelle",
      },
    },
    {
      id: uuid(11),
      client_id: uuid(21),
      client_name: clients[1].name,
      title: "Rénovation d’une maison · exemple",
      category: "renovation",
      status: "planning",
      start_date: date(7),
      due_date: date(70),
      description:
        "Exemple de rénovation intérieure avec plusieurs corps de métier.",
      budget_cents: 6800000,
      internal_notes: "Dossier de démonstration.",
      site_details: {
        address: "Adresse fictive du chantier",
        building_type: "Maison",
        occupancy: "Bien vacant",
        work_scope: "Préparation, second œuvre et finitions.",
        access_notes: "Accès à organiser avec le contact du chantier.",
        permit_status: "À confirmer",
      },
    },
    {
      id: uuid(12),
      client_id: uuid(22),
      client_name: clients[2].name,
      title: "Réserve incendie · exemple",
      category: "incendie",
      status: "active",
      start_date: date(-5),
      due_date: date(18),
      description:
        "Exemple de coordination pour une réserve incendie, selon les prescriptions reçues.",
      budget_cents: 2300000,
      internal_notes: "Chiffrage fictif uniquement.",
      site_details: {
        address: "Adresse fictive du site",
        building_type: "Site professionnel",
        work_scope:
          "Préparation du support, installation et raccordement de la réserve.",
        access_notes: "Accès aux livraisons à confirmer.",
        permit_status: "Prescriptions du service compétent à collecter",
      },
    },
  ];
  const task = (n, p, title, status, offset, assignee = uuid(2)) => ({
    id: uuid(n),
    project_id: p,
    title,
    description: "Étape fictive du planning de présentation.",
    status,
    due_date: date(offset),
    assignee_id: assignee,
    assignee_name: people.find((p) => p.id === assignee)?.name,
    visibility: "shared",
  });
  const tasks = [
    task(30, uuid(10), "Valider l’implantation", "done", -8),
    task(31, uuid(10), "Préparer le terrassement", "doing", 3),
    task(32, uuid(10), "Installer les équipements", "todo", 12, uuid(3)),
    task(33, uuid(11), "Réaliser la visite technique", "todo", 4),
    task(34, uuid(11), "Confirmer le planning des intervenants", "todo", 8),
    task(35, uuid(12), "Vérifier les prescriptions reçues", "done", -2),
    task(
      36,
      uuid(12),
      "Préparer le support et les raccordements",
      "doing",
      5,
      uuid(3),
    ),
  ];
  const messages = [
    {
      id: uuid(40),
      project_id: uuid(10),
      author_id: uuid(1),
      author_name: "Équipe ABK · exemple",
      body: "Le planning prévisionnel est disponible dans le dossier. Les prochaines étapes seront mises à jour au fur et à mesure.",
      visibility: "client",
      created_at: stamp(-2),
      attachments: [],
    },
    {
      id: uuid(41),
      project_id: uuid(10),
      author_id: uuid(20),
      author_name: "Client · exemple",
      body: "Merci, je retrouve bien les étapes et les documents du projet.",
      visibility: "client",
      created_at: stamp(-1),
      attachments: [],
    },
    {
      id: uuid(42),
      project_id: uuid(10),
      author_id: uuid(1),
      author_name: "Équipe ABK · exemple",
      body: "Voici comment les documents et les factures PDF existantes apparaîtront dans une conversation.",
      visibility: "client",
      created_at: stamp(),
      attachments: [
        { id: uuid(50), name: "Exemple de facture PDF — aperçu uniquement" },
      ],
    },
    {
      id: uuid(43),
      project_id: uuid(12),
      author_id: uuid(1),
      author_name: "Équipe ABK · exemple",
      body: "La coordination de l’intervention sera confirmée après vérification du dossier technique.",
      visibility: "shared",
      created_at: stamp(),
      attachments: [],
    },
  ];
  const documents = [
    {
      id: uuid(50),
      project_id: uuid(10),
      name: "Facture — exemple de pièce jointe",
      mime: "application/pdf",
      size: 180000,
      visibility: "client",
      created_at: stamp(),
    },
    {
      id: uuid(51),
      project_id: uuid(10),
      name: "Plan d’implantation — exemple",
      mime: "application/pdf",
      size: 620000,
      visibility: "shared",
      created_at: stamp(-3),
    },
  ];
  const requests = [
    {
      id: uuid(60),
      name: "Demande piscine · exemple",
      email: "prospect@client.example",
      phone: "Non renseigné",
      category: "piscine",
      content:
        "Exemple de questionnaire reçu : création de piscine, aménagement de terrasse, étude des accès et du calendrier souhaité.",
      source: "Page piscines",
      status: "new",
      created_at: stamp(),
    },
    {
      id: uuid(61),
      name: "Demande rénovation · exemple",
      email: "projet@client.example",
      phone: "Non renseigné",
      category: "renovation",
      content:
        "Exemple de demande de rénovation : visite technique souhaitée et définition des travaux.",
      source: "Page bâtiment & rénovation",
      status: "qualified",
      created_at: stamp(-2),
    },
  ];
  const events = [
    {
      id: uuid(70),
      contractor_id: uuid(2),
      project_id: uuid(10),
      project_title: projects[0].title,
      title: "Visite technique · exemple",
      description: "Confirmation des accès et de l’implantation.",
      starts_at: date(2) + "T08:00:00.000Z",
      ends_at: date(2) + "T10:00:00.000Z",
    },
    {
      id: uuid(71),
      contractor_id: uuid(3),
      project_id: uuid(12),
      project_title: projects[2].title,
      title: "Préparation des raccordements · exemple",
      description: "Créneau fictif de présentation.",
      starts_at: date(4) + "T08:00:00.000Z",
      ends_at: date(4) + "T11:00:00.000Z",
    },
  ];
  const ledger = [
    {
      id: uuid(80),
      project_id: uuid(10),
      project_title: projects[0].title,
      kind: "income",
      state: "paid",
      label: "Acompte client · exemple",
      category: "Chantier piscine",
      date: date(-8),
      net_cents: 1000000,
      vat_cents: 200000,
      note: "Montants fictifs.",
    },
    {
      id: uuid(81),
      project_id: uuid(10),
      project_title: projects[0].title,
      kind: "expense",
      state: "paid",
      label: "Approvisionnement · exemple",
      category: "Matériaux",
      date: date(-4),
      net_cents: 350000,
      vat_cents: 70000,
      note: "Montants fictifs.",
    },
    {
      id: uuid(82),
      project_id: uuid(12),
      project_title: projects[2].title,
      kind: "income",
      state: "invoiced",
      label: "Situation de travaux · exemple",
      category: "Réserve incendie",
      date: date(-1),
      net_cents: 500000,
      vat_cents: 100000,
      note: "Montants fictifs.",
    },
    {
      id: uuid(83),
      project_id: uuid(11),
      project_title: projects[1].title,
      kind: "income",
      state: "planned",
      label: "Prévision de démarrage · exemple",
      category: "Rénovation",
      date: date(10),
      net_cents: 800000,
      vat_cents: 160000,
      note: "Montants fictifs.",
    },
  ];
  function result(action, b) {
    if (action === "bootstrap")
      return {
        user: people[0],
        csrf: "public-read-only-demo",
        projects,
        tasks,
        clients,
        requests,
        people,
        invitations: [],
      };
    if (action === "project") {
      const project = projects.find((p) => p.id === b.id);
      if (!project) throw Error("Exemple introuvable.");
      return {
        project,
        tasks: tasks.filter((t) => t.project_id === b.id),
        messages: messages.filter((m) => m.project_id === b.id),
        documents: documents.filter((d) => d.project_id === b.id),
        members: people
          .filter(
            (p) => p.role === "contractor" && p.project_ids.includes(b.id),
          )
          .map((p) => ({
            ...p,
            user_id: p.id,
            project_id: b.id,
            can_update_tasks: true,
          })),
      };
    }
    if (action === "conversations")
      return {
        rows: projects.map((p) => {
          const m = messages.filter((m) => m.project_id === p.id).at(-1);
          return {
            id: p.id,
            title: p.title,
            client_name: p.client_name,
            last_body: m?.body,
            last_at: m?.created_at,
            unread: 0,
          };
        }),
      };
    if (action === "calendar")
      return { rows: events.filter((ev) => ev.contractor_id === b.user_id) };
    if (action === "request-thread") return { messages: [] };
    if (action === "conversation-read") return { ok: true };
    if (action === "finance") {
      const rows = ledger.filter((r) => r.date >= b.from && r.date <= b.to),
        totals = {
          paid_income: 0,
          paid_expense: 0,
          invoiced_income: 0,
          planned_income: 0,
        };
      for (const r of rows) {
        const gross = r.net_cents + r.vat_cents;
        if (r.state === "paid")
          totals[r.kind === "income" ? "paid_income" : "paid_expense"] += gross;
        if (r.kind === "income" && r.state === "invoiced")
          totals.invoiced_income += gross;
        if (r.kind === "income" && r.state === "planned")
          totals.planned_income += gross;
      }
      return { from: b.from, to: b.to, rows, totals };
    }
    if (action === "audit")
      return {
        rows: [
          {
            id: uuid(90),
            actor_name: "Présentation ABK",
            action: "Données fictives de démonstration",
            entity_id: "Aucune opération réelle",
            created_at: stamp(),
          },
        ],
      };
    throw Error(
      "Présentation en lecture seule : aucun enregistrement ni envoi réel. La version de production nécessite l’activation de Supabase.",
    );
  }
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input.url,
      location.href,
    );
    if (url.origin !== location.origin || url.pathname !== "/api/gestion")
      return nativeFetch(input, init);
    try {
      const action = url.searchParams.get("action") || "bootstrap",
        b = init?.body
          ? JSON.parse(init.body)
          : Object.fromEntries(url.searchParams);
      return new Response(JSON.stringify(result(action, b)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.pathname === "/api/gestion") {
        event.preventDefault();
        const notice = document.querySelector("#notice");
        notice.textContent =
          "Les fichiers et exports réels ne sont pas disponibles dans cette présentation fictive.";
        setTimeout(() => (notice.textContent = ""), 6000);
      }
    },
    true,
  );
})();
