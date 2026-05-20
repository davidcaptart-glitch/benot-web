/**
 * Running shirt color data + contrast recommendation engine.
 *
 * HOW IT WORKS:
 * Each shirt has a `category` (dominant HSL color group).
 * Each race-color selector maps to a ranked list of shirt codes
 * ordered by chromatic contrast (complementary colors + lightness delta).
 *
 * TO ADD A NEW SHIRT:
 * 1. Add an entry to SHIRTS_DATA with its color category.
 * 2. Rebuild — it will automatically appear in the correct recommendations.
 */

export type ColorCategory =
  | "white" | "black" | "red" | "orange" | "yellow"
  | "green" | "cyan" | "blue" | "purple" | "gray";

export type RaceColorId =
  | "roja" | "negra" | "azul" | "blanca"
  | "amarilla" | "verde" | "naranja" | "otra";

export interface ShirtData {
  code:      string;
  src:       string;
  name:      string;   // short label shown in card
  slogan:    string;   // phrase on the shirt
  category:  ColorCategory;
}

/* ─── Shirt catalog (add new entries here as you upload images) ──────── */
export const SHIRTS_DATA: ShirtData[] = [
  {
    code:     "BNTRN001",
    src:      "/assets/Configurador/Running/BNTRN001.png",
    name:     "NO ME PERMITO PARAR",
    slogan:   "Enfoque. Disciplina. Acción.",
    category: "white",
  },
  {
    code:     "BNTRN002",
    src:      "/assets/Configurador/Running/BNTRN002.png",
    name:     "NO ME RINDO",
    slogan:   "Enfoque. Disciplina. Acción.",
    category: "purple",
  },
  {
    code:     "BNTRN003",
    src:      "/assets/Configurador/Running/BNTRN003.png",
    name:     "CREO HÁBITOS, NO EXCUSAS",
    slogan:   "Enfoque. Disciplina. Acción.",
    category: "cyan",
  },
  {
    code:     "BNTRN004",
    src:      "/assets/Configurador/Running/BNTRN004.png",
    name:     "NO GANA EL MEJOR, SI EL PREPARADO",
    slogan:   "Enfoque. Disciplina. Acción.",
    category: "orange",
  },
];

/* ─── Contrast matrix ────────────────────────────────────────────────── */
/**
 * Score 0–100: how much does a shirt of `shirtCategory` stand out
 * against a crowd wearing `raceColor`?
 *
 * Principles:
 *  • Complementary hues (opposite on colour wheel) → very high score
 *  • High lightness contrast (dark vs. light) → high score
 *  • Same or adjacent hue → very low score
 */
const CONTRAST_SCORES: Record<ColorCategory, Record<RaceColorId, number>> = {
  //             roja  negra  azul  blanca  amarilla  verde  naranja  otra
  white:  { roja: 88, negra: 95, azul: 72, blanca: 10, amarilla: 55, verde: 70, naranja: 65, otra: 75 },
  black:  { roja: 70, negra: 10, azul: 65, blanca: 95, amarilla: 80, verde: 75, naranja: 72, otra: 70 },
  red:    { roja: 10, negra: 80, azul: 60, blanca: 82, amarilla: 55, verde: 75, naranja: 20, otra: 60 },
  orange: { roja: 22, negra: 82, azul: 95, blanca: 85, amarilla: 30, verde: 90, naranja: 10, otra: 72 },
  yellow: { roja: 50, negra: 88, azul: 80, blanca: 15, amarilla: 10, verde: 55, naranja: 35, otra: 65 },
  green:  { roja: 70, negra: 75, azul: 45, blanca: 78, amarilla: 55, verde: 10, naranja: 72, otra: 65 },
  cyan:   { roja: 95, negra: 88, azul: 50, blanca: 68, amarilla: 82, verde: 52, naranja: 95, otra: 80 },
  blue:   { roja: 65, negra: 75, azul: 10, blanca: 85, amarilla: 78, verde: 52, naranja: 88, otra: 68 },
  purple: { roja: 78, negra: 68, azul: 42, blanca: 90, amarilla: 95, verde: 72, naranja: 88, otra: 82 },
  gray:   { roja: 55, negra: 60, azul: 55, blanca: 60, amarilla: 55, verde: 52, naranja: 55, otra: 10 },
};

export interface Recommendation {
  shirt: ShirtData;
  score: number;
  label: "MÁXIMO CONTRASTE" | "MUY VISIBLE";
}

/**
 * Returns the 2 best Benot shirts for a given race colour,
 * ordered by chromatic contrast score descending.
 */
export function getRecommendations(raceColorId: RaceColorId): Recommendation[] {
  const ranked = [...SHIRTS_DATA]
    .map((shirt) => ({
      shirt,
      score: CONTRAST_SCORES[shirt.category][raceColorId],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return ranked.map((r, i) => ({
    ...r,
    label: i === 0 ? "MÁXIMO CONTRASTE" : "MUY VISIBLE",
  }));
}

/* ─── Race colour display config (used by the UI pills + crowd) ──────── */
export const RACE_COLORS: Array<{
  id:    RaceColorId;
  label: string;
  hex:   string;
  crowd: string; // hex used for shirt icons in the crowd
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
