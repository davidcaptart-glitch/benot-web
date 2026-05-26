/**
 * BENOT – Motor de recomendación de contraste Running.
 *
 * Puntúa cuánto destaca cada camiseta Benot sobre una multitud de un color dado.
 *
 * Cambio de arquitectura:
 *  • SHIRTS_DATA (array hardcodeado) ELIMINADO → el catálogo ahora viene de
 *    lib/catalog/runningCatalog.ts (auto-discovery + sharp).
 *  • getRecommendations() recibe el catálogo como argumento → stateless y testeable.
 *  • RACE_COLORS y CONTRAST_SCORES permanecen: son datos semánticos UX,
 *    no auto-detectables.
 */

import type { ColorCategory, RunningProduct } from "./catalog/types";

export type { ColorCategory };
export type { RunningProduct };

/* ── Tipos de ID de color de carrera ──────────────────────────── */
export type RaceColorId =
  | "roja"
  | "negra"
  | "azul"
  | "blanca"
  | "amarilla"
  | "verde"
  | "naranja"
  | "otra";

/* ── Matriz de contraste ────────────────────────────────────────
 *
 * Score 0–100: cuánto destaca una camiseta de `colorCategory`
 * contra una multitud que lleva `raceColor`.
 *
 * Principios:
 *  • Colores complementarios (opuestos en rueda) → score muy alto
 *  • Alto contraste de luminosidad (oscuro vs. claro) → score alto
 *  • Mismo matiz o adyacente → score muy bajo
 */
const CONTRAST_SCORES: Record<ColorCategory, Record<RaceColorId, number>> = {
  //             roja  negra  azul  blanca  amarilla  verde  naranja  otra
  white:  { roja:  88, negra:  95, azul:  72, blanca:  10, amarilla:  55, verde:  70, naranja:  65, otra:  75 },
  black:  { roja:  70, negra:  10, azul:  65, blanca:  95, amarilla:  80, verde:  75, naranja:  72, otra:  70 },
  red:    { roja:  10, negra:  80, azul:  60, blanca:  82, amarilla:  55, verde:  75, naranja:  20, otra:  60 },
  orange: { roja:  22, negra:  82, azul:  95, blanca:  85, amarilla:  30, verde:  90, naranja:  10, otra:  72 },
  yellow: { roja:  50, negra:  88, azul:  80, blanca:  15, amarilla:  10, verde:  55, naranja:  35, otra:  65 },
  green:  { roja:  70, negra:  75, azul:  45, blanca:  78, amarilla:  55, verde:  10, naranja:  72, otra:  65 },
  cyan:   { roja:  95, negra:  88, azul:  50, blanca:  68, amarilla:  82, verde:  52, naranja:  95, otra:  80 },
  blue:   { roja:  65, negra:  75, azul:  10, blanca:  85, amarilla:  78, verde:  52, naranja:  88, otra:  68 },
  purple: { roja:  78, negra:  68, azul:  42, blanca:  90, amarilla:  95, verde:  72, naranja:  88, otra:  82 },
  gray:   { roja:  55, negra:  60, azul:  55, blanca:  60, amarilla:  55, verde:  52, naranja:  55, otra:  10 },
};

/* ── Tipos de recomendación ─────────────────────────────────────── */

export interface Recommendation {
  shirt: RunningProduct;
  score: number;
  label: "MÁXIMO CONTRASTE" | "MUY VISIBLE";
}

/* ── API pública ────────────────────────────────────────────────── */

/**
 * Devuelve las 2 camisetas Benot que más contrastan contra una multitud
 * del color `raceColorId`, ordenadas de mayor a menor contraste.
 *
 * @param raceColorId  Color seleccionado de la carrera
 * @param catalog      Catálogo completo (de getRunningCatalog)
 */
export function getRecommendations(
  raceColorId: RaceColorId,
  catalog:     RunningProduct[]
): Recommendation[] {
  if (catalog.length === 0) return [];

  const ranked = catalog
    .map((shirt) => ({
      shirt,
      // Si el colorCategory no está en la matriz (no debería pasar), usar 50 como neutro
      score: CONTRAST_SCORES[shirt.colorCategory]?.[raceColorId] ?? 50,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return ranked.map((r, i) => ({
    ...r,
    label: (i === 0 ? "MÁXIMO CONTRASTE" : "MUY VISIBLE") as Recommendation["label"],
  }));
}

/* ── Config de colores de carrera (UI pills + crowd) ────────────── */

export const RACE_COLORS: Array<{
  id:    RaceColorId;
  label: string;
  hex:   string;
  crowd: string; // hex para los iconos SVG de la multitud
}> = [
  { id: "roja",     label: "Roja",     hex: "#DC2626", crowd: "#DC2626" },
  { id: "negra",    label: "Negra",    hex: "#1C1C1C", crowd: "#1C1C1C" },
  { id: "azul",     label: "Azul",     hex: "#1E40AF", crowd: "#1E40AF" },
  { id: "blanca",   label: "Blanca",   hex: "#E8E8E8", crowd: "#D0D0D0" },
  { id: "amarilla", label: "Amarilla", hex: "#CA8A04", crowd: "#EAB308" },
  { id: "verde",    label: "Verde",    hex: "#15803D", crowd: "#16A34A" },
  { id: "naranja",  label: "Naranja",  hex: "#EA580C", crowd: "#F97316" },
  { id: "otra",     label: "Otra",     hex: "#71717A", crowd: "#9CA3AF" },
];
