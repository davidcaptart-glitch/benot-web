import Link from "next/link";
import Header from "@/components/Header";
import CatalogGrid from "@/components/CatalogGrid";
import type { AssetItem } from "@/lib/assets";

interface Props {
  title: string;
  subtitle: string;
  items: AssetItem[];
}

export default function CatalogPage({ title, subtitle, items }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 pt-[90px] pb-16">

        {/* Back + handle */}
        <div className="flex items-center justify-between mb-7">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bebas tracking-widest text-[13px] text-gray-400 hover:text-black transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200 inline-block">←</span>
            VOLVER AL INICIO
          </Link>
          <a
            href="https://t.me/BENOTpedidos"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bebas tracking-widest text-[13px] text-[#FF1E1E] hover:underline"
          >
            @BENOTpedidos
          </a>
        </div>

        {/* Title */}
        <div className="mb-7 fade-in-up">
          <h1 className="font-bebas text-5xl sm:text-6xl tracking-tight text-black leading-none">
            {title}
          </h1>
          <p className="text-gray-400 text-[11px] mt-1.5 font-bebas tracking-widest">{subtitle}</p>
          <div className="w-12 h-[3px] bg-[#FF1E1E] mt-3" />
        </div>

        {/* Grid with lightbox — client component */}
        <CatalogGrid items={items} />

        {/* Bottom CTA */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="font-bebas tracking-widest text-gray-400 text-xs mb-4 uppercase">
            ¿No encuentras lo que buscas? Diseño personalizado
          </p>
          <a
            href="https://t.me/BENOTpedidos"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-red font-bebas tracking-widest text-sm inline-flex"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M22.265 2.428a1.99 1.99 0 0 0-2.021-.338L2.38 9.005C1.17 9.478.363 10.62.363 11.913c0 1.293.808 2.435 2.017 2.908l4.102 1.573 1.56 5.023c.166.534.647.903 1.205.903.33 0 .648-.12.898-.337l2.515-2.24 4.48 3.494c.282.22.624.34.97.34.847 0 1.567-.598 1.717-1.428l3.04-16.77a1.99 1.99 0 0 0-.602-1.951z" />
            </svg>
            CONTACTAR POR TELEGRAM →
          </a>
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
