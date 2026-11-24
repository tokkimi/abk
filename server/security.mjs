import { Buffer } from "node:buffer";
import {
  randomBytes,
  scrypt as derive,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(derive);
export const token = () => randomBytes(32).toString("base64url");
export const digest = (value) =>
  createHash("sha256").update(String(value)).digest("hex");
export function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}
export function text(value, max = 500, required = true) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    fail(400, "Champ invalide.");
  return value.trim();
}
export function email(value) {
  const v = text(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    fail(400, "Adresse e-mail invalide.");
  return v;
}
export function choice(value, allowed) {
  if (!allowed.includes(value)) fail(400, "Valeur invalide.");
  return value;
}
export function id(value) {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value || "",
    )
  )
    fail(400, "Identifiant invalide.");
  return value;
}
export function date(value) {
  if (!value) return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail(400, "Date invalide.");
  return value;
}
export function cents(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1e11)
    fail(400, "Montant invalide.");
  return value;
}
export function admin(user) {
  if (user.role !== "admin") fail(403, "Accès réservé à ABK.");
}
export function visible(user, visibility) {
  return (
    user.role === "admin" ||
    visibility === "shared" ||
    (user.role === "client" && visibility === "client")
  );
}
export async function passwordHash(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    fail(400, "Choisissez un mot de passe de 12 à 128 caractères.");
  const salt = token();
  const key = await scrypt(password, salt, 64, {
    N: 32768,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function passwordMatches(password, hash) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [, salt, encoded] = (hash || "").split(":");
  if (!salt || !encoded) return false;
  const key = await scrypt(password, salt, 64, {
    N: 32768,
    maxmem: 64 * 1024 * 1024,
  });
  const wanted = Buffer.from(encoded, "hex");
  return wanted.length === key.length && timingSafeEqual(wanted, key);
}
export function csvCell(value) {
  const v = String(value ?? "");
  return (
    '"' + (/^[=+\-@\t\r]/.test(v) ? "'" + v : v).replaceAll('"', '""') + '"'
  );
}
export function documentPayload(b) {
  const bytes = Buffer.from(text(b.data, 4000000), "base64");
  if (!bytes.length || bytes.length > 3000000)
    fail(400, "Fichier limité à 3 Mo.");
  const name = text(b.name, 160).replace(/[\r\n/\\]/g, "_");
  let mime;
  if (bytes.subarray(0, 5).toString() === "%PDF-") mime = "application/pdf";
  else if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    mime = "image/png";
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    mime = "image/jpeg";
  else fail(400, "Seuls PDF, PNG et JPEG sont acceptés.");
  return { bytes, name, mime };
}
