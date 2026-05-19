"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────── */
type RaceColorId =
  | "roja" | "negra" | "azul" | "blanca"
  | "amarilla" | "verde" | "naranja" | "otra";
type BenotColorId = "blanca" | "negra" | "roja";

interface RaceColor   { id: RaceColorId; label: string; hex: string; }
interface BenotRec    { colorId: BenotColorId; label: string; desc: string; }

/* ─────────────────────────────────────────────────────────────────
   Color data
───────────────────────────────────────────────────────────────── */
const RACE_COLORS: RaceColor[] = [
  { id: "roja",     label: "Roja",     hex: "#DC2626" },
  { id: "negra",    label: "Negra",    hex: "#111111" },
  { id: "azul",     label: "Azul",     hex: "#1E40AF" },
  { id: "blanca",   label: "Blanca",   hex: "#F1F5F9" },
  { id: "amarilla", label: "Amarilla", hex: "#CA8A04" },
  { id: "verde",    label: "Verde",    hex: "#15803D" },
  { id: "naranja",  label: "Naranja",  hex: "#EA580C" },
  { id: "otra",     label: "Otra",     hex: "#71717A" },
];

const BENOT: Record<BenotColorId, {
  hex: string; stroke: string; previewBg: string; label: string;
}> = {
  blanca: { hex: "#FFFFFF", stroke: "#E5E7EB", previewBg: "#111111", label: "BLANCA" },
  negra:  { hex: "#111111", stroke: "transparent", previewBg: "#F4F4F5", label: "NEGRA" },
  roja:   { hex: "#FF1E1E", stroke: "transparent", previewBg: "#111111", label: "ROJA" },
};

/* contrast labels → badge colour map (static strings so Tailwind picks them up) */
const BADGE: Record<string, string> = {
  "Máximo contraste": "bg-black text-white",
  "Muy visible":      "bg-[#FF1E1E] text-white",
  "Minimal":          "bg-zinc-700 text-white",
  "Equilibrada":      "bg-zinc-500 text-white",
};

const CONTRAST_MAP: Record<RaceColorId, BenotRec[]> = {
  roja: [
    { colorId: "blanca", label: "Máximo contraste", desc: "Brilla sobre el rojo. Claridad y elegancia absolutas." },
    { colorId: "negra",  label: "Muy visible",      desc: "Oscuridad que se impone. Actitud frente a la masa." },
  ],
  negra: [
    { colorId: "blanca", label: "Máximo contraste", desc: "La luz entre la oscuridad. Imposible no verte." },
    { colorId: "roja",   label: "Muy visible",      desc: "Intensidad pura. El rojo revienta sobre el negro." },
  ],
  azul: [
    { colorId: "blanca", label: "Máximo contraste", desc: "Claridad total sobre el azul. Elegante y rotundo." },
    { colorId: "roja",   label: "Muy visible",      desc: "Calor vs. frío. Un contraste que impacta de lejos." },
    { colorId: "negra",  label: "Minimal",          desc: "Discreta pero diferente. Identidad sin estridencias." },
  ],
  blanca: [
    { colorId: "negra", label: "Máximo contraste", desc: "Negro contundente sobre el blanco. Sin concesiones." },
    { colorId: "roja",  label: "Muy visible",      desc: "Rojo intenso. Inconfundible en cualquier pelotón." },
  ],
  amarilla: [
    { colorId: "negra", label: "Máximo contraste", desc: "El negro absorbe todo el protagonismo. Definitivo." },
    { colorId: "roja",  label: "Muy visible",      desc: "Dos calientes en tensión visual. Energía pura." },
  ],
  verde: [
    { colorId: "blanca", label: "Máximo contraste", desc: "Pureza sobre el verde. Inconfundible desde el km 1." },
    { colorId: "roja",   label: "Muy visible",      desc: "El rojo siempre destaca sobre el verde. Siempre." },
    { colorId: "negra",  label: "Minimal",          desc: "Negro sobre verde. Serio, diferente, reconocible." },
  ],
  naranja: [
    { colorId: "negra",  label: "Máximo contraste", desc: "El negro sobre naranja es puro estilo urbano." },
    { colorId: "blanca", label: "Muy visible",      desc: "Luz sobre fuego. Elegante y diferente a la vez." },
    { colorId: "roja",   label: "Equilibrada",      desc: "Cálidos complementarios. Fuerza y armonía visual." },
  ],
  otra: [
    { colorId: "negra",  label: "Máximo contraste", desc: "El negro destaca sobre casi cualquier color." },
    { colorId: "blanca", label: "Muy visible",      desc: "El blanco siempre rompe con el fondo." },
    { colorId: "roja",   label: "Equilibrada",      desc: "Identidad BENOT. Diferenciación total en carrera." },
  ],
};

