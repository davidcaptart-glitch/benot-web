/**
 * BENOT Catalog — shared product types.
 *
 * ProductColorGroup  = simplified 4-bucket UI filter (lo que ve el usuario)
 * ColorCategory      = 10-way semantic color (usado por el motor de contraste)
 */

/** Los 4 grupos de color que aparecen en el filtro de catálogo. */
export type ProductColorGroup = "negro" | "blanco" | "rojo" | "azul";

/** Etiqueta semántica de color de alta precisión — usada por el motor de recomendación. */
export type ColorCategory =
  | "white"
  | "black"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "gray";

/**
 * Mapeo de ColorCategory (10 valores) → ProductColorGroup (4 valores).
 * Principio: agrupar por familia perceptual, no por matemática exacta.
 */
export const COLOR_CATEGORY_TO_GROUP: Record<ColorCategory, ProductColorGroup> = {
  white:  "blanco",
  black:  "negro",
  gray:   "negro",   // los grises son oscuros / neutros → negro
  red:    "rojo",
  orange: "rojo",    // naranja es visualmente de familia roja en el filtro
  yellow: "blanco",  // el amarillo es claro → bucket blanco
  green:  "negro",   // la mayoría de verdes son tonos oscuros
  cyan:   "azul",
  blue:   "azul",
  purple: "azul",    // el morado se inclina hacia el espectro azul
};

/** Un producto del catálogo Running. */
export interface RunningProduct {
  /** File stem del archivo, ej: "BNTRN005". También se usa como código de pedido. */
  id: string;

  /** URL pública de la imagen, ej: "/assets/Running/BNTRN005.png". */
  src: string;

  /** Grupo de color simplificado para el filtro UI. Auto-detectado o con override. */
  colorGroup: ProductColorGroup;

  /** Color semántico para el motor de contraste. Auto-detectado o con override. */
  colorCategory: ColorCategory;

  /** Nombre corto del producto (se muestra en las tarjetas). Fallback: id. */
  name: string;

  /** Frase motivacional o eslogan. Fallback: texto por defecto. */
  slogan: string;

  /** Si es true, aparece primero en el catálogo. Default: false. */
  featured: boolean;

  /** Muestra la etiqueta "NUEVO". Default: false. */
  isNew: boolean;
}

/**
 * Schema de assets/Running/metadata.json.
 * Las keys son IDs de producto (ej: "BNTRN005").
 * Cualquier campo puede omitirse; los campos que falten se auto-generan.
 *
 * Para añadir metadata a un producto nuevo basta con añadir una entrada aquí.
 * Para un producto sin entrada, todo se auto-detecta.
 */
export interface RunningMetadata {
  [productId: string]: Partial<{
    name:          string;
    slogan:        string;
    colorGroup:    ProductColorGroup;
    colorCategory: ColorCategory;
    featured:      boolean;
    isNew:         boolean;
  }>;
}
