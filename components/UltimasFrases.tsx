import Link from "next/link";
import { getAssetFiles } from "@/lib/assets";
import CatalogGrid from "@/components/CatalogGrid";

export default function UltimasFrases() {
  const all = getAssetFiles("Frases");
  const preview = all.slice(0, 6);

  return (
    <section id="frases" className="bg-white py-10">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          {/* Title image — legible size */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/Webpage%20images/%C3%BAltimas%20frases.png"
            alt="Últimas Frases"
            className="h-14 sm:h-16 w-auto object-contain block"
          />
          <Link
            href="/frases"
            className="font-bebas tracking-widest text-sm text-[#FF1E1E] hover:text-black transition-colors whitespace-nowrap flex items-center gap-1"
          >
            VER TODAS <span aria-hidden>→</span>
          </Link>
        </div>

        {/* 6-card grid with lightbox */}
        <CatalogGrid items={preview} cols="3" />

      </div>
    </section>
  );
}
