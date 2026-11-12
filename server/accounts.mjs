import { env } from "./runtime.mjs";
import { fail, passwordHash, passwordMatches } from "./security.mjs";
function config() {
  const url = env.SUPABASE_URL,
    key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    fail(
      503,
      "La connexion Supabase doit être configurée avant d’ouvrir les comptes.",
    );
  return { url, key };
}
async function call(path, body, method = "POST") {
  const { url, key } = config();
  const r = await fetch(`${url}/auth/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok)
    fail(
      r.status === 429 ? 429 : 400,
      "Connexion ou activation refusée. Vérifiez votre adresse et votre mot de passe.",
    );
  return data;
}
const localTest = () =>
  env.NODE_ENV === "test" && env.AUTH_PROVIDER === "local-test";
export async function verifyAccount(address, password, local) {
  if (localTest())
    return !!local && (await passwordMatches(password, local.password_hash));
  const data = await call("token?grant_type=password", {
    email: address,
    password,
  });
  return !!local && data.user?.id === local.id;
}
export async function createAccount(uid, address, password, name) {
  if (localTest()) return passwordHash(password);
  await call("admin/users", {
    id: uid,
    email: address,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  return null;
}
export async function resetAccount(uid, password) {
  if (localTest()) return passwordHash(password);
  await call(`admin/users/${uid}`, { password }, "PUT");
  return null;
}
