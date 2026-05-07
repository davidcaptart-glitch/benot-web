import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada | BENOT",
};

export default function NotFound() {
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

      {/* 404 */}
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-[120px] leading-none">
        404
      </p>

      <p className="font-bebas tracking-widest text-white text-2xl mt-2 mb-2">
        PÁGINA NO ENCONTRADA
      </p>

      <p className="font-bebas tracking-widest text-gray-500 text-base mb-10">
        Esta camiseta no existe en nuestro catálogo... todavía.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="font-bebas tracking-widest text-sm bg-[#FF1E1E] text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-200"
        >
          VOLVER AL INICIO
        </Link>
        <a
          href="https://t.me/BENOTpedidos"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bebas tracking-widest text-sm border border-white/30 text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-200"
        >
          HACER UN PEDIDO
        </a>
      </div>
    </div>
  );
}
