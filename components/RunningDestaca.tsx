"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RACE_COLORS,
  getRecommendations,
  type RaceColorId,
  type Recommendation,
} from "@/lib/runningColorData";

/* ─────────────────────────────────────────────────────────────────
   Organic crowd — deterministic "random" (no hydration mismatch)
───────────────────────────────────────────────────────────────── */
function det(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5) % 1;
}

const ROWS = 5;
const COLS = 11;
const B_ROW = 2;
const B_COL = 5; // centre of 11

const CROWD_CFG = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => {
    const idx    = r * COLS + c;
    const isBenot = r === B_ROW && c === B_COL;
    return {
      isBenot,
      opacity: isBenot ? 1 : 0.45 + det(idx)       * 0.42,
      scale:   isBenot ? 1 : 0.78 + det(idx + 100) * 0.28,
      dy:      isBenot ? 0 : (det(idx + 200) - 0.5) * 6,
    };
  })
);

const SHIRT_PATH =
  "M35 12 L8 42 L28 50 L23 118 L97 118 L92 50 L112 42 L85 12 Q72 22 60 22 Q48 22 35 12 Z";

function ShirtSVG({
  fill, stroke = "transparent", className = "", style,
}: {
  fill: string; stroke?: string; className?: string; style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 120 130" className={className} style={style} aria-hidden>
      <path d={SHIRT_PATH} fill={fill} stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Category → hex colour (for the BENOT shirt SVG in the crowd)
───────────────────────────────────────────────────────────────── */
const CATEGORY_HEX: Record<string, string> = {
  white:  "#FFFFFF",
  black:  "#111111",
  red:    "#FF1E1E",
  orange: "#F97316",
  yellow: "#EAB308",
  green:  "#16A34A",
  cyan:   "#06B6D4",
  blue:   "#1D4ED8",
  purple: "#7C3AED",
  gray:   "#9CA3AF",
};
const CATEGORY_STROKE: Record<string, string> = {
  white: "#E5E7EB",
};

/* ─────────────────────────────────────────────────────────────────
   Crowd grid
   – Race shirts: small SVG icons with organic variation
   – BENOT centre: coloured SVG shirt, clearly larger, with glow
───────────────────────────────────────────────────────────────── */
function CrowdGrid({
  raceHex,
  benotHex,
  benotStroke,
}: {
  raceHex:     string;
  benotHex:    string;   // colour of the selected BENOT shirt
  benotStroke: string;
}) {
  const raceStroke =
    raceHex === "#D0D0D0" || raceHex === "#E8E8E8"
      ? "#ADADAD"
      : "rgba(0,0,0,0.10)";

  const glowColor =
    benotHex === "#FFFFFF"
      ? "rgba(200,200,200,0.7)"
      : benotHex + "CC";

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      {CROWD_CFG.map((rowArr, row) => (
        <div key={row} className="flex gap-2 sm:gap-3 items-center">
          {rowArr.map((cell, col) => (
            <div
              key={col}
              className="relative transition-all duration-700"
              style={{
                opacity:   cell.opacity,
                transform: `scale(${cell.scale}) translateY(${cell.dy}px)`,
                zIndex:    cell.isBenot ? 20 : 0,
              }}
            >
              {cell.isBenot ? (
                /* ── BENOT centre: coloured SVG, scaled up, with glow ── */
                <div className="relative" style={{ transform: "scale(1.7)" }}>
                  <ShirtSVG
                    fill={benotHex}
                    stroke={benotStroke}
                    className="w-7 h-8 sm:w-9 sm:h-10 transition-all duration-500"
                    style={{ filter: `drop-shadow(0 0 8px ${glowColor})` } as React.CSSProperties}
                  />
                  {/* "TÚ" label below */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="font-bebas tracking-widest text-[8px] text-zinc-500 bg-white/80 px-1 py-0.5 rounded-sm">
                      TÚ
                    </span>
                  </div>
                </div>
              ) : (
                /* ── Crowd shirt: small SVG ── */
                <ShirtSVG
                  fill={raceHex}
                  stroke={raceStroke}
                  className="w-3.5 h-4 sm:w-5 sm:h-6"
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Recommendation card
───────────────────────────────────────────────────────────────── */
function RecCard({
  rec,
  raceHex,
  isPrimary,
  isSelected,
  onClick,
}: {
  rec:        Recommendation;
  raceHex:    string;
  isPrimary:  boolean;
  isSelected: boolean;
  onClick:    () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex flex-col text-left bg-white overflow-hidden
        border-2 transition-all duration-300
        ${isSelected
          ? "border-[#FF1E1E] shadow-2xl scale-[1.01]"
          : "border-gray-100 hover:border-gray-400 hover:shadow-xl"
        }
      `}
    >
      {/* Shirt image */}
      <div className="relative bg-[#f5f5f3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rec.shirt.src}
          alt={rec.shirt.name}
          className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Label badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`font-bebas tracking-widest text-[10px] px-2.5 py-1 ${
              isPrimary ? "bg-black text-white" : "bg-[#FF1E1E] text-white"
            }`}
          >
            {rec.label}
          </span>
        </div>

        {/* Selected ring */}
        {isSelected && (
          <div className="absolute inset-0 ring-[3px] ring-inset ring-[#FF1E1E] pointer-events-none" />
        )}

        {/* Race vs Benot swatches */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 rounded px-2 py-1">
          <div
            className="w-3 h-3 rounded-full border border-white/30 shadow"
            style={{ backgroundColor: raceHex }}
          />
          <span className="font-bebas text-[8px] text-white/60">VS</span>
          <div
            className="w-3 h-3 overflow-hidden rounded-full border border-white/30"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rec.shirt.src}
              alt=""
              className="w-full h-full object-cover object-left scale-[3] translate-x-[-10%]"
              aria-hidden
            />
          </div>
        </div>

        {/* Bottom accent on primary */}
        {isPrimary && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF1E1E]" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-0.5">
          {rec.shirt.code}
        </p>
        <p className="font-bebas tracking-widest text-lg sm:text-xl text-black mb-1 leading-tight">
          {rec.shirt.name}
        </p>

        {/* "Ver en crowd" hint */}
        <p className={`font-bebas tracking-widest text-xs mt-1 transition-colors ${
          isSelected ? "text-[#FF1E1E]" : "text-gray-300 group-hover:text-gray-400"
        }`}>
          {isSelected ? "✦ MOSTRANDO EN LA MULTITUD" : "PULSA PARA VER EN LA MULTITUD"}
        </p>

        <Link
          href="/configurador"
          onClick={(e) => e.stopPropagation()}
          className="mt-4 w-full font-bebas tracking-widest text-sm py-2.5 flex items-center justify-center gap-2 bg-black text-white hover:bg-[#FF1E1E] transition-colors duration-200"
        >
          PEDIR ESTA →
        </Link>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export default function RunningDestaca() {
  const [raceColor,       setRaceColor]       = useState<RaceColorId | null>(null);
  const [selectedBenotIdx, setSelectedBenotIdx] = useState<0 | 1>(0);
  const [visible,          setVisible]          = useState(false);

  const raceCfg   = RACE_COLORS.find((c) => c.id === raceColor);
  const recs      = raceColor ? getRecommendations(raceColor) : [];
  const highlighted = recs[selectedBenotIdx] ?? null;

  // Derive crowd BENOT shirt colour from the highlighted recommendation
  const benotCategory = highlighted?.shirt.category ?? "cyan";
  const benotHex      = CATEGORY_HEX[benotCategory]    ?? "#06B6D4";
  const benotStroke   = CATEGORY_STROKE[benotCategory] ?? "transparent";

  /* Reset selection index when race colour changes */
  useEffect(() => {
    setSelectedBenotIdx(0);
    setVisible(false);
    if (!raceColor) return;
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [raceColor]);

  return (
    <section className="bg-white overflow-hidden">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-0">
        <p className="font-bebas tracking-[0.35em] text-xs text-[#FF1E1E] mb-4">
          ✦ RUNNING
        </p>
        <p className="font-bebas tracking-widest text-sm text-gray-400 mb-8 max-w-[520px] leading-relaxed">
          EN CARRERAS POPULARES, MÁS DEL 70% DE CORREDORES
          USAN LA CAMISETA OFICIAL DE LA PRUEBA.
        </p>
        <div className="mb-12">
          <h2 className="font-bebas tracking-widest text-5xl sm:text-7xl text-black leading-none">
            DESTACA ENTRE
          </h2>
          <h2 className="font-bebas tracking-widest text-5xl sm:text-7xl text-[#FF1E1E] leading-none">
            LA MULTITUD.
          </h2>
          <p className="font-bebas tracking-widest text-xl sm:text-3xl text-gray-300 mt-2">
            NO SEAS UNO MÁS.
          </p>
        </div>
      </div>

      {/* ── 1. Race colour selector ─────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 pb-0">
        <p className="font-bebas tracking-widest text-2xl sm:text-3xl text-black mb-1">
          ¿De qué color es la camiseta de la carrera?
        </p>
        <p className="font-bebas tracking-widest text-xs text-gray-400 tracking-[0.2em] mb-6">
          SELECCIONA PARA VER CÓMO DESTACAR
        </p>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {RACE_COLORS.map((c) => {
            const isActive = raceColor === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setRaceColor(c.id)}
                className={`
                  flex items-center gap-2.5 px-4 py-2.5 border-2 font-bebas
                  tracking-widest text-sm transition-all duration-200
                  ${isActive
                    ? "border-black bg-black text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black"
                  }
                `}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: c.id === "blanca" ? "#ADADAD" : "rgba(0,0,0,0.15)",
                  }}
                />
                {c.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Crowd (between selector and recs) ────────────────── */}
      <div
        className={`
          transition-all duration-500 ease-out
          ${raceColor && visible
            ? "opacity-100 translate-y-0 mt-10"
            : "opacity-0 translate-y-4 mt-6 pointer-events-none"
          }
        `}
      >
        <div className="py-12 px-6" style={{ backgroundColor: "#f3f3f1" }}>
          <div className="max-w-[1200px] mx-auto">

            {/* Instruction on mobile */}
            <p className="font-bebas tracking-widest text-xs text-zinc-400 text-center mb-8 sm:hidden">
              SELECCIONA UNA CAMISETA ABAJO PARA VERLA EN LA MULTITUD
            </p>

            <CrowdGrid
              raceHex={raceCfg?.crowd ?? "#9CA3AF"}
              benotHex={benotHex}
              benotStroke={benotStroke}
            />

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-10">
              <div className="flex items-center gap-2">
                <ShirtSVG
                  fill={raceCfg?.crowd ?? "#9CA3AF"}
                  stroke={
                    raceCfg?.id === "blanca" ? "#ADADAD" : "rgba(0,0,0,0.1)"
                  }
                  className="w-4 h-5 opacity-60"
                />
                <span className="font-bebas tracking-widest text-[11px] text-zinc-400">
                  {raceCfg
                    ? `CAMISETA OFICIAL — ${raceCfg.label.toUpperCase()}`
                    : "CAMISETA OFICIAL"}
                </span>
              </div>
              <div className="w-px h-4 bg-zinc-300" />
              <div className="flex items-center gap-2">
                <ShirtSVG
                  fill={benotHex}
                  stroke={benotStroke}
                  className="w-4 h-5"
                />
                <span className="font-bebas tracking-widest text-[11px] text-zinc-700">
                  TÚ CON BENOT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. BENOT recommendations ─────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-6 pt-10 pb-20">

          <div className="mb-6">
            <p className="font-bebas tracking-[0.35em] text-xs text-[#FF1E1E] mb-2">
              BENOT RECOMIENDA
            </p>
            <p className="font-bebas tracking-widest text-2xl sm:text-3xl text-black mb-1">
              LAS DOS CAMISETAS QUE MÁS VAN A DESTACAR.
            </p>
            <p className="font-bebas tracking-widest text-xs text-gray-400 hidden sm:block">
              PULSA CADA CAMISETA PARA VERLA EN LA MULTITUD DE ARRIBA
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-[680px]">
            {recs.map((rec, i) => (
              <RecCard
                key={rec.shirt.code}
                rec={rec}
                raceHex={raceCfg?.hex ?? "#9CA3AF"}
                isPrimary={i === 0}
                isSelected={selectedBenotIdx === i}
                onClick={() => setSelectedBenotIdx(i as 0 | 1)}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 p-6 sm:p-8 bg-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="font-bebas tracking-widest text-xl sm:text-2xl text-white mb-1">
                ¿LISTO PARA DESTACAR?
              </p>
              <p className="font-bebas tracking-widest text-xs text-zinc-500">
                LA MAYORÍA LLEVARÁ LA OFICIAL. TÚ DECIDES.
              </p>
            </div>
            <Link
              href="/configurador"
              className="flex-shrink-0 font-bebas tracking-widest text-sm px-8 py-4 bg-[#FF1E1E] text-white hover:bg-white hover:text-black transition-all duration-200"
            >
              IR AL CONFIGURADOR →
            </Link>
          </div>
        </div>
      </div>

      {/* Empty state — before any selection */}
      {!raceColor && (
        <div className="flex items-center justify-center py-10">
          <p className="font-bebas tracking-widest text-gray-200 text-base">
            ↑ SELECCIONA EL COLOR DE LA CARRERA
          </p>
        </div>
      )}

    </section>
  );
}