/* ─────────────────────────────────────────────────────────────────
   Shirt SVG (same path used site-wide)
───────────────────────────────────────────────────────────────── */
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
   Crowd grid — 11 × 5 shirts, BENOT highlighted at centre
───────────────────────────────────────────────────────────────── */
function CrowdGrid({
  raceHex,
  benotHex,
  benotStroke,
  raceStroke,
}: {
  raceHex: string;
  benotHex: string;
  benotStroke: string;
  raceStroke: string;
}) {
  const ROWS = 5;
  const COLS = 11;
  const B_ROW = 2;
  const B_COL = 5; // centre of 11

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2.5">
      {Array.from({ length: ROWS }).map((_, row) => (
        <div key={row} className="flex gap-1.5 sm:gap-2.5 items-center">
          {Array.from({ length: COLS }).map((_, col) => {
            const isBenot = row === B_ROW && col === B_COL;
            return (
              <div
                key={col}
                className="relative transition-all duration-500"
                style={{
                  transform: isBenot ? "scale(1.55)" : "scale(1)",
                  zIndex: isBenot ? 20 : 0,
                  filter: isBenot
                    ? `drop-shadow(0 0 7px ${
                        benotHex === "#FFFFFF"
                          ? "rgba(255,255,255,0.95)"
                          : benotHex + "CC"
                      })`
                    : "none",
                }}
              >
                <ShirtSVG
                  fill={isBenot ? benotHex : raceHex}
                  stroke={isBenot ? benotStroke : raceStroke}
                  className={`transition-all duration-700 ${
                    isBenot
                      ? "w-5 h-5 sm:w-7 sm:h-7"
                      : "w-4 h-4 sm:w-6 sm:h-6 opacity-70"
                  }`}
                />
              </div>
            );
          })}
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
  raceStroke,
  index,
}: {
  rec: BenotRec;
  raceHex: string;
  raceStroke: string;
  index: number;
}) {
  const b = BENOT[rec.colorId];
  const badge = BADGE[rec.label] ?? "bg-black text-white";

  return (
    <div
      className="flex flex-col border-2 border-gray-100 overflow-hidden group hover:border-black transition-all duration-300 hover:shadow-2xl"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Shirt preview */}
      <div
        className="relative flex items-center justify-center py-12 overflow-hidden"
        style={{ backgroundColor: b.previewBg }}
      >
        <ShirtSVG
          fill={b.hex}
          stroke={b.stroke}
          className="w-28 h-28 sm:w-32 sm:h-32 transition-transform duration-500 group-hover:scale-105"
        />

        {/* Race colour swatch — "what you're avoiding" */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-white/20 shadow"
            style={{ backgroundColor: raceHex }}
            title="Color carrera"
          />
          <span className="font-bebas tracking-widest text-[10px] text-white/40 leading-none">
            CARRERA
          </span>
        </div>

        {/* Primary border indicator */}
        {index === 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF1E1E]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col p-5 bg-white">
        <span
          className={`self-start font-bebas tracking-widest text-[10px] px-2.5 py-1 mb-3 ${badge}`}
        >
          {rec.label.toUpperCase()}
        </span>

        <p className="font-bebas tracking-widest text-2xl text-black mb-1">
          CAMISETA {b.label}
        </p>
        <p className="font-bebas tracking-widest text-xs text-gray-400 leading-relaxed mb-6 flex-1">
          {rec.desc.toUpperCase()}
        </p>

        {/* Visual contrast: race vs benot */}
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-6 h-6 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
            style={{ backgroundColor: raceHex, borderColor: raceStroke }}
          />
          <div className="flex-1 h-px bg-gray-200 relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 font-bebas text-[10px] text-gray-400">
              VS
            </span>
          </div>
          <div
            className="w-6 h-6 rounded-full border shadow-sm flex-shrink-0"
            style={{
              backgroundColor: b.hex,
              borderColor: rec.colorId === "blanca" ? "#e5e7eb" : "transparent",
            }}
          />
        </div>

        <Link
          href="/configurador"
          className="w-full font-bebas tracking-widest text-sm py-3 flex items-center justify-center gap-2 bg-black text-white hover:bg-[#FF1E1E] transition-colors duration-200"
        >
          CONFIGURAR ESTA →
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export default function RunningDestaca() {
  const [selected, setSelected] = useState<RaceColorId | null>(null);
  const [visible, setVisible]   = useState(false);

  const raceCfg    = RACE_COLORS.find((c) => c.id === selected);
  const recs       = selected ? CONTRAST_MAP[selected] : [];
  const primaryRec = recs[0];

  /* Crowd uses primary recommendation colour — default "blanca" if nothing selected */
  const benotForCrowd = primaryRec ? BENOT[primaryRec.colorId] : BENOT["blanca"];
  const raceHex        = raceCfg?.hex ?? "#9CA3AF";
  const raceStroke     = raceCfg?.hex === "#F1F5F9" ? "#CBD5E1" : "rgba(0,0,0,0.12)";

  /* Smooth entrance animation for recommendations */
  useEffect(() => {
    setVisible(false);
    if (!selected) return;
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [selected]);

  return (
    <section className="bg-white overflow-hidden">

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-0">

        <p className="font-bebas tracking-[0.35em] text-xs text-[#FF1E1E] mb-5">
          ✦ RUNNING
        </p>

        {/* Stat */}
        <p className="font-bebas tracking-widest text-sm sm:text-base text-gray-400 mb-8 max-w-[520px] leading-relaxed">
          EN CARRERAS POPULARES, MÁS DEL 70% DE CORREDORES
          USAN LA CAMISETA OFICIAL DE LA PRUEBA.
        </p>

        {/* Main headline */}
        <div className="mb-16">
          <h2 className="font-bebas tracking-widest text-6xl sm:text-8xl lg:text-[9rem] text-black leading-none">
            DESTACA
          </h2>
          <h2 className="font-bebas tracking-widest text-6xl sm:text-8xl lg:text-[9rem] text-black leading-none">
            ENTRE LA
          </h2>
          <h2 className="font-bebas tracking-widest text-6xl sm:text-8xl lg:text-[9rem] text-[#FF1E1E] leading-none">
            MULTITUD.
          </h2>
          <p className="font-bebas tracking-widest text-2xl sm:text-4xl text-gray-300 mt-2">
            NO SEAS UNO MÁS.
          </p>
        </div>
      </div>

      {/* ── Crowd visualisation ───────────────────────── */}
      <div className="bg-zinc-950 py-16 px-6">
        <div className="max-w-[1200px] mx-auto">

          <CrowdGrid
            raceHex={raceHex}
            benotHex={benotForCrowd.hex}
            benotStroke={benotForCrowd.stroke}
            raceStroke={raceStroke}
          />

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-2">
              <ShirtSVG
                fill={raceHex}
                stroke={raceStroke}
                className="w-5 h-5 opacity-60"
              />
              <span className="font-bebas tracking-widest text-[11px] text-zinc-500">
                {selected ? `CAMISETA OFICIAL (${raceCfg!.label.toUpperCase()})` : "CAMISETA DE CARRERA"}
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div className="flex items-center gap-2">
              <ShirtSVG
                fill={benotForCrowd.hex}
                stroke={benotForCrowd.stroke}
                className="w-5 h-5"
              />
              <span className="font-bebas tracking-widest text-[11px] text-white">
                TÚ CON BENOT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Color selector ────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-4">

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
                    borderColor: c.id === "blanca" ? "#CBD5E1" : "rgba(0,0,0,0.15)",
                  }}
                />
                {c.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recommendations ───────────────────────────── */}
      <div
        className={`
          max-w-[1200px] mx-auto px-6 pb-20 transition-all duration-500 ease-out
          ${selected && visible ? "opacity-100 translate-y-0 pt-14" : "opacity-0 translate-y-6 pt-2 pointer-events-none"}
        `}
      >
        {selected && (
          <>
            <div className="mb-10 border-t-2 border-gray-100 pt-12">
              <p className="font-bebas tracking-[0.35em] text-xs text-[#FF1E1E] mb-2">
                BENOT RECOMIENDA
              </p>
              <p className="font-bebas tracking-widest text-3xl sm:text-4xl text-black">
                ASÍ ES COMO DESTACAS HOY.
              </p>
            </div>

            <div
              className={`grid grid-cols-1 gap-4 sm:gap-6 ${
                recs.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 max-w-[640px]"
              }`}
            >
              {recs.map((rec, i) => (
                <RecCard
                  key={rec.colorId}
                  rec={rec}
                  raceHex={raceHex}
                  raceStroke={raceStroke}
                  index={i}
                />
              ))}
            </div>

            {/* CTA strip */}
            <div className="mt-12 p-8 bg-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="font-bebas tracking-widest text-2xl text-white mb-1">
                  ¿LISTO PARA DESTACAR?
                </p>
                <p className="font-bebas tracking-widest text-xs text-zinc-500">
                  VE AL CONFIGURADOR Y ELIGE TU CAMISETA RUNNING BENOT
                </p>
              </div>
              <Link
                href="/configurador"
                className="flex-shrink-0 font-bebas tracking-widest text-sm px-10 py-4 bg-[#FF1E1E] text-white hover:bg-white hover:text-black transition-all duration-200"
              >
                CONFIGURAR MI CAMISETA →
              </Link>
            </div>
          </>
        )}

        {/* Placeholder before selection */}
        {!selected && (
          <div className="pt-10 pb-8 flex items-center justify-center">
            <p className="font-bebas tracking-widest text-gray-200 text-xl">
              ↑ SELECCIONA EL COLOR DE LA CARRERA
            </p>
          </div>
        )}
      </div>

    </section>
  );
}
