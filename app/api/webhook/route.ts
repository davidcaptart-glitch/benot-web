import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";

import type { Order, OrderItem, ShippingAddress } from "@/lib/types";
import { db, orders, orderItems as orderItemsTable, orderEvents, pendingCarts, counters } from "@/db";
import { ordersRepo, pendingCartsRepo, providersRepo, generateOrderRef } from "@/lib/db";
import { cartItemToOrderItem } from "@/lib/productTypes";
import { snapshotOrderAssets, generateProductionSheet } from "@/lib/snapshot";
import { sendCustomerConfirmationEmail, sendProviderProductionEmail } from "@/lib/email";
import { eq, sql } from "drizzle-orm";

/* ══════════════════════════════════════════════════════════════════
   POST /api/webhook

   Full order pipeline on payment completion — ATOMIC TRANSACTION:
     1. Verify Stripe signature
     2. Idempotency guard (skip duplicate events)
     3. Recover full cart from pendingCarts
     4. Build OrderItems (productionStatus = "pending")
     5. Atomic transaction:
          a. Generate order ref (counter increment)
          b. Insert order
          c. Insert items
          d. Insert order event
          e. Delete pending cart
     6. Snapshot all design assets to /data/orders/{orderRef}/
     7. Patch order with frozenAssets + productionPdfs
     8. Per provider: generate production PDF + send email
     9. Mark items as "queued", order as "production_sent"
    10. Notify Telegram
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  /* ── 1. Verify Stripe signature ──────────────────────────────── */
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  /* ── 2. Idempotency guard ────────────────────────────────────── */
  const existing = await ordersRepo.findBySessionId(session.id);
  if (existing) {
    console.log(`[webhook] Session ${session.id} already processed — skip`);
    return NextResponse.json({ received: true });
  }

  try {
    /* ── 3. Recover full cart ────────────────────────────────── */
    const pendingCart = await pendingCartsRepo.findBySessionId(session.id);
    const cartItems   = pendingCart?.cart ?? [];

    /* ── 4. Build order items (resolve provider IDs first) ─────── */
    // Look up which provider handles each product type and pass the map
    // to cartItemToOrderItem so items get providerId set correctly.
    const allProviders = await providersRepo.all();
    const providerIdMap = new Map<import("@/lib/types").ProductType, string | null>();
    for (const pt of ["premium_custom", "running_fullprint", "solidary_standard"] as const) {
      const prov = allProviders.find((p) => p.active && p.supportedProductTypes.includes(pt));
      providerIdMap.set(pt, prov?.id ?? null);
    }
    const builtItems: OrderItem[] = cartItems.map((item) => cartItemToOrderItem(item, providerIdMap));

    /* ── 5. Amounts + shipping ───────────────────────────────── */
    const subtotalAmount = builtItems.reduce((s, i) => s + i.subtotal, 0);

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });

    const shippingAmount = session.shipping_cost?.amount_total ?? 0;
    const totalAmount    = session.amount_total ?? subtotalAmount + shippingAmount;

    const sd       = (session as unknown as { shipping_details?: { address?: Stripe.Address | null; name?: string | null } | null }).shipping_details;
    const customer = session.customer_details;

    const shippingAddress: ShippingAddress | undefined = sd?.address
      ? {
          name:        sd.name ?? customer?.name ?? "",
          line1:       sd.address.line1  ?? "",
          line2:       sd.address.line2  ?? undefined,
          city:        sd.address.city   ?? "",
          postal_code: sd.address.postal_code ?? "",
          state:       sd.address.state  ?? undefined,
          country:     sd.address.country ?? "",
        }
      : undefined;

    let shippingOption: string | undefined;
    if (fullSession.shipping_cost?.shipping_rate) {
      try {
        const rate = await stripe.shippingRates.retrieve(
          fullSession.shipping_cost.shipping_rate as string
        );
        shippingOption = rate.display_name ?? undefined;
      } catch { /* non-critical */ }
    }

    /* ── 6. Atomic transaction ───────────────────────────────── */
    const orderId  = randomUUID();
    let   orderRef = "";
    const now      = new Date();

    await db.transaction(async (tx) => {
      // a. Generate order ref atomically
      const year = now.getFullYear();
      const key  = `orders_${year}`;
      const [counter] = await tx
        .insert(counters)
        .values({ key, value: 1 })
        .onConflictDoUpdate({
          target: counters.key,
          set:    { value: sql`${counters.value} + 1` },
        })
        .returning({ value: counters.value });
      orderRef = `BN-${year}-${String(counter.value).padStart(6, "0")}`;

      // b. Insert order (status = "paid")
      await tx.insert(orders).values({
        id:              orderId,
        orderRef,
        stripeSessionId: session.id,
        status:          "paid",
        customerName:    customer?.name  ?? "",
        customerEmail:   customer?.email ?? "",
        customerPhone:   customer?.phone ?? null,
        shippingAddress: shippingAddress ?? null,
        shippingOption:  shippingOption  ?? null,
        subtotalAmount,
        shippingAmount,
        totalAmount,
        currency:        session.currency ?? "eur",
        frozenAssets:    null,
        productionPdfs:  null,
        createdAt:       now,
        updatedAt:       now,
      });

      // c. Insert order items
      if (builtItems.length > 0) {
        await tx.insert(orderItemsTable).values(
          builtItems.map((item) => ({
            id:               item.id,
            orderId,
            productType:      item.productType,
            productName:      item.productName,
            providerId:       item.providerId ?? null,
            productionStatus: "pending" as const,
            color:            item.color ?? null,
            phraseCode:       item.phraseCode ?? null,
            designCode:       item.designCode ?? null,
            designCategory:   item.designCategory ?? null,
            printZones:       (item.printZones as any) ?? null,
            finalPreview:     item.finalPreview ?? null,
            itemCode:         item.itemCode ?? null,
            sizes:            item.sizes as any,
            quantity:         item.quantity,
            unitPrice:        item.unitPrice,
            subtotal:         item.subtotal,
            createdAt:        now,
            updatedAt:        now,
          }))
        );
      }

      // d. Insert order event
      await tx.insert(orderEvents).values({
        orderId,
        event: "order_created",
        data:  { stripeSessionId: session.id },
        createdAt: now,
      });

      // e. Delete pending cart
      await tx.delete(pendingCarts).where(eq(pendingCarts.sessionId, session.id));
    });

    console.log(`[webhook] Order ${orderRef} created (atomic)`);

    // Build the domain Order object for subsequent steps
    const order: Order = {
      id:              orderId,
      orderRef,
      stripeSessionId: session.id,
      status:          "paid",
      customerName:    customer?.name  ?? "",
      customerEmail:   customer?.email ?? "",
      customerPhone:   customer?.phone ?? undefined,
      shippingAddress,
      shippingOption,
      items:           builtItems,
      subtotalAmount,
      shippingAmount,
      totalAmount,
      currency:        session.currency ?? "eur",
      createdAt:       now.toISOString(),
      updatedAt:       now.toISOString(),
    };

    /* ── 7. Snapshot design assets (outside transaction, non-critical) */
    let frozenAssets = order.frozenAssets ?? [];
    try {
      frozenAssets = snapshotOrderAssets(order.orderRef, cartItems);
      console.log(`[webhook] Snapshotted ${frozenAssets.length} assets for ${order.orderRef}`);
    } catch (err) {
      console.error(`[webhook] Asset snapshot failed for ${order.orderRef}:`, err);
    }

    /* ── 8. Send customer confirmation ───────────────────────── */
    if (order.customerEmail) {
      sendCustomerConfirmationEmail(order).catch((err) =>
        console.error(`[webhook] Customer email failed (${order.orderRef}):`, err)
      );
    }

    /* ── 9. Route to providers → PDF → email ─────────────────── */
    const byProvider = new Map<string, { items: OrderItem[]; cartIdx: number[] }>();
    builtItems.forEach((item, idx) => {
      const pid = item.providerId ?? "__none__";
      if (!byProvider.has(pid)) byProvider.set(pid, { items: [], cartIdx: [] });
      byProvider.get(pid)!.items.push(item);
      byProvider.get(pid)!.cartIdx.push(idx);
    });

    const productionPdfs: Record<string, string> = {};

    for (const [providerId, { items, cartIdx }] of byProvider) {
      if (providerId === "__none__") continue;
      const provider = allProviders.find((p) => p.id === providerId);
      if (!provider) continue;

      const providerAssets = frozenAssets.filter((a) => cartIdx.includes(a.cartItemIndex));

      let pdfPath: string | undefined;
      try {
        pdfPath = await generateProductionSheet(order, provider, items, providerAssets);
        productionPdfs[providerId] = pdfPath;
        console.log(`[webhook] PDF generated: ${pdfPath}`);
      } catch (err) {
        console.error(`[webhook] PDF generation failed (${providerId}):`, err);
      }

      sendProviderProductionEmail(order, provider, items, providerAssets, pdfPath).catch((err) =>
        console.error(`[webhook] Provider email failed (${providerId}):`, err)
      );
    }

    /* ── 10. Update order: status, frozen assets, PDFs, item statuses */
    await ordersRepo.patchAssets(orderId, frozenAssets, productionPdfs);

    // Advance order and item statuses
    await db
      .update(orders)
      .set({ status: "production_sent", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await db
      .update(orderItemsTable)
      .set({ productionStatus: "queued", updatedAt: new Date() })
      .where(eq(orderItemsTable.orderId, orderId));

    await db.insert(orderEvents).values({
      orderId,
      event: "production_sent",
      data:  { providers: Object.keys(productionPdfs) },
    });

    /* ── 11. Notify Telegram ─────────────────────────────────── */
    notifyTelegram(order, fullSession).catch((err) =>
      console.error("[webhook] Telegram notification failed:", err)
    );

  } catch (err) {
    console.error("[webhook] Fatal error processing payment:", err);
    // Return 200 so Stripe doesn't retry — log for manual review
  }

  return NextResponse.json({ received: true });
}

