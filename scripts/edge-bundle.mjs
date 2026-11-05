import { readFile, readdir } from "node:fs/promises";
const config = JSON.parse(await readFile(".env.provision.local", "utf8"));
const files = [];
for (const name of await readdir("server"))
  if (name.endsWith(".mjs"))
    files.push({
      name: "server/" + name,
      content: await readFile("server/" + name, "utf8"),
    });
files.push({
  name: "edge/deno.json",
  content: await readFile("edge/deno.json", "utf8"),
});
files.push({
  name: "edge/index.ts",
  content: (await readFile("edge/index.ts", "utf8"))
    .replace("__BACKEND_TOKEN_SHA256__", config.ABK_BACKEND_TOKEN_HASH)
    .replace("__APP_ORIGIN__", config.APP_ORIGIN),
});
// Only token digests, never credentials, are included in the bundle output.
console.log(JSON.stringify(files));
