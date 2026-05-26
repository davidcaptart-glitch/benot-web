"use client";

/**
 * RunningCatalogSection
 *
 * Catálogo Running con filtro de color premium.
 * Los pills del filtro muestran los colores reales de la colección
 * (no categorías genéricas), con sus nombres y dots de color exactos.
 *
 * El filtro es completamente dinámico:
 *  • Solo aparecen pills de colores presentes en el catálogo
 *  • Los contadores se actualizan automáticamente
 *  • Nuevos RunningColor → aparecen automáticamente al añadir productos
 */

import { useState, useMemo, useCallback } from "react";
import CatalogGrid                         from "@/components/CatalogGrid";
import {
  RUNNING_COLOR_PROFILES,
  type RunningProduct,
  type RunningColor,
} from "@/lib/catalog/types";
import type { AssetItem } from "@/lib/assets";

/* ── Tipos ────────────────────────────────────────────────────────── */

type FilterValue = "all" | RunningColor;

/* ── Adaptador RunningProduct → AssetItem ───────────────────────── */

function toAssetItem(p: RunningProduct): AssetItem {
  return { code: p.id, filename: `${p.id}.png`, src: p.src };
}

/* ── Props ──────────────────────────────────────────────────────── */

interface Props {
  products:         RunningProduct[];
  runningColorCounts: Partial<Record<RunningColor, number>>;
}

/* ── Componente ─────────────────────────────────────────────────── */

export default function RunningCatalogSection({ products, runningColorCounts }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  // Solo mostrar pills para colores con ≥1 producto (orden de la colección)
  const activePills = useMemo(() =>
    RUNNING_COLOR_PROFILES.filter(
      (p) => (runningColorCounts[p.id] ?? 0) > 0
    ),
    [runningColorCounts]
  );

  const filteredItems = useMemo<AssetItem[]>(() => {
    const filtered =
      activeFilter === "all"
        ? products
        : products.filter((p) => p.runningColor === activeFilter);
    return filtered.map(toAssetItem);
  }, [products, activeFilter]);

  const handleFilter = useCallback((v: FilterValue) => setActiveFilter(v), []);

  const totalCount = activeFilter === "all"
    ? products.length
    : (runningColorCounts[activeFilter as RunningColor] ?? 0);

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

      {/* ── Filtro de color premium ──────────────────────────────── */}
      {activePills.length > 1 && (
        <div
          className="flex flex-wrap gap-2 mb-8"
          role="group"
          aria-label="Filtrar por color"
        >
          {/* Pill "TODOS" */}
          <FilterPill
            label="TODOS"
            count={products.length}
            isActive={activeFilter === "all"}
            dot={null}
            onClick={() => handleFilter("all")}
          />

          {/* Pills de RunningColor presentes en el catálogo */}
          {activePills.map((profile) => (
            <FilterPill
              key={profile.id}
              label={profile.labelShort.toUpperCase()}
              count={runningColorCounts[profile.id] ?? 0}
              isActive={activeFilter === profile.id}
              dot={profile.hex}
              isLight={profile.isAchromatic && profile.hsl.l > 0.8}
              onClick={() => handleFilter(profile.id)}
            />
          ))}
        </div>
      )}

      {/* ── Indicador de filtro activo ───────────────────────────── */}
      {activeFilter !== "all" && (
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const profile = RUNNING_COLOR_PROFILES.find(p => p.id === activeFilter);
            return profile ? (
              <>
                <span
                  className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: profile.hex }}
                />
                <span className="font-bebas tracking-widest text-xs text-gray-500">
                  MOSTRANDO: {profile.label.toUpperCase()} · {totalCount} DISEÑO{totalCount !== 1 ? "S" : ""}
                </span>
                <button
                  onClick={() => handleFilter("all")}
                  className="font-bebas tracking-widest text-xs text-[#FF1E1E] hover:underline ml-auto"
                >
                  VER TODOS →
                </button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {filteredItems.length > 0 ? (
        <CatalogGrid items={filteredItems} />
      ) : (
        <EmptyState onReset={() => handleFilter("all")} />
      )}

      {/* ── CTA ──────────────────────────────────────────────────── */}
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

/* ── Sub-componentes ────────────────────────────────────────────── */

interface FilterPillProps {
  label:    string;
  count:    number;
  isActive: boolean;
  dot:      string | null;  // hex o null para "TODOS"
  isLight?: boolean;        // true → dot necesita borde oscuro (white_ice)
  onClick:  () => void;
}

function FilterPill({ label, count, isActive, dot, isLight = false, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`
        flex items-center gap-2 px-4 py-2 border-2 font-bebas
        tracking-widest text-sm transition-all duration-200
        ${isActive
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-black"
        }
      `}
    >
      {dot !== null && (
        <span
          className="w-3 h-3 rounded-full flex-shrink-0 border"
          style={{
            backgroundColor: dot,
            borderColor: isLight ? "#9CA3AF" : "rgba(0,0,0,0.12)",
          }}
          aria-hidden
        />
      )}
      {label}
      <span className={`
        font-bebas text-[10px] px-1.5 py-0.5 rounded-sm min-w-[18px] text-center
        ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}
      `}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-bebas tracking-widest text-gray-200 text-2xl mb-2">
        SIN RESULTADOS
      </p>
      <p className="font-bebas tracking-widest text-gray-400 text-xs mb-6">
        NO HAY DISEÑOS EN ESTE COLOR TODAVÍA
      </p>
      <button
        onClick={onReset}
        className="font-bebas tracking-widest text-sm px-6 py-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors duration-200"
      >
        VER TODOS →
      </button>
    </div>
  );
}
