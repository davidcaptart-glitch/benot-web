"use client";

/**
 * RunningCatalogSection
 *
 * Sección del catálogo Running con filtro de color interactivo.
 * Recibe el catálogo completo del Server Component padre y gestiona
 * el estado del filtro en cliente (sin round-trips al servidor).
 *
 * Props:
 *  products  — catálogo completo (de getRunningCatalog)
 *  colorGroupCounts — conteo por grupo (para mostrar números en pills)
 */

import { useState, useMemo, useCallback } from "react";
import CatalogGrid                         from "@/components/CatalogGrid";
import type { RunningProduct, ProductColorGroup } from "@/lib/catalog/types";
import type { AssetItem }                  from "@/lib/assets";

/* ── Tipos ────────────────────────────────────────────────────────── */

type FilterValue = "all" | ProductColorGroup;

interface ColorPillConfig {
  value:  FilterValue;
  label:  string;
  dot?:   string; // hex color for the dot indicator
}

/* ── Config de pills ─────────────────────────────────────────────── */

const COLOR_PILLS: ColorPillConfig[] = [
  { value: "all",    label: "TODOS" },
  { value: "negro",  label: "NEGRO",  dot: "#111111" },
  { value: "blanco", label: "BLANCO", dot: "#E5E7EB" },
  { value: "rojo",   label: "ROJO",   dot: "#FF1E1E" },
  { value: "azul",   label: "AZUL",   dot: "#1D4ED8" },
];

/* ── Adaptador RunningProduct → AssetItem ───────────────────────── */
// Permite reutilizar CatalogGrid sin modificarlo

function toAssetItem(product: RunningProduct): AssetItem {
  return {
    code:     product.id,
    filename: `${product.id}.png`,
    src:      product.src,
  };
}

/* ── Componente ─────────────────────────────────────────────────── */

interface Props {
  products:         RunningProduct[];
  colorGroupCounts: Partial<Record<ProductColorGroup, number>>;
}

export default function RunningCatalogSection({ products, colorGroupCounts }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  // Filtrar productos por grupo de color — memoizado para evitar recálculos innecesarios
  const filteredItems = useMemo<AssetItem[]>(() => {
    const filtered =
      activeFilter === "all"
        ? products
        : products.filter((p) => p.colorGroup === activeFilter);
    return filtered.map(toAssetItem);
  }, [products, activeFilter]);

  const handleFilter = useCallback((value: FilterValue) => {
    setActiveFilter(value);
  }, []);

  // Sólo mostrar pills de colores que tienen al menos 1 producto
  const visiblePills = COLOR_PILLS.filter(
    (pill) => pill.value === "all" || (colorGroupCounts[pill.value as ProductColorGroup] ?? 0) > 0
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">

      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="font-bebas tracking-[0.35em] text-xs text-[#FF1E1E] mb-2">
            CATÁLOGO
          </p>
          <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl text-black leading-none">
            TODAS LAS CAMISETAS RUNNING
          </h2>
          <p className="font-bebas tracking-widest text-xs text-gray-400 mt-1.5">
            {products.length} DISEÑOS · CÓDIGO BASE: BNTRN
          </p>
          <div className="w-10 h-[3px] bg-[#FF1E1E] mt-3" />
        </div>

        <a
          href="https://t.me/Benotpedidosbot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 font-bebas tracking-widest text-xs text-[#FF1E1E] hover:underline hidden sm:block mt-1"
        >
          @Benotpedidosbot
        </a>
      </div>

      {/* ── Filtro de color ──────────────────────────────────────── */}
      {visiblePills.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filtrar por color">
          {visiblePills.map((pill) => {
            const isActive = activeFilter === pill.value;
            const count    =
              pill.value === "all"
                ? products.length
                : (colorGroupCounts[pill.value as ProductColorGroup] ?? 0);

            return (
              <button
                key={pill.value}
                onClick={() => handleFilter(pill.value)}
                aria-pressed={isActive}
                className={`
                  flex items-center gap-2 px-4 py-2 border-2 font-bebas
                  tracking-widest text-sm transition-all duration-200
                  ${isActive
                    ? "border-black bg-black text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black bg-white"
                  }
                `}
              >
                {/* Dot de color (sólo en pills de color, no en "TODOS") */}
                {pill.dot && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 border"
                    style={{
                      backgroundColor: pill.dot,
                      borderColor: pill.value === "blanco" ? "#ADADAD" : "rgba(0,0,0,0.15)",
                    }}
                    aria-hidden
                  />
                )}
                {pill.label}
                {/* Contador */}
                <span className={`
                  font-bebas text-[10px] px-1.5 py-0.5 rounded-sm
                  ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Grid de productos ────────────────────────────────────── */}
      {filteredItems.length > 0 ? (
        <CatalogGrid items={filteredItems} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-bebas tracking-widest text-gray-200 text-2xl mb-2">
            SIN RESULTADOS
          </p>
          <p className="font-bebas tracking-widest text-gray-400 text-xs">
            NO HAY DISEÑOS EN ESTE COLOR TODAVÍA
          </p>
          <button
            onClick={() => handleFilter("all")}
            className="mt-6 font-bebas tracking-widest text-sm px-6 py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors duration-200"
          >
            VER TODOS →
          </button>
        </div>
      )}

      {/* ── CTA inferior ─────────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
        <p className="font-bebas tracking-widest text-gray-400 text-xs mb-4">
          ¿BUSCAS ALGO MÁS? CONSÚLTANOS DIRECTAMENTE
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
  );
}
