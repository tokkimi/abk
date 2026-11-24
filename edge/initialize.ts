// One-time provisioning entry point. Replace with a disabled handler after use.
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
const expected = Buffer.from("__BOOTSTRAP_SHA256__", "hex");
globalThis.__ABK_SERVER_ENV = {
  DATABASE_URL: Deno.env.get("SUPABASE_DB_URL"),
  SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY:
    JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
};
const { database, transaction } = await import("../server/database.mjs");
const { createAccount } = await import("../server/accounts.mjs");
const { email, passwordHash } = await import("../server/security.mjs");
Deno.serve(async (req) => {
  const actual = createHash("sha256")
    .update(req.headers.get("x-abk-initialize") || "")
    .digest();
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual) ||
    req.method !== "POST"
  )
    return new Response(null, { status: 401 });
  try {
    const body = await req.json(),
      address = email(body.email);
    await passwordHash(body.password);
    const result = await transaction(database(), async (tx) => {
      await tx.query("SELECT pg_advisory_xact_lock(774201)");
      const exists = await tx.query(
        "SELECT id FROM abk_users WHERE role='admin'",
      );
      if (exists.rows.length) throw Error("Administrator already exists");
      const uid = randomUUID();
      await createAccount(uid, address, body.password, "Direction ABK");
      await tx.query(
        "INSERT INTO abk_users(id,email,name,role) VALUES($1,$2,'Direction ABK','admin')",
        [uid, address],
      );
      return { id: uid, created: true };
    });
    return Response.json(result);
  } catch (error) {
    console.error(
      "ABK initialization failed",
      error.name,
      error.status || error.code || "",
    );
    return Response.json(
      { error: "Provisioning not completed." },
      { status: 400 },
    );
  }
});
