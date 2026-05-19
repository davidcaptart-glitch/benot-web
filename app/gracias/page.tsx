import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido confirmado | BENOT",
  description: "Tu pedido ha sido recibido. En breve recibirás un email de confirmación.",
};

export default function Gracias() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">

      {/* Logo */}
      <Link href="/" className="mb-10">
        <Image
          src="/assets/logo/logo.png"
          alt="BENOT"
          width={160}
          height={64}
          className="h-14 w-auto object-contain brightness-0 invert"
          priority
        />
      </Link>

      {/* Icono check */}
      <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#FF1E1E]">
        <svg
          className="w-10 h-10 text-[#FF1E1E]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Título */}
      <p className="font-bebas tracking-widest text-white text-5xl sm:text-6xl leading-none mb-3">
        PEDIDO CONFIRMADO
      </p>

      <p className="font-bebas tracking-widest text-[#FF1E1E] text-xl sm:text-2xl mb-6">
        GRACIAS POR CONFIAR EN BENOT
      </p>

      {/* Descripción */}
      <p className="text-gray-400 text-sm sm:text-base max-w-md mb-2 leading-relaxed">
        Hemos recibido tu pago correctamente. En breve recibirás un email de confirmación con los detalles de tu pedido y la fecha estimada de entrega.
      </p>

      <p className="text-gray-600 text-xs sm:text-sm max-w-md mb-10">
        ¿Alguna duda?{" "}
        <a
          href="mailto:pedidos@benot.store"
          className="text-white hover:text-[#FF1E1E] transition-colors"
        >
          pedidos@benot.store
        </a>
      </p>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="font-bebas tracking-widest text-sm bg-[#FF1E1E] text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-200"
        >
          VOLVER AL INICIO
        </Link>
        <a
          href="https://t.me/Benotpedidosbot"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bebas tracking-widest text-sm border border-white/30 text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-200"
        >
          HACER OTRO PEDIDO
        </a>
      </div>

    </div>
  );
}
