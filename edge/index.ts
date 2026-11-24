import { createHash, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

const tokenHash = "__BACKEND_TOKEN_SHA256__";
globalThis.__ABK_SERVER_ENV = {
  NODE_ENV: "production",
  APP_ORIGIN: "__APP_ORIGIN__",
  DATABASE_URL: Deno.env.get("SUPABASE_DB_URL"),
  SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY:
    JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  RESEND_API_KEY: Deno.env.get("RESEND_API_KEY"),
  EMAIL_FROM: Deno.env.get("EMAIL_FROM"),
  TURNSTILE_SECRET_KEY: Deno.env.get("TURNSTILE_SECRET_KEY"),
};
const { default: handler } = await import("../server/app.mjs");

Deno.serve(async (request) => {
  const raw = request.headers.get("x-abk-backend-token") || "";
  const actual = createHash("sha256").update(raw).digest();
  const expected = Buffer.from(tokenHash, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  if (!["GET", "POST"].includes(request.method))
    return new Response(null, { status: 405 });
  const headers = Object.fromEntries(request.headers);
  const req = {
    url: request.url,
    method: request.method,
    headers,
    body: request.method === "POST" ? await request.text() : {},
    socket: { remoteAddress: headers["x-forwarded-for"] || "unknown" },
  };
  if (typeof req.body === "string" && Buffer.byteLength(req.body) > 4200000)
    return Response.json(
      { error: "Contenu trop volumineux." },
      { status: 413 },
    );
  const output = new Headers();
  let status = 200,
    response;
  const res = {
    setHeader(name, value) {
      output.set(name, String(value));
    },
    status(value) {
      status = value;
      return res;
    },
    json(value) {
      output.set("Content-Type", "application/json");
      response = new Response(JSON.stringify(value), {
        status,
        headers: output,
      });
    },
    send(value) {
      response = new Response(value, { status, headers: output });
    },
  };
  await handler(req, res);
  return (
    response ||
    Response.json({ error: "Réponse indisponible." }, { status: 500 })
  );
});
