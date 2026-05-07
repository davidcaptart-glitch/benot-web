"use client";

import { useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import type { AssetItem } from "@/lib/assets";

interface Props {
  items: AssetItem[];
  /** How many columns on the smallest grid (default: 2) */
  cols?: "2" | "3";
}

function telegramUrl(code: string) {
  return `https://t.me/Benotpedidosbot?text=${encodeURIComponent(
    `Hola, quiero hacer un pedido BENOT con el código ${code}`
  )}`;
}

export default function CatalogGrid({ items, cols = "2" }: Props) {
  const [selected, setSelected] = useState<AssetItem | null>(null);

  const gridClass =
    cols === "3"
      ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

  return (
    <>
      {/* ── Grid ── */}
      <div className={`grid ${gridClass} gap-4`}>
        {items.map((item) => (
          <div
            key={item.code}
            className="catalog-card group bg-white border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Image — click = lightbox */}
            <button
              onClick={() => setSelected(item)}
              className="block aspect-square bg-gray-50 overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1E1E]"
              aria-label={`Ver diseño ${item.code} ampliado`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.code}
                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                draggable={false}
              />
            </button>

            {/* Code + Telegram button */}
            <div className="px-3 py-3 flex flex-col gap-2">
              <span className="font-bebas tracking-widest text-[11px] text-gray-400 text-center block">
                {item.code}
              </span>
              <a
                href={telegramUrl(item.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-red w-full justify-center text-[11px] font-bebas tracking-widest py-2"
              >
                PEDIR POR TELEGRAM
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── Lightbox ── */}
      {selected && (
        <ImageLightbox
          src={selected.src}
          code={selected.code}
          telegramUrl={telegramUrl(selected.code)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
