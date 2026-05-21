/**
 * BENOT – Edge middleware
 *
 * Protects all /admin/** routes with a JWT session cookie.
 * Uses jose (Edge-compatible) to verify the token without a DB call.
 * Token is created at login with HMAC-SHA256 (HS256) signed by JWT_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify }                  from "jose";

const COOKIE = "benot_session";
const ALG    = "HS256";

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(s);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    return redirect(req, pathname);
  }

  try {
    await jwtVerify(token, secret(), { algorithms: [ALG] });
    return NextResponse.next();
  } catch {
    return redirect(req, pathname);
  }
}

function redirect(req: NextRequest, pathname: string) {
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
