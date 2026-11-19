export const ACCESS_COOKIE = "tm_access";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function accessSecret() {
  return process.env.SITE_PASSWORD || process.env.ADMIN_PASSWORD || "";
}

function acceptedPasswords() {
  return [process.env.SITE_PASSWORD, process.env.ADMIN_PASSWORD].filter(
    (value): value is string => Boolean(value),
  );
}

function toBase64Url(bytes: ArrayBuffer) {
  const text = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function sameBytes(actual: Uint8Array, expected: Uint8Array) {
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    await sha256(accessSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(signed);
}

export function accessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function accessGranted(input: string) {
  const passwords = acceptedPasswords();
  if (passwords.length === 0 || !input) return false;
  const actual = await sha256(input);
  for (const password of passwords) {
    if (sameBytes(actual, await sha256(password))) return true;
  }
  return false;
}

export async function createAccessToken() {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `access.${exp}`;
  return `${payload}.${await signature(payload)}`;
}

export async function verifyAccessToken(token: string | undefined) {
  if (!token || !accessSecret()) return false;
  const match = /^access\.(\d+)\.([A-Za-z0-9_-]+)$/.exec(token);
  if (!match) return false;
  const exp = Number(match[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await signature(`access.${match[1]}`);
  return sameBytes(
    new TextEncoder().encode(match[2]),
    new TextEncoder().encode(expected),
  );
}
