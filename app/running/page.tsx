import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import RunningDestaca from "@/components/RunningDestaca";
import CatalogGrid from "@/components/CatalogGrid";
import { getAssetFiles } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Running | BENOT",
  description:
    "Camisetas BENOT Running. Diseñadas para correr y para destacar. Elige la tuya según el color de la carrera.",
};

export default function RunningPage() {
  const items = getAssetFiles("Configurador/Running");

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-[68px]">

        {/* ── Herramienta de contraste de color ── */}
        <RunningDestaca />

        {/* ── Catálogo ─────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-6 py-16">

          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-bebas tracking-[0.35em] text-xs text-[#FF1E1E] mb-2">
                CATÁLOGO
              </p>
              <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl text-black leading-none">
                CAMISETAS RUNNING
              </h2>
              <p className="font-bebas tracking-widest text-xs text-gray-400 mt-1.5">
                {items.length} DISEÑOS · CÓDIGO BASE: BNTRN
              </p>
              <div className="w-10 h-[3px] bg-[#FF1E1E] mt-3" />
            </div>
            <a
              href="https://t.me/Benotpedidosbot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas tracking-widest text-xs text-[#FF1E1E] hover:underline hidden sm:block"
            >
              @Benotpedidosbot
            </a>
          </div>

          <CatalogGrid items={items} />

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="font-bebas tracking-widest text-gray-400 text-xs mb-4">
              ¿BUSCAS ALGO MÁS? CONSÚLTANOS POR TELEGRAM
            </p>
            <a
              href="https://t.me/Benotpedidosbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bebas tracking-widest text-sm px-8 py-3 bg-[#FF1E1E] text-white hover:bg-black transition-colors duration-200"
            >
              CONTACTAR POR TELEGRAM →
            </a>
          </div>
        </div>

      </main>

      <footer className="bg-black py-6 text-center">
        <p className="font-bebas tracking-widest text-gray-600 text-xs">
          © 2026 BENOT. TODOS LOS DERECHOS RESERVADOS.
        </p>
      </footer>
    </div>
  );
}
