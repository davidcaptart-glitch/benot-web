"use client";

/**
 * WomenCollection
 *
 * Sección "Primera Colección Femenina BENOT" para la página Running.
 * Muestra un único modelo (BNTRW001) con N colorways en un carrusel
 * de una imagen a la vez. Las flechas y los dots cambian el colorway
 * con una transición suave de opacidad.
 *
 * Los items se reciben como prop (cargados server-side en el page).
 * El componente es 100% auto-contenido y añadir más colorways a la
 * carpeta assets/Configurador/Running/BNTRW001/ los muestra automáticamente.
 */

import { useState, useCallback } from "react";
import type { AssetItem } from "@/lib/assets";

/* ── Mapa sufijo → nombre de colorway ─────────────────────────── */

const COLORWAY_LABELS: Record<string, string> = {
  C: "CYAN",
  G: "VERDE",
  M: "MAGENTA",
  O: "NARANJA",
  P: "MORADO",
  R: "ROJO",
  W: "BLANCO",
};

function colorLabel(code: string): string {
  const suffix = code.slice(-1).toUpperCase();
  return COLORWAY_LABELS[suffix] ?? code;
}

/* ── Props ──────────────────────────────────────────────────────── */

interface Props {
  items: AssetItem[];
}

/* ── Componente ─────────────────────────────────────────────────── */

export default function WomenCollection({ items }: Props) {
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback((next: number) => {
    if (next === index) return;
    setVisible(false);
    setTimeout(() => { setIndex(next); setVisible(true); }, 180);
  }, [index]);

  const prev = () => goTo(index === 0 ? items.length - 1 : index - 1);
  const next = () => goTo(index === items.length - 1 ? 0 : index + 1);

  if (items.length === 0) return null;

  const current = items[index];
  const label   = colorLabel(current.code);

  return (
    <section className="border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-20">

        {/* ── Cabecera ─────────────────────────────────────────── */}
        <div className="text-center mb-16">
          {/* Línea decorativa + label */}
          <div className="flex items-center justify-center gap-5 mb-8">
            <div className="h-px bg-gray-200 w-16 sm:w-24" />
            <p className="font-bebas tracking-[0.45em] text-[11px] text-[#FF1E1E]">
              COLECCIÓN FEMENINA
            </p>
            <div className="h-px bg-gray-200 w-16 sm:w-24" />
          </div>

          <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl lg:text-6xl text-black leading-none mb-6">
            PRIMERA COLECCIÓN<br className="hidden sm:block" /> FEMENINA BENOT
          </h2>

          <p className="font-bebas tracking-widest text-sm sm:text-[15px] text-gray-500 max-w-[480px] mx-auto leading-[1.7]">
            ESTA ES LA PRIMERA COLECCIÓN FEMENINA DE BENOT.<br />
            SI LA COMUNIDAD RESPONDE, LLEGARÁN<br className="hidden sm:block" />
            NUEVOS DISEÑOS EXCLUSIVOS.
          </p>

          <div className="w-10 h-[3px] bg-[#FF1E1E] mx-auto mt-8" />
        </div>

        {/* ── Badges de modelo ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="font-bebas tracking-[0.35em] text-[11px] text-gray-400 border border-gray-200 px-4 py-2">
            BNTRW001
          </span>
          <span className="font-bebas text-gray-300">·</span>
          <span className="font-bebas tracking-[0.3em] text-[11px] text-black px-4 py-2 bg-gray-50">
            EDICIÓN LIMITADA
          </span>
          <span className="font-bebas text-gray-300">·</span>
          <span className="font-bebas tracking-[0.3em] text-[11px] text-[#FF1E1E] px-4 py-2 border border-[#FF1E1E]/30 bg-[#FF1E1E]/5">
            {items.length} COLORWAYS
          </span>
        </div>

        {/* ── Carrusel ─────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-16">

          {/* Flecha izquierda */}
          <button
            onClick={prev}
            aria-label="Colorway anterior"
            className="flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 border-2 border-gray-200 flex items-center justify-center text-black hover:border-black hover:bg-black hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Imagen + overlays */}
          <div className="relative w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[460px]">
            <div
              className="transition-opacity duration-200 ease-in-out"
              style={{ opacity: visible ? 1 : 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.src}
                alt={`BNTRW001 — ${label}`}
                className="w-full h-auto block"
                key={current.code}
                draggable={false}
              />
            </div>

            {/* Overlay inferior: colorway name + posición */}
            <div
              className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none transition-opacity duration-200"
              style={{ opacity: visible ? 1 : 0 }}
            >
              <span className="font-bebas tracking-widest text-xs px-3 py-1.5 bg-black/80 text-white backdrop-blur-sm">
                {label}
              </span>
              <span className="font-bebas tracking-widest text-xs px-3 py-1.5 bg-white/90 text-black backdrop-blur-sm">
                {index + 1} / {items.length}
              </span>
            </div>
          </div>

          {/* Flecha derecha */}
          <button
            onClick={next}
            aria-label="Colorway siguiente"
            className="flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 border-2 border-gray-200 flex items-center justify-center text-black hover:border-black hover:bg-black hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

        </div>

        {/* ── Indicadores de posición (dots) ───────────────────── */}
        <div className="flex items-center justify-center gap-2 mt-8 mb-14">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Colorway ${i + 1}`}
              className={`transition-all duration-200 rounded-none ${
                i === index
                  ? "w-7 h-1.5 bg-black"
                  : "w-1.5 h-1.5 rounded-full bg-gray-300 hover:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="font-bebas tracking-widest text-gray-400 text-xs mb-6">
            ¿TE GUSTA ESTA COLORWAY? CONSÚLTANOS DIRECTAMENTE Y LO PEDIMOS
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://t.me/Benotpedidosbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bebas tracking-widest text-sm px-8 py-3 bg-[#FF1E1E] text-white hover:bg-black transition-colors duration-200"
            >
              PEDIR POR TELEGRAM →
            </a>
            <a
              href="https://wa.me/34604868048"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bebas tracking-widest text-sm px-8 py-3 border-2 border-gray-200 text-gray-700 hover:border-black hover:text-black transition-all duration-200"
            >
              PEDIR POR WHATSAPP
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
