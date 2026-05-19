import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/* ──────────────────────────────────────────────
   Precio por tipo (en céntimos de euro)
   Ajusta los valores en .env: PRICE_PERSONALIZADA / PRICE_RUNNING / PRICE_YOTEEMPUJO
   o edita directamente este objeto.
────────────────────────────────────────────── */
const PRICES: Record<string, number> = {
  personalizada: Number(process.env.PRICE_PERSONALIZADA ?? 4290), // 42,90 €
  running:       Number(process.env.PRICE_RUNNING       ?? 3790), // 37,90 €
  yoteempujo:    Number(process.env.PRICE_YOTEEMPUJO    ?? 2790), // 27,90 €
};

const NOMBRES: Record<string, string> = {
  personalizada: "Camiseta Personalizada BENOT",
  running:       "Camiseta Running BENOT",
  yoteempujo:    "Camiseta Solidaria #YoTeEmpujo BENOT",
};

const COLORES: Record<string, string> = {
  negra: "Negra", blanca: "Blanca", roja: "Roja",
};

/* ──────────────────────────────────────────────
   POST /api/checkout
   Body: { cart: CartItem[] }
   Returns: { url: string }  ← URL de Stripe Checkout
────────────────────────────────────────────── */
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
    const { cart } = await req.json() as { cart: Array<Record<string, unknown>> };

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    // Construye los line_items para Stripe Checkout
    const line_items: Stripe.Checkout.SessionCreateParams["line_items"] = cart.map((item) => {
      const tipo   = item.tipo as string;
      const sizes  = (item.sizes ?? {}) as Record<string, number>;
      const total  = Object.values(sizes).reduce((a, b) => a + b, 0);
      const sizesStr = Object.entries(sizes)
        .filter(([, q]) => q > 0)
        .map(([s, q]) => `${s}×${q}`)
        .join(", ");

      let name        = NOMBRES[tipo] ?? "Camiseta BENOT";
      let description = `Tallas: ${sizesStr}`;

      if (tipo === "personalizada") {
        const color = COLORES[item.color as string] ?? (item.color as string);
        name = `${name} — ${color}`;
        description =
          `Frase: ${item.fraseCode} · Diseño: ${item.disenoCode}` +
          ` (${String(item.disenoCategoria).toUpperCase()}) · Tallas: ${sizesStr}`;
      } else if (tipo === "running" || tipo === "yoteempujo") {
        description = `Modelo: ${item.code} · Tallas: ${sizesStr}`;
      }

      return {
        price_data: {
          currency: "eur",
          product_data: { name, description },
          unit_amount: PRICES[tipo] ?? 2990,
        },
        quantity: total || 1,
      };
    });

    // Metadata: resumen legible del pedido (para el webhook y el panel de Stripe)
    const orderSummary = cart
      .map((item, i) => {
        const tipo = item.tipo as string;
        const sizes = (item.sizes ?? {}) as Record<string, number>;
        const sizesStr = Object.entries(sizes)
          .filter(([, q]) => q > 0)
          .map(([s, q]) => `${s}×${q}`)
          .join(", ");
        const base =
          tipo === "personalizada"
            ? `${tipo} | ${item.color} | ${item.fraseCode} | ${item.disenoCode}`
            : `${tipo} | ${item.code}`;
        return `[${i + 1}] ${base} | ${sizesStr}`;
      })
      .join(" / ");

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://benot.store";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Tarjeta + métodos locales disponibles en la cuenta Stripe
      payment_method_types: ["card"],
      line_items,
      // Recopilar dirección de envío
      shipping_address_collection: {
        allowed_countries: ["ES", "PT", "FR", "IT", "DE", "BE", "NL", "AT", "CH"],
      },
      phone_number_collection: { enabled: true },
      // Mensaje personalizado en el checkout
      custom_text: {
        submit: {
          message: "Procesamos tu pedido en 24–48 h hábiles. Recibirás confirmación por email.",
        },
      },
      // URLs de retorno
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/configurador`,
      // Metadata para el webhook
      metadata: {
        order: orderSummary.slice(0, 500), // Stripe: max 500 chars por campo
      },
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
