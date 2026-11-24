import { randomUUID } from "node:crypto";
import { database, transaction } from "../server/database.mjs";
import { email, passwordHash } from "../server/security.mjs";
import { createAccount } from "../server/accounts.mjs";
const address = email(process.env.ADMIN_EMAIL),
  hash = await passwordHash(process.env.ADMIN_PASSWORD);
const db = database();
try {
  await transaction(db, async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock(774201)");
    const { rows } = await tx.query(
      "SELECT id FROM abk_users WHERE role='admin'",
    );
    if (rows.length)
      throw Error("Un administrateur existe déjà. Aucune modification.");
    const uid = randomUUID(),
      name = process.env.ADMIN_NAME || "Administration ABK";
    const accountHash = await createAccount(
      uid,
      address,
      process.env.ADMIN_PASSWORD,
      name,
    );
    await tx.query(
      "INSERT INTO abk_users(id,email,name,role,password_hash) VALUES($1,$2,$3,'admin',$4)",
      [uid, address, name, accountHash],
    );
  });
  console.log("Administrateur créé. Aucun mot de passe affiché.");
} finally {
  await db.end();
  delete process.env.ADMIN_PASSWORD;
}
