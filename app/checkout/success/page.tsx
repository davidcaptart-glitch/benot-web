import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Stripe from "stripe";

export const metadata: Metadata = {
  title: "Pedido confirmado | BENOT",
  description: "Tu pedido BENOT ha sido procesado correctamente.",
};

/* ──────────────────────────────────────────────
   Página de éxito tras el pago con Stripe
   URL: /checkout/success?session_id=cs_...
────────────────────────────────────────────── */
export default async function SuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await props.searchParams;

  type SessionExpanded = Stripe.Checkout.Session & {
    line_items?: Stripe.ApiList<Stripe.LineItem>;
    shipping_details?: { address?: Stripe.Address | null; name?: string | null } | null;
  };
  let session: SessionExpanded | null = null;
  let lineItems: Stripe.LineItem[] = [];

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items"],
      }) as SessionExpanded;
      lineItems = session.line_items?.data ?? [];
    } catch {
      // Sesión no encontrada o expirada — mostramos pantalla genérica igualmente
    }
  }

  const total = session?.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : null;

  const name   = session?.customer_details?.name;
  const email  = session?.customer_details?.email;
  const shipping = session?.shipping_details;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header minimal */}
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/">
          <Image
            src="/assets/logo/logo.png"
            alt="BENOT"
            width={120}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
      </header>

      <main className="flex-1 max-w-[680px] mx-auto w-full px-6 py-16">
        {/* Icono de éxito */}
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-8">
          <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </div>

        <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-2">
          PAGO CONFIRMADO
        </p>
        <h1 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-4">
          ¡GRACIAS{name ? `, ${name.split(" ")[0].toUpperCase()}` : ""}!
        </h1>
        <p className="font-bebas tracking-widest text-gray-500 text-base mb-12 leading-relaxed">
          TU PEDIDO HA SIDO PROCESADO CORRECTAMENTE.
          {email && ` HEMOS ENVIADO LA CONFIRMACIÓN A ${email.toUpperCase()}.`}
        </p>

        {/* Resumen del pedido */}
        {lineItems.length > 0 && (
          <div className="border-2 border-gray-100 p-6 mb-8">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 tracking-[0.25em] mb-5">
              RESUMEN DEL PEDIDO
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {lineItems.map((item, i) => (
                <div key={i} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-bebas tracking-widest text-sm">{item.description}</p>
                    {item.quantity && item.quantity > 1 && (
                      <p className="font-bebas tracking-widest text-xs text-gray-400">
                        ×{item.quantity}
                      </p>
                    )}
                  </div>
                  {item.amount_total != null && (
                    <p className="font-bebas tracking-widest text-sm flex-shrink-0">
                      {(item.amount_total / 100).toFixed(2)} €
                    </p>
                  )}
                </div>
              ))}
            </div>
            {total && (
              <div className="border-t border-gray-100 pt-4 flex justify-between">
                <span className="font-bebas tracking-widest text-sm text-gray-500">TOTAL</span>
                <span className="font-bebas tracking-widest text-xl">{total} €</span>
              </div>
            )}
          </div>
        )}

        {/* Dirección de envío */}
        {shipping?.address && (
          <div className="border-2 border-gray-100 p-6 mb-8">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 tracking-[0.25em] mb-3">
              DIRECCIÓN DE ENVÍO
            </p>
            <p className="font-bebas tracking-widest text-sm text-gray-700 leading-relaxed">
              {shipping.address.line1}
              {shipping.address.line2 && <><br />{shipping.address.line2}</>}
              <br />
              {[shipping.address.postal_code, shipping.address.city].filter(Boolean).join(" ")}
              {shipping.address.country && `, ${shipping.address.country}`}
            </p>
          </div>
        )}

        <p className="font-bebas tracking-widest text-xs text-gray-400 leading-relaxed mb-12">
          PREPARAREMOS TU PEDIDO EN LAS PRÓXIMAS 24–48 H HÁBILES. SI TIENES CUALQUIER DUDA, ESCRÍBENOS POR TELEGRAM.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="font-bebas tracking-widest text-sm bg-black text-white px-10 py-3 text-center hover:bg-[#FF1E1E] transition-all duration-200"
          >
            VOLVER A LA TIENDA
          </Link>
          <a
            href="https://t.me/Benotpedidosbot"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bebas tracking-widest text-sm border-2 border-gray-300 text-gray-700 px-10 py-3 text-center hover:border-black hover:text-black transition-all duration-200"
          >
            CONTACTAR POR TELEGRAM
          </a>
        </div>
      </main>
    </div>
  );
}
