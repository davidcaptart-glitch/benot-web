import { NextRequest, NextResponse } from "next/server";
import { ordersRepo } from "@/lib/db";

/* ══════════════════════════════════════════════════════════════════
   GET /api/orders
   Returns the full list of orders (newest first).

   Optional query params:
     ?status=paid|production_sent|...   — filter by status
     ?limit=50                          — max results (default 100)

   Auth: requires ADMIN_SECRET header matching ADMIN_SECRET env var.
══════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const limit        = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  let orders = await ordersRepo.all();
  if (statusFilter) {
    orders = orders.filter((o) => o.status === statusFilter);
  }
  orders = orders.slice(0, limit);

  return NextResponse.json({ orders, total: orders.length });
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-secret") === secret;
}
