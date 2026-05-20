import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import type { Order, OrderItem, ShippingAddress } from "@/lib/types";
import { ordersRepo, pendingCartsRepo, providersRepo, generateOrderRef } from "@/lib/db";
import { cartItemToOrderItem } from "@/lib/productTypes";
import { snapshotOrderAssets, generateProductionSheet } from "@/lib/snapshot";
import { sendCustomerConfirmationEmail, sendProviderProductionEmail } from "@/lib/email";

/* ══════════════════════════════════════════════════════════════════
   POST /api/webhook

   Full order pipeline on payment completion:
     1. Verify Stripe signature
     2. Idempotency guard (skip duplicate events)
     3. Recover full cart from pendingCartsRepo
     4. Build OrderItems (with productionStatus = "pending")
     5. Persist Order
     6. Snapshot all design assets to /data/orders/{orderRef}/
     7. Update Order with frozenAssets
     8. Per provider: generate production PDF + send email with attachments
     9. Mark items as "queued", order as "production_sent"
    10. Clean up pending cart
    11. Notify Telegram

   Required env:
     STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
     SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
     TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID   (optional)
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
  if (ordersRepo.findBySessionId(session.id)) {
    console.log(`[webhook] Session ${session.id} already processed — skip`);
    return NextResponse.json({ received: true });
  }

  try {
    /* ── 3. Recover full cart ────────────────────────────────── */
    const pendingCart = pendingCartsRepo.findBySessionId(session.id);
    const cartItems   = pendingCart?.cart ?? [];

    /* ── 4. Build order items ────────────────────────────────── */
    const orderItems: OrderItem[] = cartItems.map(cartItemToOrderItem);

    /* ── 5. Amounts + shipping ───────────────────────────────── */
    const subtotalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);

    // Expand line_items for Telegram; also used to get shipping rate
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

    /* ── 5b. Persist Order ───────────────────────────────────── */
    const now = new Date().toISOString();
    const order: Order = {
      id:               crypto.randomUUID(),
      orderRef:         generateOrderRef(),
      stripeSessionId:  session.id,
      status:           "paid",
      customerName:     customer?.name  ?? "",
      customerEmail:    customer?.email ?? "",
      customerPhone:    customer?.phone ?? undefined,
      shippingAddress,
      shippingOption,
      items:            orderItems,
      subtotalAmount,
      shippingAmount,
      totalAmount,
      currency:         session.currency ?? "eur",
      createdAt:        now,
      updatedAt:        now,
    };
    ordersRepo.save(order);
    console.log(`[webhook] Order ${order.orderRef} created`);

    /* ── 6. Snapshot design assets ───────────────────────────── */
    let frozenAssets = order.frozenAssets ?? [];
    try {
      frozenAssets = snapshotOrderAssets(order.orderRef, cartItems);
      ordersRepo.save({ ...order, frozenAssets });
      console.log(`[webhook] Snapshotted ${frozenAssets.length} assets for ${order.orderRef}`);
    } catch (err) {
      console.error(`[webhook] Asset snapshot failed for ${order.orderRef}:`, err);
    }

    /* ── 7. Send customer confirmation ───────────────────────── */
    if (order.customerEmail) {
      sendCustomerConfirmationEmail(order).catch((err) =>
        console.error(`[webhook] Customer email failed (${order.orderRef}):`, err)
      );
    }

    /* ── 8. Route to providers → PDF → email ─────────────────── */
    // Group order items by provider, keeping track of which cart items belong
    const byProvider = new Map<string, { items: OrderItem[]; cartIdx: number[] }>();

    orderItems.forEach((item, idx) => {
      const pid = item.providerId ?? "__none__";
      if (!byProvider.has(pid)) byProvider.set(pid, { items: [], cartIdx: [] });
      byProvider.get(pid)!.items.push(item);
      byProvider.get(pid)!.cartIdx.push(idx);
    });

    const productionPdfs: Record<string, string> = {};

    for (const [providerId, { items, cartIdx }] of byProvider) {
      if (providerId === "__none__") continue;
      const provider = providersRepo.findById(providerId);
      if (!provider) continue;

      // Filter frozen assets that belong to this provider's items
      const providerAssets = frozenAssets.filter((a) => cartIdx.includes(a.cartItemIndex));

      // Generate production PDF
      let pdfPath: string | undefined;
      try {
        pdfPath = await generateProductionSheet(order, provider, items, providerAssets);
        productionPdfs[providerId] = pdfPath;
        console.log(`[webhook] PDF generated: ${pdfPath}`);
      } catch (err) {
        console.error(`[webhook] PDF generation failed (${providerId}):`, err);
      }

      // Send production email (fire-and-forget)
      sendProviderProductionEmail(order, provider, items, providerAssets, pdfPath).catch((err) =>
        console.error(`[webhook] Provider email failed (${providerId}):`, err)
      );
    }

    /* ── 9. Update order with PDF paths + advance statuses ───── */
    ordersRepo.save({
      ...order,
      frozenAssets,
      productionPdfs,
      status:    "production_sent",
      updatedAt: new Date().toISOString(),
      items: order.items.map((item) => ({
        ...item,
        productionStatus: item.providerId ? "queued" : "pending",
      })),
    });

    /* ── 10. Clean up pending cart ───────────────────────────── */
    pendingCartsRepo.delete(session.id);

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
