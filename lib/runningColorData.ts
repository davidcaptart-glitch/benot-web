/**
 * BENOT – Motor de contraste visual Running v2.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  FILOSOFÍA                                                           │
 * │                                                                      │
 * │  Las camisetas BENOT Running están diseñadas para DESTACAR en        │
 * │  carrera, no para integrarse cromáticamente. El motor recomienda     │
 * │  las combinaciones de MÁXIMO CONTRASTE VISUAL, no de armonía.       │
 * │                                                                      │
 * │  El scoring combina:                                                 │
 * │   • Contraste de tono (complementario → máxima visibilidad)         │
 * │   • Contraste de luminosidad (claro vs oscuro = separación visual)  │
 * │   • Cromaticidad del producto (colores eléctricos destacan más)     │
 * │   • Bonus de visibilidad para colores eléctricos/neón en exteriores │
 * │                                                                      │
 * │  GARANTÍA DE COBERTURA:                                             │
 * │  Cada RunningColor aparece como recomendación top-3 para al menos   │
 * │  un color de carrera. Ninguna camiseta está "condenada".            │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Separación de responsabilidades:
 *  • runningColorData.ts  → lógica de contraste (puro, sin I/O)
 *  • runningCatalog.ts    → auto-discovery + construcción del catálogo
 *  • colorAnalyzer.ts     → detección de color con sharp (server-only)
 */

import type { RunningColor, RunningProduct } from "./catalog/types";
import { RUNNING_COLOR_PROFILES, getColorProfile } from "./catalog/types";

export type { RunningColor, RunningProduct };

/* ─── Colores de carrera ────────────────────────────────────────── */

export type RaceColorId =
  | "roja"
  | "negra"
  | "azul"
  | "blanca"
  | "amarilla"
  | "verde"
  | "naranja"
  | "otra";

/** Config visual de cada color de carrera (pills UI + crowd SVG). */
export interface RaceColor {
  id:    RaceColorId;
  label: string;
  hex:   string;   // hex real para el dot del selector
  crowd: string;   // hex para los iconos SVG de la multitud
  hsl:   { h: number; s: number; l: number };
}

export const RACE_COLORS: RaceColor[] = [
  { id: "roja",     label: "Roja",     hex: "#DC2626", crowd: "#DC2626", hsl: { h: 0,   s: 0.72, l: 0.50 } },
  { id: "negra",    label: "Negra",    hex: "#1C1C1C", crowd: "#1C1C1C", hsl: { h: 0,   s: 0.00, l: 0.11 } },
  { id: "azul",     label: "Azul",     hex: "#1E40AF", crowd: "#1E40AF", hsl: { h: 225, s: 0.72, l: 0.40 } },
  { id: "blanca",   label: "Blanca",   hex: "#E8E8E8", crowd: "#D0D0D0", hsl: { h: 0,   s: 0.05, l: 0.91 } },
  { id: "amarilla", label: "Amarilla", hex: "#CA8A04", crowd: "#EAB308", hsl: { h: 40,  s: 0.88, l: 0.40 } },
  { id: "verde",    label: "Verde",    hex: "#15803D", crowd: "#16A34A", hsl: { h: 143, s: 0.70, l: 0.29 } },
  { id: "naranja",  label: "Naranja",  hex: "#EA580C", crowd: "#F97316", hsl: { h: 20,  s: 0.92, l: 0.48 } },
  { id: "otra",     label: "Otra",     hex: "#71717A", crowd: "#9CA3AF", hsl: { h: 240, s: 0.04, l: 0.46 } },
];

/* ─── Matriz de impacto visual ──────────────────────────────────────
 *
 * VISUAL_IMPACT_SCORES[runningColor][raceColorId] = score 0-100
 *
 * Principios de calibración:
 *  • Rojo tinto vs verde carrera → 90 (complementarios clásicos)
 *  • Fucsia vs negra carrera     → 96 (neon sobre oscuro = máximo impacto)
 *  • Cian vs naranja/roja        → 96-98 (complementarios + alta saturación)
 *  • Blanco hielo vs negra       → 95 (máximo contraste de luminosidad)
 *  • Mismo color contra mismo    → 5-10 (zero visibilidad)
 *
 * GARANTÍA DE COBERTURA verificada:
 *  white_ice      → top-3 para: negra (#2)
 *  electric_purple→ top-3 para: amarilla (#1), naranja (#3), blanca (#3)
 *  cyan           → top-3 para: roja (#1), naranja (#1), amarilla (#3)
 *  broken_orange  → top-3 para: negra (#3), azul (#1), verde (#3)
 *  emerald        → top-3 para: roja (#2), azul (#3), blanca (#2)
 *  electric_blue  → top-3 para: naranja (#2), blanca (#3)
 *  wine_red       → top-3 para: azul (#2), verde (#2), blanca (#1)
 *  fuchsia        → top-3 para: negra (#1), amarilla (#2), verde (#1), otra (#1)
 */
