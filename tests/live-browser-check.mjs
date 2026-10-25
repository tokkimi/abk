import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const c = JSON.parse(await readFile(".env.provision.local", "utf8"));
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || "playwright"),
  browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(c.APP_ORIGIN + "/",{waitUntil:'domcontentloaded'});
  await page.getByRole('link',{name:'Connexion à votre espace',exact:true}).click();
  await page.waitForURL('**/gestion/');
  await page.getByLabel("Adresse e-mail").fill(c.ADMIN_EMAIL);
  await page.getByLabel("Mot de passe", { exact: true }).fill(c.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();
  await page
    .getByRole("heading", { name: "Chaque projet, une vision claire." })
    .waitFor({ timeout: 45000 });
  await page.reload();
  await page
    .getByRole("heading", { name: "Chaque projet, une vision claire." })
    .waitFor();
  await page.getByRole("button", { name: "Comptabilité", exact: true }).click();
  await page.getByRole("link", { name: "Rapport PDF", exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Vue d’ensemble", exact: true })
    .click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page
    .getByRole("button", { name: "Déconnexion", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Me connecter", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Live browser verification passed: real admin login, session after reload, accounting, mobile layout, logout.",
  );
} catch(error){const page=browser.contexts()[0]?.pages()[0];if(page){console.error((await page.locator('body').innerText()).slice(0,1600));await page.screenshot({path:'../live-login-check.png',fullPage:true});}throw error;
} finally {
  await browser.close();
}
