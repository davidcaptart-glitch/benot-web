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
   Organic crowd — deterministic "random" to avoid hydration mismatch
───────────────────────────────────────────────────────────────── */
function deterministicNoise(seed: number): number {
  // Simple sin-hash, returns 0–1
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5) % 1;
}

const ROWS = 5;
const COLS = 11;
const BENOT_ROW = 2;
const BENOT_COL = 5; // centre of 11

// Pre-build the full crowd grid config once (module-level, never changes)
const CROWD_CONFIG = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLS }, (_, col) => {
    const idx = row * COLS + col;
    const isBenot = row === BENOT_ROW && col === BENOT_COL;
    return {
      isBenot,
      opacity:  isBenot ? 1   : 0.45 + deterministicNoise(idx)       * 0.45,
      scale:    isBenot ? 1   : 0.78 + deterministicNoise(idx + 100)  * 0.28,
      yOffset:  isBenot ? 0   : (deterministicNoise(idx + 200) - 0.5) * 6,
    };
  })
);

const SHIRT_PATH =
  "M35 12 L8 42 L28 50 L23 118 L97 118 L92 50 L112 42 L85 12 Q72 22 60 22 Q48 22 35 12 Z";

function ShirtSVG({
  fill,
  stroke = "transparent",
  className = "",
}: {
  fill: string;
  stroke?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden>
      <path d={SHIRT_PATH} fill={fill} stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Crowd grid
───────────────────────────────────────────────────────────────── */
function CrowdGrid({
  raceHex,
  benotHex,
  benotStroke,
}: {
  raceHex:     string;
  benotHex:    string;
  benotStroke: string;
}) {
  // Stroke for race-colour shirts (white crowd needs visible edge)
  const raceStroke =
    raceHex === "#D0D0D0" || raceHex === "#E8E8E8"
      ? "#ADADAD"
      : "rgba(0,0,0,0.10)";

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      {CROWD_CONFIG.map((rowArr, row) => (
        <div key={row} className="flex gap-2 sm:gap-3 items-center">
          {rowArr.map((cell, col) => (
            <div
              key={col}
              className="relative transition-all duration-700"
              style={{
                opacity:   cell.opacity,
                transform: `scale(${cell.scale}) translateY(${cell.yOffset}px)`,
                zIndex:    cell.isBenot ? 20 : 0,
                filter: cell.isBenot
                  ? `drop-shadow(0 0 8px ${
                      benotHex === "#FFFFFF" || benotHex === "#D0D0D0"
                        ? "rgba(255,255,255,0.9)"
                        : benotHex + "BF"
                    })`
                  : "none",
              }}
            >
              {cell.isBenot ? (
                // BENOT highlight — slightly larger, full opacity
                <div
                  style={{
                    transform: "scale(1.55)",
                    opacity: 1,
                  }}
                >
                  <ShirtSVG
                    fill={benotHex}
                    stroke={benotStroke}
                    className="w-5 h-5 sm:w-7 sm:h-7"
                  />
                </div>
              ) : (
                <ShirtSVG
                  fill={raceHex}
                  stroke={raceStroke}
                  className="w-4 h-4 sm:w-6 sm:h-6"
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
   Recommendation card — shows the real shirt photo
───────────────────────────────────────────────────────────────── */
function RecCard({
  rec,
  raceHex,
  isPrimary,
  animDelay,
}: {
  rec:       Recommendation;
  raceHex:   string;
  isPrimary: boolean;
  animDelay: number;
}) {
  return (
    <article
      className="group flex flex-col bg-white border-2 border-gray-100 overflow-hidden hover:border-black transition-all duration-300 hover:shadow-2xl"
      style={{ transitionDelay: `${animDelay}ms` }}
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

        {/* Race vs Benot swatch */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full border border-white/30 shadow"
            style={{ backgroundColor: raceHex }}
            title="Color carrera"
          />
          <span className="font-bebas text-[9px] text-white/60">VS</span>
          {/* Shirt preview dot — thumbnail colour taken from category */}
          <div
            className="w-4 h-4 rounded-full border border-white/30 shadow overflow-hidden"
            title="BENOT"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rec.shirt.src}
              alt=""
              className="w-full h-full object-cover object-top scale-[3]"
              aria-hidden
            />
          </div>
        </div>

        {/* Bottom accent line on primary */}
        {isPrimary && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF1E1E]" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-5">
        <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-1">
          {rec.shirt.code}
        </p>
        <p className="font-bebas tracking-widest text-xl text-black mb-1 leading-tight">
          {rec.shirt.name}
        </p>
        <p className="font-bebas tracking-widest text-xs text-gray-400 mb-6 flex-1">
          {rec.shirt.slogan.toUpperCase()}
        </p>

        <Link
          href="/configurador"
          className="w-full font-bebas tracking-widest text-sm py-3 flex items-center justify-center gap-2 bg-black text-white hover:bg-[#FF1E1E] transition-colors duration-200"
        >
          PEDIR ESTA CAMISETA →
        </Link>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
export default function RunningDestaca() {
  const [selected,  setSelected]  = useState<RaceColorId | null>(null);
  const [visible,   setVisible]   = useState(false);

  const raceCfg = RACE_COLORS.find((c) => c.id === selected);
  const recs    = selected ? getRecommendations(selected) : [];

  // Primary recommendation drives the crowd's BENOT shirt colour
  const benotCategory = recs[0]?.shirt.category ?? "cyan";
  const BENOT_HEX: Record<string, string> = {
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
  const BENOT_STROKE: Record<string, string> = {
    white: "#E5E7EB",
  };

  const benotHex    = BENOT_HEX[benotCategory]    ?? "#06B6D4";
  const benotStroke = BENOT_STROKE[benotCategory] ?? "transparent";
  const raceHex     = raceCfg?.crowd ?? "#9CA3AF";

  useEffect(() => {
    setVisible(false);
    if (!selected) return;
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [selected]);

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

        <div className="mb-14">
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

      {/* ── Crowd visualisation ─────────────────────────────────── */}
      <div className="py-14 px-6" style={{ backgroundColor: "#f3f3f1" }}>
        <div className="max-w-[1200px] mx-auto">
          <CrowdGrid
            raceHex={raceHex}
            benotHex={benotHex}
            benotStroke={benotStroke}
          />

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-2">
              <ShirtSVG
                fill={raceHex}
                stroke={raceHex === "#D0D0D0" ? "#ADADAD" : "rgba(0,0,0,0.1)"}
                className="w-5 h-5 opacity-60"
              />
              <span className="font-bebas tracking-widest text-[11px] text-zinc-400">
                {selected
                  ? `CAMISETA OFICIAL — ${raceCfg!.label.toUpperCase()}`
                  : "CAMISETA OFICIAL DE CARRERA"}
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-300" />
            <div className="flex items-center gap-2">
              <ShirtSVG
                fill={benotHex}
                stroke={benotStroke}
                className="w-5 h-5"
              />
              <span className="font-bebas tracking-widest text-[11px] text-zinc-700 font-medium">
                TÚ CON BENOT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Color selector ──────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-4">
        <p className="font-bebas tracking-widest text-2xl sm:text-3xl text-black mb-1">
          ¿De qué color es la camiseta de la carrera?
        </p>
        <p className="font-bebas tracking-widest text-xs text-gray-400 tracking-[0.2em] mb-8">
          SELECCIONA Y TE MOSTRAMOS CÓMO DESTACAR
        </p>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {RACE_COLORS.map((c) => {
            const isActive = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`
                  flex items-center gap-2.5 px-4 py-2.5 border-2 font-bebas
                  tracking-widest text-sm transition-all duration-200
                  ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black"
                  }
                `}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
                  style={{
                    backgroundColor: c.hex,
                    borderColor:
                      c.id === "blanca"
                        ? "#ADADAD"
                        : "rgba(0,0,0,0.15)",
                  }}
                />
                {c.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recommendations ─────────────────────────────────────── */}
      <div
        className={`max-w-[1200px] mx-auto px-6 pb-20 transition-all duration-500 ease-out ${
          selected && visible
            ? "opacity-100 translate-y-0 pt-14"
            : "opacity-0 translate-y-5 pt-4 pointer-events-none"
        }`}
      >
        {selected ? (
          <>
            <div className="border-t-2 border-gray-100 pt-12 mb-10">
              <p className="font-bebas tracking-[0.35em] text-xs text-[#FF1E1E] mb-2">
                BENOT RECOMIENDA
              </p>
              <p className="font-bebas tracking-widest text-3xl sm:text-4xl text-black">
                LAS DOS CAMISETAS QUE MÁS VAN A DESTACAR.
              </p>
            </div>

            {/* Always exactly 2 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-[720px]">
              {recs.map((rec, i) => (
                <RecCard
                  key={rec.shirt.code}
                  rec={rec}
                  raceHex={raceCfg!.hex}
                  isPrimary={i === 0}
                  animDelay={i * 80}
                />
              ))}
            </div>

            {/* Bottom CTA strip */}
            <div className="mt-12 p-8 bg-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="font-bebas tracking-widest text-2xl text-white mb-1">
                  ¿LISTO PARA DESTACAR?
                </p>
                <p className="font-bebas tracking-widest text-xs text-zinc-500">
                  LA MAYORÍA LLEVARÁ LA CAMISETA OFICIAL. TÚ DECIDES.
                </p>
              </div>
              <Link
                href="/configurador"
                className="flex-shrink-0 font-bebas tracking-widest text-sm px-10 py-4 bg-[#FF1E1E] text-white hover:bg-white hover:text-black transition-all duration-200"
              >
                IR AL CONFIGURADOR →
              </Link>
            </div>
          </>
        ) : (
          <div className="pt-8 pb-4 flex items-center justify-center">
            <p className="font-bebas tracking-widest text-gray-200 text-lg">
              ↑ SELECCIONA EL COLOR DE LA CARRERA
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
