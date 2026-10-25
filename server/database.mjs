import pg from "pg";
let pool;
export function database() {
  if (!process.env.DATABASE_URL)
    throw Object.assign(
      new Error(
        "Base de données non configurée. Aucun dossier n’est enregistré.",
      ),
      { status: 503 },
    );
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  return pool;
}
export async function transaction(db, fn) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
