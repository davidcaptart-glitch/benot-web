import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import type { CartItem } from "@/lib/types";
import { PRICES }        from "@/lib/productTypes";
import { pendingCartsRepo } from "@/lib/db";

/* ─── Product display names ──────────────────────────────────────── */
const NOMBRES: Record<string, string> = {
  personalizada: "Camiseta Personalizada BENOT",
  running:       "Camiseta Running BENOT",
  yoteempujo:    "Camiseta Solidaria #YoTeEmpujo BENOT",
};

/* ══════════════════════════════════════════════════════════════════
   POST /api/checkout
   Body: { cart: CartItem[] }
   Returns: { url: string }  ← URL de Stripe Checkout
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe no configurado en el servidor" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const { cart } = await req.json() as { cart: CartItem[] };

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    /* ── Build Stripe line items ──────────────────────────────────── */
    const line_items: Stripe.Checkout.SessionCreateParams["line_items"] = cart.map((item) => {
      const tipo     = item.tipo;
      const sizes    = (item.sizes ?? {}) as Record<string, number>;
      const quantity = Math.max(1, Object.values(sizes).reduce((a, b) => a + b, 0));
      const sizesStr = Object.entries(sizes)
        .filter(([, q]) => q > 0)
        .map(([s, q]) => `${s}×${q}`)
        .join(", ");

      let name        = NOMBRES[tipo] ?? "Camiseta BENOT";
      let description = `Tallas: ${sizesStr}`;

      if (item.tipo === "personalizada") {
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
        name        = `${name} — ${cap(item.color)}`;
        description = `Frase: ${item.fraseCode} · Diseño: ${item.disenoCode} (${String(item.disenoCategoria).toUpperCase()}) · Tallas: ${sizesStr}`;
      } else if (item.tipo === "running") {
        // List the configurable zones (skip fixed ones to keep description short)
        const zoneStr = item.zones
          .filter((z) => !z.isFixed)
          .map((z) => `${z.label}: ${z.code}`)
          .join(" · ");
        description = `${zoneStr}${zoneStr ? " · " : ""}Tallas: ${sizesStr}`;
      } else {
        // yoteempujo
        description = `Modelo: ${(item as { code: string }).code} · Tallas: ${sizesStr}`;
      }

      return {
        price_data: {
          currency:     "eur",
          product_data: { name, description },
          unit_amount:  PRICES[tipo] ?? 2990,
        },
        quantity,
      };
    });

    /* ── Cart total → shipping options ───────────────────────────── */
    const cartTotal = cart.reduce((sum, item) => {
      const sizes = (item.sizes ?? {}) as Record<string, number>;
      const qty   = Math.max(1, Object.values(sizes).reduce((a, b) => a + b, 0));
      return sum + (PRICES[item.tipo] ?? 2990) * qty;
    }, 0);

    const freeShipping = cartTotal >= 8000; // gratis desde 80 €

    const shippingOptions: Stripe.Checkout.SessionCreateParams["shipping_options"] = freeShipping
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "eur" },
              display_name: "Envío estándar (gratis desde 80 €)",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 3 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 999, currency: "eur" },
              display_name: "Envío urgente",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 1 },
                maximum: { unit: "business_day", value: 3 },
              },
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 499, currency: "eur" },
              display_name: "Envío estándar",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 3 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 999, currency: "eur" },
              display_name: "Envío urgente",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 1 },
                maximum: { unit: "business_day", value: 3 },
              },
            },
          },
        ];

    /* ── Stripe metadata: brief readable summary ─────────────────── */
    // Full cart stored server-side to avoid the 500-char metadata limit.
    const orderSummary = cart
      .map((item, i) => {
        const sizes    = (item.sizes ?? {}) as Record<string, number>;
        const sizesStr = Object.entries(sizes)
          .filter(([, q]) => q > 0)
          .map(([s, q]) => `${s}×${q}`)
          .join(",");
        const detail =
          item.tipo === "personalizada"
            ? `${item.tipo}|${item.color}|${item.fraseCode}|${item.disenoCode}`
            : item.tipo === "running"
              ? `${item.tipo}|${item.zones.map((z) => z.code).join("+")}`
              : `${item.tipo}|${item.code}`;
        return `[${i + 1}]${detail}|${sizesStr}`;
      })
      .join("/")
      .slice(0, 495);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://benot.store";

    /* ── Create Stripe session ───────────────────────────────────── */
    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      line_items,
      shipping_options: shippingOptions,
      shipping_address_collection: {
        allowed_countries: ["ES", "PT", "FR", "IT", "DE", "BE", "NL", "AT", "CH"],
      },
      phone_number_collection: { enabled: true },
      custom_text: {
        submit: {
          message: "Procesamos tu pedido en 24–48 h hábiles. Recibirás confirmación por email.",
        },
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/configurador`,
      metadata: {
        order: orderSummary,
      },
    });

    /* ── Persist full cart keyed by Stripe session ID ────────────── */
    // This is the authoritative cart data used by the webhook.
    pendingCartsRepo.save({
      sessionId: session.id,
      cart,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Error:", err);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
