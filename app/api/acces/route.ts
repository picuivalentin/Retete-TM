import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  accessCookieOptions,
  accessGranted,
  createAccessToken,
} from "@/lib/access";

export async function POST(request: Request) {
  if (!process.env.SITE_PASSWORD && !process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Setează SITE_PASSWORD sau ADMIN_PASSWORD." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!(await accessGranted(password))) {
    return NextResponse.json({ error: "Parolă greșită" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, await createAccessToken(), accessCookieOptions());
  return response;
}
