import { readFile } from "node:fs/promises";
import { database } from "../server/database.mjs";
const db = database();
try {
  await db.query(
    await readFile(new URL("../server/schema.sql", import.meta.url), "utf8"),
  );
  console.log("Schéma ABK prêt.");
} finally {
  await db.end();
}
