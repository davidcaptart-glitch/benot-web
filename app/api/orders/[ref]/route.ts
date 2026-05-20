import { NextRequest, NextResponse } from "next/server";
import { ordersRepo } from "@/lib/db";
import type { OrderStatus, ProductionStatus } from "@/lib/types";

/* ══════════════════════════════════════════════════════════════════
   GET  /api/orders/[ref]   — fetch order by BN-XXXX reference
   PATCH /api/orders/[ref]  — update order status OR per-item production status

   PATCH body variants:
     { status: OrderStatus }
     { itemId: string; productionStatus: ProductionStatus }

   Auth: requires x-admin-secret header.
══════════════════════════════════════════════════════════════════ */

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "pending", "paid", "production_sent", "in_production", "shipped", "delivered",
];
const VALID_PRODUCTION_STATUSES: ProductionStatus[] = [
  "pending", "queued", "printing", "completed", "shipped",
];

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
  const order   = await ordersRepo.findByRef(ref.toUpperCase());
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
  const order   = await ordersRepo.findByRef(ref.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const body = await req.json() as {
    status?: OrderStatus;
    itemId?:           string;
    productionStatus?: ProductionStatus;
  };

  /* ── Option A: order-level status ───────────────────────────── */
  if (body.status !== undefined) {
    if (!VALID_ORDER_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid values: ${VALID_ORDER_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    const updated = await ordersRepo.updateStatus(order.id, body.status);
    return NextResponse.json({ order: updated });
  }

  /* ── Option B: per-item production status ────────────────────── */
  if (body.itemId !== undefined && body.productionStatus !== undefined) {
    if (!VALID_PRODUCTION_STATUSES.includes(body.productionStatus)) {
      return NextResponse.json(
        { error: `Invalid productionStatus. Valid values: ${VALID_PRODUCTION_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    const updated = await ordersRepo.updateItemProductionStatus(
      order.id,
      body.itemId,
      body.productionStatus,
    );
    if (!updated) {
      return NextResponse.json({ error: "Item not found in order" }, { status: 404 });
    }
    return NextResponse.json({ order: updated });
  }

  return NextResponse.json(
    { error: "Provide either { status } or { itemId, productionStatus }" },
    { status: 400 }
  );
}