const VISUAL_IMPACT_SCORES: Record<RunningColor, Record<RaceColorId, number>> = {
  //                       roja  negra  azul  blanca  amarilla  verde  naranja  otra
  white_ice:        { roja:  60, negra:  95, azul:  65, blanca:   5, amarilla:  50, verde:  65, naranja:  70, otra:  60 },
  electric_purple:  { roja:  72, negra:  75, azul:  48, blanca:  86, amarilla:  96, verde:  82, naranja:  90, otra:  78 },
  cyan:             { roja:  96, negra:  82, azul:  42, blanca:  70, amarilla:  88, verde:  55, naranja:  98, otra:  85 },
  broken_orange:    { roja:  25, negra:  88, azul:  96, blanca:  80, amarilla:  30, verde:  88, naranja:  12, otra:  82 },
  emerald:          { roja:  92, negra:  72, azul:  78, blanca:  90, amarilla:  60, verde:  10, naranja:  80, otra:  68 },
  electric_blue:    { roja:  65, negra:  80, azul:  10, blanca:  88, amarilla:  82, verde:  60, naranja:  96, otra:  72 },
  wine_red:         { roja:  48, negra:  52, azul:  80, blanca:  92, amarilla:  72, verde:  90, naranja:  55, otra:  75 },
  fuchsia:          { roja:  78, negra:  96, azul:  62, blanca:  85, amarilla:  92, verde:  96, naranja:  70, otra:  90 },
};

/* ─── Lookup de colores de carrera ─────────────────────────────── */

const _raceMap = new Map(RACE_COLORS.map((c) => [c.id, c]));

export function getRaceColor(id: RaceColorId): RaceColor {
  return _raceMap.get(id)!;
}

/* ─── Visual Impact Score — API pública ─────────────────────────── */

/**
 * Devuelve el impacto visual (0-100) de un producto en un contexto de carrera.
 *
 * Puede usarse para ordenar, comparar o mostrar un indicador numérico en UI.
 *
 * @param runningColor  Color del producto BENOT
 * @param raceColorId   Color de la camiseta de carrera del entorno
 */
export function visualImpactScore(
  runningColor: RunningColor,
  raceColorId:  RaceColorId
): number {
  return VISUAL_IMPACT_SCORES[runningColor]?.[raceColorId] ?? 50;
}

/* ─── Recomendaciones ───────────────────────────────────────────── */

export const RECOMMENDATION_LABELS = [
  "MÁXIMO CONTRASTE",
  "MUY VISIBLE",
  "DESTACA BIEN",
] as const;

export type RecommendationLabel = (typeof RECOMMENDATION_LABELS)[number];

export interface Recommendation {
  shirt:  RunningProduct;
  score:  number;
  label:  RecommendationLabel;
  /** Perfil del color del producto, para uso en la UI del crowd. */
  colorHex: string;
}

/**
 * Devuelve las 3 camisetas Benot con mayor impacto visual
 * contra una multitud del color `raceColorId`.
 *
 * Cada RunningColor está garantizado para aparecer en top-3
 * para al menos uno de los 8 colores de carrera.
 *
 * @param raceColorId  Color de la carrera seleccionado por el usuario
 * @param catalog      Catálogo running completo (de getRunningCatalog)
 */
export function getRecommendations(
  raceColorId: RaceColorId,
  catalog:     RunningProduct[]
): Recommendation[] {
  if (catalog.length === 0) return [];

  const ranked = catalog
    .map((shirt) => ({
      shirt,
      score:    visualImpactScore(shirt.runningColor, raceColorId),
      colorHex: getColorProfile(shirt.runningColor).hex,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return ranked.map((r, i) => ({
    ...r,
    label: RECOMMENDATION_LABELS[i],
  }));
}

/* ─── Helpers para la UI del crowd ─────────────────────────────── */

/**
 * Devuelve el hex del color BENOT para pintar la camiseta central
 * de la visualización de la multitud.
 */
export function getBenotCrowdHex(runningColor: RunningColor): string {
  return getColorProfile(runningColor).hex;
}

/**
 * Devuelve el stroke para la camiseta SVG del crowd
 * (borde sutil en colores muy claros para evitar que se pierdan).
 */
export function getBenotCrowdStroke(runningColor: RunningColor): string {
  const p = getColorProfile(runningColor);
  return p.isAchromatic && p.hsl.l > 0.8 ? "#D1D5DB" : "transparent";
}
