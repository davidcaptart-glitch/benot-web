import { NextRequest, NextResponse } from "next/server";
import { adminUserRepo }             from "@/lib/repositories/adminUser";
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

/* ── Rate limiting (simple in-memory, per IP) ─────────────────── */
// Up to 5 failed attempts per 15-minute window before lockout.
const attempts = new Map<string, { count: number; firstAt: number }>();

const MAX_ATTEMPTS  = 5;
const WINDOW_MS     = 15 * 60 * 1000; // 15 min
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 min lockout after max attempts

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now    = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.firstAt > WINDOW_MS) {
    // Fresh window
    attempts.set(ip, { count: 1, firstAt: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.firstAt + LOCKOUT_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

/* ── POST /api/admin/login ────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  // Rate limit check
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Demasiados intentos. Inténtalo en ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => ({})) as {
    email?: string;
    password?: string;
  };
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña requeridos" },
      { status: 400 }
    );
  }

  // Fetch admin user from DB
  const user = await adminUserRepo.get();

  // Fallback: if no DB user, allow env-var-based login for initial setup
  let authenticated = false;
  let userEmail     = email;

  if (!user) {
    // No DB user yet — check against ADMIN_EMAIL / ADMIN_PASSWORD env vars
    const envEmail    = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (envEmail && envPassword && email === envEmail && password === envPassword) {
      authenticated = true;
      userEmail     = envEmail;
    }
  } else {
    // DB user exists: verify email + bcrypt password
    if (email === user.email && await verifyPassword(password, user.passwordHash)) {
      authenticated = true;
      userEmail     = user.email;
    }
  }

  if (!authenticated) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  clearAttempts(ip);

  const token = await createSessionToken(userEmail);
  const opts  = sessionCookieOptions();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(opts.name, token, {
    httpOnly: opts.httpOnly,
    secure:   opts.secure,
    sameSite: opts.sameSite,
    path:     opts.path,
    maxAge:   opts.maxAge,
  });
  return res;
}

/* ── DELETE /api/admin/login (logout) ─────────────────────────── */

export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("benot_session");
  return res;
}
