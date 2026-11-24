import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || "playwright");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4317/gestion/");
  await page.getByLabel("Adresse e-mail").fill("admin@abk.example");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("Preview-only-2026");
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await page
    .getByRole("heading", { name: "Chaque projet, une vision claire." })
    .waitFor();
  await page.getByRole("button", { name: "Clients", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un client" }).click();
  await page.getByLabel("Nom / raison sociale").fill("Client navigateur");
  await page.getByLabel("E-mail", { exact: true }).fill("browser@abk.example");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText("Client navigateur", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Chantiers", exact: true }).click();
  await page
    .getByRole("button", { name: "Nouveau projet", exact: true })
    .click();
  await page
    .getByLabel("Intitulé", { exact: true })
    .fill("Dossier chantier navigateur");
  await page
    .getByLabel("Adresse du chantier", { exact: true })
    .fill("10 rue du chantier");
  await page.getByLabel("Ville", { exact: true }).fill("Exemple");
  await page
    .getByLabel("Contact sur place", { exact: true })
    .fill("Responsable de test");
  await page
    .getByLabel("Accès au logement / terrain (partagé avec les membres)")
    .fill("Accès par le portail principal");
  await page
    .getByLabel("Notes internes, réserves commerciales ou codes sensibles")
    .fill("Note privée de test");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page
    .getByText("Dossier chantier navigateur", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Ouvrir", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Fiche chantier", exact: true })
    .click();
  await page.getByText("10 rue du chantier Exemple", { exact: true }).waitFor();
  assert.match(
    await page
      .getByRole("link", { name: "Ouvrir l’itinéraire" })
      .getAttribute("href"),
    /destination=/,
  );
  await page
    .getByRole("button", { name: "Planning & tâches", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajouter une tâche" }).click();
  await page
    .getByLabel("Tâche", { exact: true })
    .fill("Valider le terrassement");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText("Valider le terrassement", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Messages", exact: true }).click();
  await page
    .getByLabel("Votre message")
    .fill("Validation du planning de test.");
  await page
    .locator("[name=attachments]")
    .setInputFiles({
      name: "facture-test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nTest invoice"),
    });
  await page.getByRole("button", { name: "Envoyer dans le dossier" }).click();
  await page
    .getByText("Validation du planning de test.", { exact: true })
    .waitFor();
  await page.getByRole("link", { name: "↧ facture-test.pdf" }).waitFor();
  await page
    .getByRole("button", { name: "Accès au dossier", exact: true })
    .click();
  await page.getByRole("button", { name: "Inviter une personne" }).click();
  await page.getByLabel("Nom et prénom").fill("Partenaire test");
  await page.getByLabel("E-mail invité").fill("partenaire@abk.example");
  await page.getByLabel("Profil", { exact: true }).selectOption("contractor");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("heading", { name: "Invitation créée" }).waitFor();
  assert.match(await page.locator("#invite-link").inputValue(), /#invitation=/);
  await page.getByRole("button", { name: "Comptabilité", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une écriture" }).click();
  await page.getByLabel("Libellé", { exact: true }).fill("Acompte test");
  await page.getByLabel("Catégorie de gestion").fill("Chantier");
  await page.getByLabel("Montant HT (EUR)").fill("1000");
  await page.getByLabel("TVA (EUR)").fill("200");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText("Acompte test", { exact: true }).waitFor();
  const dateBox = await page
      .locator("#finance-filter input[name=from]")
      .boundingBox(),
    filterButton = await page.locator("#finance-filter button").boundingBox();
  assert.ok(
    Math.abs(
      dateBox.y + dateBox.height - filterButton.y - filterButton.height,
    ) < 2,
    "Finance controls must align",
  );
  assert.ok(
    await page
      .locator(".sidebar nav button")
      .evaluateAll((nodes) =>
        nodes.every((n) => getComputedStyle(n).textAlign === "left"),
      ),
  );
  await page.screenshot({
    path: process.env.QA_SCREENSHOT || "../admin-desktop-qa.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Accès & partenaires", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Artisan · test local", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Modifier la fiche", exact: true })
    .click();
  await page.getByLabel("Société", { exact: true }).fill("Artisan de test");
  await page.getByLabel("Métier / rôle sur les chantiers").fill("Maçon");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await page
    .getByRole("button", { name: "Planifier une intervention" })
    .click();
  await page
    .getByLabel("Intervention", { exact: true })
    .fill("Visite de chantier");
  await page.getByLabel("Début (heure locale)").fill("2026-11-03T09:00");
  await page.getByLabel("Fin (heure locale)").fill("2026-11-03T10:00");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText("Visite de chantier", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Messagerie", exact: true }).click();
  await page.locator("[data-action=conversation]").first().click();
  await page.getByRole("link", { name: "↧ facture-test.pdf" }).waitFor();
  await page.screenshot({ path: "../admin-inbox-qa.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.getByRole("button", { name: "Toutes les conversations" }).click();
  await page.locator("[data-action=conversation]").first().click();
  await page.getByLabel("Votre message").fill("Message mobile de test");
  await page
    .getByRole("button", { name: "Envoyer le message", exact: true })
    .click();
  await page
    .locator("#inbox-thread")
    .getByText("Message mobile de test", { exact: true })
    .waitFor();
  await page.screenshot({
    path: "../admin-inbox-mobile-qa.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Vue d’ensemble", exact: true })
    .click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({ path: "../admin-mobile-qa.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "Browser QA passed: construction dossier, map link, task, invoice attachment, invitation, accounting alignment, partner profile/calendar, desktop and mobile inbox.",
  );
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0];
  if (page) {
    await page.screenshot({ path: "../admin-error-qa.png", fullPage: true });
    console.error(await page.locator("#modal-content").innerHTML());
  }
  throw error;
} finally {
  await browser.close();
}