/* ══════════════════════════════════════════════════════════════════
   Telegram notification
══════════════════════════════════════════════════════════════════ */
type ExpandedSession = Stripe.Checkout.Session & {
  line_items?: Stripe.ApiList<Stripe.LineItem>;
  shipping_details?: { address?: Stripe.Address | null; name?: string | null } | null;
};

async function notifyTelegram(order: Order, session: ExpandedSession) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) return;

  const total = (order.totalAmount / 100).toFixed(2);
  const addr  = order.shippingAddress;

  const lines: string[] = [
    "🎉 *NUEVO PEDIDO BENOT*",
    "",
    `🔖 *Referencia:* \`${order.orderRef}\``,
    `👤 *Cliente:* ${order.customerName || "—"}`,
    `📧 *Email:* ${order.customerEmail || "—"}`,
    `📞 *Teléfono:* ${order.customerPhone ?? "—"}`,
    "",
  ];

  if (addr) {
    lines.push("📦 *Dirección de envío:*");
    lines.push(addr.line1);
    if (addr.line2) lines.push(addr.line2);
    lines.push(`${addr.postal_code} ${addr.city}${addr.country ? `, ${addr.country}` : ""}`);
    lines.push("");
  }

  if (order.shippingOption) {
    lines.push(`🚚 *Envío:* ${order.shippingOption}`);
    lines.push("");
  }

  if (session.line_items?.data?.length) {
    lines.push("🛍️ *Artículos:*");
    session.line_items.data.forEach((item) => {
      const price = ((item.amount_total ?? 0) / 100).toFixed(2);
      lines.push(`• ${item.description ?? "—"} ×${item.quantity}  —  ${price} €`);
    });
    lines.push("");
  }

  lines.push(`💶 *Total:* ${total} €`);
  lines.push(`🔑 \`${session.id}\``);
  lines.push("", "✅ *Pago confirmado por Stripe*");

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:    chatId,
      text:       lines.join("\n"),
      parse_mode: "Markdown",
    }),
  });
}
