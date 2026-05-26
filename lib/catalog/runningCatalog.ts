/**
 * BENOT Catalog — Running catalog builder.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  HOW IT WORKS                                               │
 * │                                                             │
 * │  1. Lee todas las imágenes de  assets/Running/              │
 * │  2. Lee overrides opcionales de assets/Running/metadata.json│
 * │  3. Auto-detecta colores con sharp (caché por mtime)        │
 * │  4. Si sharp no está disponible, usa "negro" como fallback  │
 * │  5. Ordena: featured primero, luego alfabético              │
 * │                                                             │
 * │  AÑADIR UN PRODUCTO NUEVO:                                  │
 * │  • Sube BNTRNNNN.png → assets/Running/                      │
 * │  • Aparece automáticamente en el catálogo                   │
 * │  • Color se auto-detecta con sharp                          │
 * │  • Para añadir nombre/eslogan: editar metadata.json         │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ⚠️  SERVER-ONLY — llamar sólo desde Server Components o Route Handlers.
 */

import fs   from "fs";
import path from "path";

import type {
  RunningProduct,
  RunningMetadata,
  ColorCategory,
  ProductColorGroup,
} from "./types";
import { COLOR_CATEGORY_TO_GROUP } from "./types";

/* ── Rutas ──────────────────────────────────────────────────────── */

const ASSETS_DIR    = path.join(process.cwd(), "assets", "Running");
const META_FILE     = path.join(ASSETS_DIR, "metadata.json");
const IMAGE_PATTERN = /\.(png|jpg|jpeg|webp|avif)$/i;

const DEFAULT_SLOGAN = "Enfoque. Disciplina. Acción.";

/* ── Caché de análisis de color (por imagen + mtime) ────────────── */
//
// Clave: ruta absoluta del archivo
// Valor: { mtime, colorCategory, colorGroup }
//
// Esto permite que el análisis de sharp (pesado) se ejecute una sola vez
// por imagen y se invalide automáticamente si el archivo cambia.
//

interface CacheEntry {
  mtime:         number;
  colorCategory: ColorCategory;
  colorGroup:    ProductColorGroup;
}

const _colorCache = new Map<string, CacheEntry>();

async function resolveColor(
  imagePath: string,
  override: { colorCategory?: ColorCategory; colorGroup?: ProductColorGroup }
): Promise<{ colorCategory: ColorCategory; colorGroup: ProductColorGroup }> {

  // Si el usuario ha definido ambos valores en metadata.json, usarlos directamente
  if (override.colorCategory && override.colorGroup) {
    return { colorCategory: override.colorCategory, colorGroup: override.colorGroup };
  }

  // Comprobar caché por mtime
  let mtime: number;
  try {
    mtime = fs.statSync(imagePath).mtimeMs;
  } catch {
    // Archivo no accesible → fallback
    return fallbackColor(override);
  }

  const cached = _colorCache.get(imagePath);
  if (cached && cached.mtime === mtime) {
    return applyOverride(cached, override);
  }

  // Analizar con sharp
  try {
    const { analyzeImageColor } = await import("./colorAnalyzer");
    const result = await analyzeImageColor(imagePath);
    _colorCache.set(imagePath, { mtime, ...result });
    return applyOverride(result, override);
  } catch {
    // sharp no disponible o análisis fallido → fallback con override si existe
    return fallbackColor(override);
  }
}

function applyOverride(
  base:     { colorCategory: ColorCategory; colorGroup: ProductColorGroup },
  override: { colorCategory?: ColorCategory; colorGroup?: ProductColorGroup }
): { colorCategory: ColorCategory; colorGroup: ProductColorGroup } {
  const colorCategory = override.colorCategory ?? base.colorCategory;
  const colorGroup    = override.colorGroup    ?? COLOR_CATEGORY_TO_GROUP[colorCategory];
  return { colorCategory, colorGroup };
}

function fallbackColor(
  override: { colorCategory?: ColorCategory; colorGroup?: ProductColorGroup }
): { colorCategory: ColorCategory; colorGroup: ProductColorGroup } {
  const colorCategory: ColorCategory     = override.colorCategory ?? "black";
  const colorGroup:    ProductColorGroup = override.colorGroup    ?? COLOR_CATEGORY_TO_GROUP[colorCategory];
  return { colorCategory, colorGroup };
}

/* ── Lector de metadata ─────────────────────────────────────────── */

function readMetadata(): RunningMetadata {
  try {
    const raw = fs.readFileSync(META_FILE, "utf-8");
    return JSON.parse(raw) as RunningMetadata;
  } catch {
    return {}; // metadata.json es opcional
  }
}

/* ── API pública ────────────────────────────────────────────────── */

/**
 * Devuelve el catálogo Running completo.
 *
 * • Featured items primero, luego orden alfabético por ID.
 * • Llámalo sólo desde async Server Components.
 * • El análisis de color está cacheado por mtime → solo re-analiza imágenes nuevas/modificadas.
 */
export async function getRunningCatalog(): Promise<RunningProduct[]> {

  // 1. Descubrir archivos de imagen
  let files: string[];
  try {
    files = fs
      .readdirSync(ASSETS_DIR)
      .filter((f) => IMAGE_PATTERN.test(f) && !f.startsWith("."))
      .sort();
  } catch {
    return []; // carpeta no existe todavía
  }

  if (files.length === 0) return [];

  // 2. Leer overrides opcionales
  const meta = readMetadata();

  // 3. Construir productos en paralelo (análisis de color concurrente)
  const products = await Promise.all(
    files.map(async (filename): Promise<RunningProduct> => {
      const id       = path.parse(filename).name;
      const src      = `/assets/Running/${encodeURIComponent(filename)}`;
      const override = meta[id] ?? {};

      const { colorCategory, colorGroup } = await resolveColor(
        path.join(ASSETS_DIR, filename),
        { colorCategory: override.colorCategory, colorGroup: override.colorGroup }
      );

      return {
        id,
        src,
        colorCategory,
        colorGroup,
        name:     override.name     ?? id,
        slogan:   override.slogan   ?? DEFAULT_SLOGAN,
        featured: override.featured ?? false,
        isNew:    override.isNew    ?? false,
      };
    })
  );

  // 4. Ordenar: featured first → luego alfabético por id
  return products.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Devuelve los grupos de color presentes en el catálogo con su conteo.
 * Útil para mostrar/ocultar pills del filtro dinámicamente.
 */
export function getColorGroupCounts(
  catalog: RunningProduct[]
): Partial<Record<ProductColorGroup, number>> {
  const counts: Partial<Record<ProductColorGroup, number>> = {};
  for (const product of catalog) {
    counts[product.colorGroup] = (counts[product.colorGroup] ?? 0) + 1;
  }
  return counts;
}
