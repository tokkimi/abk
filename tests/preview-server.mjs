// Local browser QA only: ephemeral PostgreSQL, reserved example addresses, no production credentials.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { createHandler } from "../server/app.mjs";
import { passwordHash } from "../server/security.mjs";
process.env.NODE_ENV = "test";
process.env.AUTH_PROVIDER = "local-test";
process.env.APP_ORIGIN = "http://localhost:4317";
const db = new PGlite();
await db.exec(
  await readFile(new URL("../server/schema.sql", import.meta.url), "utf8"),
);
const uid = randomUUID(),
  cid = randomUUID(),
  pid = randomUUID();
await db.query(
  "INSERT INTO abk_users(id,email,name,role,password_hash) VALUES($1,'admin@abk.example','ABK · Test local','admin',$2)",
  [uid, await passwordHash("Preview-only-2026")],
);
await db.query(
  "INSERT INTO abk_clients(id,name,email) VALUES($1,'Client de test','client@abk.example')",
  [cid],
);
await db.query(
  "INSERT INTO abk_projects(id,client_id,title,category,status,due_date) VALUES($1,$2,'Piscine · dossier de test','piscine','active','2026-12-01')",
  [pid, cid],
);
const contractor = randomUUID();
await db.query(
  "INSERT INTO abk_users(id,email,name,role,password_hash,trade) VALUES($1,'contractor@abk.example','Artisan · test local','contractor',$2,'Maçonnerie')",
  [contractor, await passwordHash("Preview-only-2026")],
);
await db.query(
  "INSERT INTO abk_members(project_id,user_id,can_update_tasks) VALUES($1,$2,true)",
  [pid, contractor],
);
const handler = createHandler(() => ({
  query: (s, a) => db.query(s, a),
  connect: async () => ({ query: (s, a) => db.query(s, a), release() {} }),
}));
const base = resolve(import.meta.dirname, "../dist");
const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/gestion")) {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4200000) {
          res.writeHead(413).end();
          return;
        }
      }
      req.body = body || {};
      res.status = (n) => {
        res.statusCode = n;
        return res;
      };
      res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };
      res.send = (data) => res.end(data);
      await handler(req, res);
      return;
    }
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = resolve(
      base,
      "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
    );
    if (!file.startsWith(base)) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".webp": "image/webp",
        ".png": "image/png",
      }[extname(file)] || "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
server.listen(4317, "127.0.0.1", () =>
  console.log("Local QA: http://localhost:4317/gestion/ (ephemeral test data)"),
);
for (const event of ["SIGINT", "SIGTERM"])
  process.on(event, () =>
    server.close(async () => {
      await db.close();
      process.exit();
    }),
  );
