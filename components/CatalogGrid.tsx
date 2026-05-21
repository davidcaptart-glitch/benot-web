"use client";

import { useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import type { AssetItem } from "@/lib/assets";

interface Props {
  items: AssetItem[];
  /** How many columns on the smallest grid (default: 2) */
  cols?: "2" | "3";
}

function whatsappUrl(code: string) {
  return `https://wa.me/34604868048?text=${encodeURIComponent(
    `Hola, quiero hacer un pedido BENOT con el código ${code}`
  )}`;
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

            {/* Code + bot buttons */}
            <div className="px-3 py-3 flex flex-col gap-2">
              <span className="font-bebas tracking-widest text-[11px] text-gray-400 text-center block">
                {item.code}
              </span>
              <a
                href={telegramUrl(item.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full justify-center text-[11px] font-bebas tracking-widest py-2 inline-flex items-center gap-1.5 bg-[#2AABEE] hover:bg-[#1a8bc7] text-white transition-colors duration-200"
              >
                <svg className="w-3 h-3 fill-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.01 9.474c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.747z" />
                </svg>
                TELEGRAM
              </a>
              <a
                href={whatsappUrl(item.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full justify-center text-[11px] font-bebas tracking-widest py-2 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white transition-colors duration-200"
              >
                <svg className="w-3 h-3 fill-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                WHATSAPP
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
          whatsappUrl={whatsappUrl(selected.code)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
