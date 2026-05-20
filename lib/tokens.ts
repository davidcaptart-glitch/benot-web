/**
 * BENOT – Cryptographic token utilities
 *
 * Provider action tokens: allow providers to update order status by
 * clicking a link in their production email — no login required.
 *
 * Token format: HMAC-SHA256(ADMIN_SECRET, "{orderRef}:{itemId}:{action}")
 * URL format:   /api/provider-action?token={token}&ref={orderRef}&itemId={itemId}&action={action}
 *
 * Admin session token: SHA-256(ADMIN_PASSWORD + ":" + ADMIN_SECRET)
 * Stored as the cookie value; changes when either env var changes.
 */
import { createHmac, createHash, timingSafeEqual } from "crypto";

const SECRET = process.env.ADMIN_SECRET ?? "benot-dev-secret";

/* ── Provider action tokens ──────────────────────────────────────── */
export function createProviderToken(
  orderRef: string,
  itemId:   string,
  action:   string,
): string {
  return createHmac("sha256", SECRET)
    .update(`${orderRef}:${itemId}:${action}`)
    .digest("hex");
}

export function verifyProviderToken(
  token:    string,
  orderRef: string,
  itemId:   string,
  action:   string,
): boolean {
  const expected = createProviderToken(orderRef, itemId, action);
  try {
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/* ── Admin session token (Node.js — used in login API route) ─────── */
export function computeAdminToken(password: string, secret: string): string {
  return createHash("sha256")
    .update(`${password}:${secret}`)
    .digest("hex");
}

/* ── Admin session token (Edge — used in middleware) ─────────────── */
// Returns the expected hex token using Web Crypto (available on Edge runtime).
export async function computeAdminTokenEdge(
  password: string,
  secret:   string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(`${password}:${secret}`);
  const buf     = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
