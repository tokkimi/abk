import localHandler from "../server/app.mjs";

// Supabase holds database/Auth credentials; Vercel only holds a scoped bridge token.
export default async function handler(req, res) {
  if (!process.env.ABK_BACKEND_URL) return localHandler(req, res);
  res.setHeader("Cache-Control", "no-store");
  const origin = new URL(process.env.APP_ORIGIN).origin;
  const backendOrigin = new URL(process.env.ABK_BACKEND_ORIGIN || origin).origin;
  if (req.method === "POST" && req.headers.origin !== origin)
    return res.status(403).json({ error: "Origine non autorisée." });
  try {
    const target = new URL(process.env.ABK_BACKEND_URL);
    target.search = new URL(req.url, origin).search;
    const headers = {
      "x-abk-backend-token": process.env.ABK_BACKEND_TOKEN,
      "content-type": req.headers["content-type"] || "application/json",
    };
    for (const key of ["origin", "x-csrf-token"])
      if (req.headers[key]) headers[key] = req.headers[key];
    // The authenticated relay checks the public origin before adapting to the
    // backend's separately configured origin. Never trust a caller-supplied host.
    if (headers.origin) headers.origin = backendOrigin;
    const sessionCookie = (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("abk_session="));
    if (sessionCookie) headers.cookie = sessionCookie;
    headers["x-forwarded-for"] = String(
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown",
    );
    const result = await fetch(target, {
      method: req.method,
      headers,
      body:
        req.method === "POST"
          ? typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body)
          : undefined,
      signal: AbortSignal.timeout(45000),
      redirect: "error",
    });
    for (const key of [
      "content-type",
      "content-disposition",
      "x-content-type-options",
      "referrer-policy",
    ]) {
      const value = result.headers.get(key);
      if (value) res.setHeader(key, value);
    }
    const sessionCookies = result.headers
      .getSetCookie()
      .filter((value) => value.startsWith("abk_session="));
    if (sessionCookies.length) res.setHeader("Set-Cookie", sessionCookies);
    if (result.headers.get("content-type")?.includes("application/json")) {
      const adapt = value => typeof value === "string"
        ? value.replaceAll(backendOrigin + "/gestion/", origin + "/gestion/")
        : Array.isArray(value) ? value.map(adapt)
        : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key,item]) => [key,adapt(item)])) : value;
      return res.status(result.status).json(adapt(await result.json()));
    }
    return res.status(result.status).send(Buffer.from(await result.arrayBuffer()));
  } catch {
    return res.status(503).json({
      error:
        "Le service de gestion est temporairement indisponible. Réessayez dans un instant.",
    });
  }
}
