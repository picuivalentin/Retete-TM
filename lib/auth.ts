import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "tm_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function signingKey() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD lipsește din .env.local");
  return createHash("sha256").update(password).digest();
}

export function passwordsMatch(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const actualHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function createSessionToken() {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${exp}`;
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const match = /^admin\.(\d+)\.([A-Za-z0-9_-]+)$/.exec(token);
  if (!match) return false;
  const exp = Number(match[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const payload = `admin.${match[1]}`;
  let expected = "";
  try {
    expected = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  } catch {
    return false;
  }
  const actual = Buffer.from(match[2]);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}
