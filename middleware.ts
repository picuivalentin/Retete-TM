import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/access";

export async function middleware(request: NextRequest) {
  if (await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/intrare";
  url.search = "";
  if (destination !== "/") url.searchParams.set("next", destination);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|thermomix-logo.svg|intrare|api/acces).*)",
  ],
};
