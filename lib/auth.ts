/**
 * BENOT – Authentication helpers
 *
 * - Password hashing / verification: bcryptjs (pure JS, no native compilation)
 * - JWT session tokens: jose (Edge-compatible, used in middleware and API routes)
 *
 * SESSION STRATEGY:
 *   Login  → verify bcrypt → sign JWT → set httpOnly cookie "benot_session"
 *   Request → middleware reads cookie → jose.jwtVerify → allow/deny
 *   Logout → clear cookie
 *
 * The JWT is stateless (no DB lookup per request).
 * Token lifetime: 7 days (refreshed on every successful request via middleware).
 */
import bcrypt              from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

/* ── Constants ─────────────────────────────────────────────────── */

export const SESSION_COOKIE = "benot_session";
const SESSION_DAYS          = 7;
const SESSION_SECONDS       = SESSION_DAYS * 24 * 60 * 60;

/** JWT algorithm — HS256 is Edge-compatible and sufficient for a single-admin app. */
const ALG = "HS256";

/* ── JWT secret (derived from JWT_SECRET env var) ──────────────── */

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(s);
}

/* ── Password helpers ───────────────────────────────────────────── */

/** Hash a plain-text password. Use at seed/setup time. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Verify a plain-text password against a bcrypt hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ── JWT helpers ────────────────────────────────────────────────── */

export interface SessionPayload {
  sub:   string;   // admin email
  role:  "admin";
}

/** Create a signed JWT valid for SESSION_DAYS days. */
export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ role: "admin" } satisfies Omit<SessionPayload, "sub">)
    .setProtectedHeader({ alg: ALG })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(getSecret());
}

/** Verify a JWT. Returns the payload or null if invalid/expired. */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return {
      sub:  payload.sub  as string,
      role: payload.role as "admin",
    };
  } catch {
    return null;
  }
}

/** Cookie options shared between login route and middleware. */
export function sessionCookieOptions(maxAge: number = SESSION_SECONDS) {
  return {
    name:     SESSION_COOKIE,
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path:     "/",
    maxAge,
  };
}
