import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/* ──────────────────────────────────────────────
   POST /api/webhook
   Recibe eventos de Stripe y notifica al bot de Telegram.

   Configuración necesaria en .env:
     STRIPE_WEBHOOK_SECRET=whsec_...
     TELEGRAM_BOT_TOKEN=...
     TELEGRAM_ADMIN_CHAT_ID=...  (chat ID numérico del administrador)
────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const stripeKey      = process.env.STRIPE_SECRET_KEY;
  const webhookSecret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  // Lee el body RAW (necesario para verificar la firma de Stripe)
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Firma inválida:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  // Solo nos interesa el pago completado
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Recupera la sesión completa con line_items expandidos
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
      });

      await notifyTelegram(full);
    } catch (err) {
      console.error("[webhook] Error al notificar:", err);
      // Devolvemos 200 igualmente para que Stripe no reintente
    }
  }

  return NextResponse.json({ received: true });
}

/* ──────────────────────────────────────────────
   Envía notificación de pedido al bot de Telegram
────────────────────────────────────────────── */
type ExpandedSession = Stripe.Checkout.Session & {
  line_items?: Stripe.ApiList<Stripe.LineItem>;
  // shipping_details está en la sesión pero el tipo base no siempre lo expone
  shipping_details?: { address?: Stripe.Address | null; name?: string | null } | null;
};

async function notifyTelegram(session: ExpandedSession) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("[webhook] TELEGRAM_BOT_TOKEN o TELEGRAM_ADMIN_CHAT_ID no configurados.");
    return;
  }

  const customer = session.customer_details;
  const shipping = session.shipping_details;
  const total    = ((session.amount_total ?? 0) / 100).toFixed(2);

  const lines: string[] = [
    "🎉 *NUEVO PEDIDO BENOT*",
    "",
    `👤 *Cliente:* ${customer?.name ?? "—"}`,
    `📧 *Email:* ${customer?.email ?? "—"}`,
    `📞 *Teléfono:* ${customer?.phone ?? "—"}`,
    "",
  ];

  // Dirección de envío
  if (shipping?.address) {
    const a = shipping.address;
    lines.push("📦 *Dirección de envío:*");
    if (a.line1) lines.push(a.line1);
    if (a.line2) lines.push(a.line2);
    lines.push(
      [a.postal_code, a.city].filter(Boolean).join(" ") +
        (a.country ? `, ${a.country}` : "")
    );
    lines.push("");
  }

  // Artículos (vienen de los line_items expandidos)
  if (session.line_items?.data?.length) {
    lines.push("🛍️ *Artículos:*");
    session.line_items.data.forEach((item) => {
      const price = ((item.amount_total ?? 0) / 100).toFixed(2);
      lines.push(`• ${item.description ?? item.id} ×${item.quantity}  —  ${price} €`);
    });
    lines.push("");
  }

  // Resumen de pedido (guardado en metadata)
  if (session.metadata?.order) {
    lines.push("📋 *Detalle del pedido:*");
    lines.push(session.metadata.order);
    lines.push("");
  }

  lines.push(`💶 *Total pagado:* ${total} €`);
  lines.push(`🔑 \`${session.id}\``);
  lines.push("", "✅ *Pago confirmado por Stripe*");

  const message = lines.join("\n");

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });
}
