import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const config = JSON.parse(await readFile(".env.provision.local", "utf8"));
const target=process.argv[2]||'preview';
if(!['preview','production'].includes(target))throw Error('Invalid Vercel environment');
const cli =
  process.env.VERCEL_CLI_PATH ||
  resolve(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js");
for (const name of ["ABK_BACKEND_URL", "ABK_BACKEND_TOKEN", "APP_ORIGIN"]) {
  execFileSync(
    process.execPath,
    [
      cli,
      "env",
      "add",
      name,
      target,
      "--sensitive",
      "--force",
      "--yes",
      "--scope",
      "tokkimis-projects",
    ],
    { input: config[name], encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
  console.log(`${name}: configured in Vercel ${target}.`);
}
