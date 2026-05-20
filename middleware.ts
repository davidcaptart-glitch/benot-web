/**
 * BENOT – Edge middleware
 * Protects all /admin/** routes with a cookie-based session check.
 * The cookie value is SHA-256(ADMIN_PASSWORD + ":" + ADMIN_SECRET).
 * Changing either env var instantly invalidates all sessions.
 */
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "benot_admin";

async function expectedToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret   = process.env.ADMIN_SECRET   ?? "";
  const encoder  = new TextEncoder();
  const data     = encoder.encode(`${password}:${secret}`);
  const buf      = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Login page is always accessible
  if (pathname === "/admin/login") return NextResponse.next();

  const token    = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const expected = await expectedToken();

  if (!token || token !== expected) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
