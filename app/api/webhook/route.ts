import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import type { Order, OrderItem, ShippingAddress } from "@/lib/types";
import { ordersRepo, pendingCartsRepo, providersRepo, generateOrderRef } from "@/lib/db";
import { cartItemToOrderItem } from "@/lib/productTypes";
import { sendCustomerConfirmationEmail, sendProviderProductionEmail } from "@/lib/email";

/* ══════════════════════════════════════════════════════════════════
   POST /api/webhook
   Receives Stripe events, creates & persists orders, routes to
   providers, sends emails, notifies Telegram.

   Required env:
     STRIPE_SECRET_KEY
     STRIPE_WEBHOOK_SECRET
     TELEGRAM_BOT_TOKEN          (optional)
     TELEGRAM_ADMIN_CHAT_ID      (optional)
     SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  /* ── Verify Stripe signature ─────────────────────────────────── */
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  /* ── Only process completed payments ────────────────────────── */
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  /* ── Idempotency: skip if order already exists ───────────────── */
  if (ordersRepo.findBySessionId(session.id)) {
    console.log(`[webhook] Order for session ${session.id} already exists — skip`);
    return NextResponse.json({ received: true });
  }

  try {
    /* ── Expand line items for Telegram notification ─────────── */
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });

    /* ── Recover full cart from pending store ─────────────────── */
    const pendingCart = pendingCartsRepo.findBySessionId(session.id);
    const cartItems   = pendingCart?.cart ?? [];

    /* ── Build order items ───────────────────────────────────── */
    const orderItems: OrderItem[] = cartItems.map(cartItemToOrderItem);

    /* ── Amounts ─────────────────────────────────────────────── */
    const subtotalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const shippingAmount = session.shipping_cost?.amount_total ?? 0;
    const totalAmount    = session.amount_total ?? subtotalAmount + shippingAmount;

    /* ── Shipping details ────────────────────────────────────── */
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

    /* ── Shipping option label ───────────────────────────────── */
    let shippingOption: string | undefined;
    if (fullSession.shipping_cost?.shipping_rate) {
      try {
        const rate = await stripe.shippingRates.retrieve(
          fullSession.shipping_cost.shipping_rate as string
        );
        shippingOption = rate.display_name ?? undefined;
      } catch {
        /* non-critical */
      }
    }

    /* ── Persist order ───────────────────────────────────────── */
    const now   = new Date().toISOString();
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

    /* ── Send customer confirmation email ────────────────────── */
    if (order.customerEmail) {
      sendCustomerConfirmationEmail(order).catch((err) =>
        console.error(`[webhook] Customer email failed for ${order.orderRef}:`, err)
      );
    }

    /* ── Route items to providers & send production emails ───── */
    // Group order items by provider
    const byProvider = new Map<string, { items: OrderItem[]; cartIdx: number[] }>();

    orderItems.forEach((item, idx) => {
      const pid = item.providerId ?? "__none__";
      if (!byProvider.has(pid)) byProvider.set(pid, { items: [], cartIdx: [] });
      byProvider.get(pid)!.items.push(item);
      byProvider.get(pid)!.cartIdx.push(idx);
    });

    for (const [providerId, { items, cartIdx }] of byProvider) {
      if (providerId === "__none__") continue;
      const provider = providersRepo.findById(providerId);
      if (!provider) continue;

      // Matching cart items for asset path resolution
      const matchingCartItems = cartIdx.map((i) => cartItems[i]).filter(Boolean);

      sendProviderProductionEmail(order, provider, items, matchingCartItems).catch((err) =>
        console.error(`[webhook] Provider email failed (${providerId}) for ${order.orderRef}:`, err)
      );
    }

    // Update status to production_sent (fire-and-forget, best-effort)
    ordersRepo.updateStatus(order.id, "production_sent");

    /* ── Clean up pending cart ───────────────────────────────── */
    pendingCartsRepo.delete(session.id);

    /* ── Notify Telegram ─────────────────────────────────────── */
    notifyTelegram(order, fullSession).catch((err) =>
      console.error("[webhook] Telegram notification failed:", err)
    );

    console.log(`[webhook] Order ${order.orderRef} created and processed.`);
  } catch (err) {
    console.error("[webhook] Error processing payment:", err);
    // Return 200 so Stripe doesn't retry — log the error for manual review
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
