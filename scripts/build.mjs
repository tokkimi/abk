import { readdir, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  out = resolve(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of await readdir(root))
  if (/\.(html|css|js)$/.test(name)||['robots.txt','sitemap.xml'].includes(name))
    await cp(resolve(root, name), resolve(out, name));
for (const name of ["public", "gestion", "demo"])
  await cp(resolve(root, name), resolve(out, name), { recursive: true });
await writeFile(
  resolve(out, "quote-config.js"),
  "window.ABK_QUOTE_SITE_KEY=" +
    JSON.stringify(process.env.TURNSTILE_SITE_KEY || "") +
    ";\n",
);
console.log(
  "Site et espace de gestion construits dans dist. Sources serveur et secrets exclus.",
);
