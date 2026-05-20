import { NextRequest, NextResponse } from "next/server";
import { ordersRepo } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

/* ══════════════════════════════════════════════════════════════════
   GET  /api/orders/[ref]   — fetch order by BN-XXXX reference
   PATCH /api/orders/[ref]  — update order status

   Auth: requires x-admin-secret header.
══════════════════════════════════════════════════════════════════ */

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-secret") === secret;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ref } = await params;
  const order   = ordersRepo.findByRef(ref.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ref } = await params;
  const order   = ordersRepo.findByRef(ref.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const body = await req.json() as { status?: OrderStatus };
  const VALID_STATUSES: OrderStatus[] = [
    "pending", "paid", "production_sent", "in_production", "shipped", "delivered",
  ];

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Valid values: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = ordersRepo.updateStatus(order.id, body.status);
  return NextResponse.json({ order: updated });
}
