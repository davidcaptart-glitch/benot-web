/**
 * BENOT Catalog — sistema cromático premium.
 *
 * Un único tipo `RunningColor` sustituye la antigua dualidad
 * ColorCategory + ProductColorGroup.
 *
 * Principio: los colores de la colección Running NO son colores básicos CSS.
 * Son familias cromáticas premium con identidad visual propia.
 */

/* ─── Paleta de colores Running ─────────────────────────────────── */

export type RunningColor =
  | "white_ice"        // Blanco Hielo — frío, casi luminoso
  | "electric_purple"  // Morado Eléctrico — vívido, intenso
  | "cyan"             // Cian / Turquesa — saturado, brillante
  | "broken_orange"    // Naranja Roto — cálido, terroso-vivo
  | "emerald"          // Verde Esmeralda — profundo, natural intenso
  | "electric_blue"    // Azul Eléctrico — eléctrico, deportivo
  | "wine_red"         // Rojo Tinto — oscuro, profundo
  | "fuchsia";         // Fucsia Neón — neon, máxima saturación

/* ─── Perfil cromático de cada color ────────────────────────────── */

export interface RunningColorProfile {
  /** Identificador único del color. */
  id:           RunningColor;
  /** Nombre completo en español (UI tarjetas de recomendación). */
  label:        string;
  /** Nombre corto para pills del filtro. */
  labelShort:   string;
  /** Hex representativo del color (usado en dots + swatches). */
  hex:          string;
  /** HSL preciso para cálculos de contraste y clasificación. */
  hsl: {
    h: number;   // Tono 0-360
    s: number;   // Saturación 0-1
    l: number;   // Luminosidad 0-1
  };
  /**
   * Cromaticidad percibida 0-1.
   * Cuantifica el "impacto visual puro" del color, más allá del tono.
   * Alto = saturado/vívido. Bajo = apagado/neutro.
   */
  chroma:       number;
  /**
   * true → color eléctrico/neón que capta el ojo humano de forma especial
   * en exteriores bajo luz directa. Recibe bonus en el scoring visual.
   */
  isElectric:   boolean;
  /**
   * true → color principalmente acromático (blanco/negro/gris).
   * El contraste de luminosidad domina sobre el contraste de tono.
   */
  isAchromatic: boolean;
}

/* ─── Perfiles de la colección actual ──────────────────────────── */

export const RUNNING_COLOR_PROFILES: RunningColorProfile[] = [
  {
    id:           "white_ice",
    label:        "Blanco Hielo",
    labelShort:   "Blanco",
    hex:          "#EEF2F7",
    hsl:          { h: 210, s: 0.22, l: 0.94 },
    chroma:       0.08,
    isElectric:   false,
    isAchromatic: true,
  },
  {
    id:           "electric_purple",
    label:        "Morado Eléctrico",
    labelShort:   "Morado",
    hex:          "#8B15E8",
    hsl:          { h: 275, s: 0.88, l: 0.49 },
    chroma:       0.92,
    isElectric:   true,
    isAchromatic: false,
  },
  {
    id:           "cyan",
    label:        "Cian",
    labelShort:   "Cian",
    hex:          "#00C8D8",
    hsl:          { h: 185, s: 1.00, l: 0.42 },
    chroma:       0.95,
    isElectric:   true,
    isAchromatic: false,
  },
  {
    id:           "broken_orange",
    label:        "Naranja Roto",
    labelShort:   "Naranja",
    hex:          "#F07030",
    hsl:          { h: 22,  s: 0.88, l: 0.56 },
    chroma:       0.85,
    isElectric:   false,
    isAchromatic: false,
  },
  {
    id:           "emerald",
    label:        "Verde Esmeralda",
    labelShort:   "Verde",
    hex:          "#0DAB68",
    hsl:          { h: 155, s: 0.85, l: 0.36 },
    chroma:       0.88,
    isElectric:   false,
    isAchromatic: false,
  },
  {
    id:           "electric_blue",
    label:        "Azul Eléctrico",
    labelShort:   "Azul",
    hex:          "#104FEF",
    hsl:          { h: 222, s: 0.93, l: 0.50 },
    chroma:       0.95,
    isElectric:   true,
    isAchromatic: false,
  },
  {
    id:           "wine_red",
    label:        "Rojo Tinto",
    labelShort:   "Rojo",
    hex:          "#8B1230",
    hsl:          { h: 345, s: 0.76, l: 0.30 },
    chroma:       0.78,
    isElectric:   false,
    isAchromatic: false,
  },
  {
    id:           "fuchsia",
    label:        "Fucsia Neón",
    labelShort:   "Fucsia",
    hex:          "#FF10A0",
    hsl:          { h: 320, s: 1.00, l: 0.53 },
    chroma:       1.00,
    isElectric:   true,
    isAchromatic: false,
  },
];

/* ─── Lookup rápido por id ──────────────────────────────────────── */

const _profileMap = new Map(RUNNING_COLOR_PROFILES.map((p) => [p.id, p]));

/**
 * Devuelve el perfil completo de un RunningColor.
 * Throws si el id no existe (indicaría un error de tipado).
 */
export function getColorProfile(id: RunningColor): RunningColorProfile {
  const p = _profileMap.get(id);
  if (!p) throw new Error(`RunningColor desconocido: "${id}"`);
  return p;
}

/* ─── Producto del catálogo Running ────────────────────────────── */

/**
 * Representa un producto del catálogo Running.
 * `runningColor` es el único identificador cromático — elimina la dualidad
 * antigua entre ColorCategory y ProductColorGroup.
 */
export interface RunningProduct {
  /** File stem, e.g. "BNTRN005". Código de pedido. */
  id:           string;
  /** URL pública de la imagen. */
  src:          string;
  /** Color premium identificado. Auto-detectado o con override en metadata.json. */
  runningColor: RunningColor;
  /** Nombre del producto. Fallback: id. */
  name:         string;
  /** Eslogan / frase impresa. Fallback: texto por defecto. */
  slogan:       string;
  /** Featured → aparece primero en el catálogo. */
  featured:     boolean;
  /** Muestra badge NUEVO. */
  isNew:        boolean;
}

/* ─── Schema de metadata.json ──────────────────────────────────── */

/**
 * Overrides opcionales por producto en assets/Running/metadata.json.
 * Cualquier campo puede omitirse — el sistema auto-detecta lo que falte.
 */
export interface RunningMetadata {
  [productId: string]: Partial<{
    name:         string;
    slogan:       string;
    runningColor: RunningColor;
    featured:     boolean;
    isNew:        boolean;
  }>;
}
