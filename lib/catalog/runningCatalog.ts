/**
 * BENOT Catalog — Running catalog builder v2.
 *
 * Cambios respecto a v1:
 *  • RunningColor único reemplaza colorCategory + colorGroup
 *  • analyzeRunningColor() usa nearest-neighbor en espacio HSL premium
 *  • getRunningColorCounts() agrupación por RunningColor para filtro UI
 *
 * ⚠️  SERVER-ONLY
 */

import fs   from "fs";
import path from "path";

import type { RunningProduct, RunningMetadata, RunningColor } from "./types";

/* ── Rutas ──────────────────────────────────────────────────────── */

const ASSETS_DIR    = path.join(process.cwd(), "assets", "Running");
const META_FILE     = path.join(ASSETS_DIR, "metadata.json");
const IMAGE_PATTERN = /\.(png|jpg|jpeg|webp|avif)$/i;
const DEFAULT_SLOGAN = "Enfoque. Disciplina. Acción.";

/* ── Caché de detección de color (clave: ruta + mtime) ─────────── */

interface ColorCacheEntry { mtime: number; runningColor: RunningColor; }
const _colorCache = new Map<string, ColorCacheEntry>();

async function resolveRunningColor(
  imagePath: string,
  override?: { runningColor?: RunningColor }
): Promise<RunningColor> {

  // Override explícito en metadata.json → usar directamente, sin análisis
  if (override?.runningColor) return override.runningColor;

  let mtime: number;
  try { mtime = fs.statSync(imagePath).mtimeMs; }
  catch { return "electric_blue"; } // archivo inaccesible

  const cached = _colorCache.get(imagePath);
  if (cached && cached.mtime === mtime) return cached.runningColor;

  try {
    const { analyzeRunningColor } = await import("./colorAnalyzer");
    const runningColor = await analyzeRunningColor(imagePath);
    _colorCache.set(imagePath, { mtime, runningColor });
    return runningColor;
  } catch {
    // sharp no disponible — el override en metadata.json es el camino preferido
    return "electric_blue";
  }
}

/* ── Lector de metadata ─────────────────────────────────────────── */

function readMetadata(): RunningMetadata {
  try {
    const raw = fs.readFileSync(META_FILE, "utf-8");
    return JSON.parse(raw) as RunningMetadata;
  } catch { return {}; }
}

/* ── API pública ────────────────────────────────────────────────── */

/**
 * Devuelve el catálogo Running completo.
 * • Featured primero, luego orden alfabético por id.
 * • Colores auto-detectados con sharp + caché por mtime.
 * • Llamar sólo desde async Server Components.
 */
export async function getRunningCatalog(): Promise<RunningProduct[]> {
  let files: string[];
  try {
    files = fs
      .readdirSync(ASSETS_DIR)
      .filter((f) => IMAGE_PATTERN.test(f) && !f.startsWith("."))
      .sort();
  } catch { return []; }

  if (files.length === 0) return [];

  const meta = readMetadata();

  const products = await Promise.all(
    files.map(async (filename): Promise<RunningProduct> => {
      const id       = path.parse(filename).name;
      const src      = `/assets/Running/${encodeURIComponent(filename)}`;
      const override = meta[id] ?? {};

      const runningColor = await resolveRunningColor(
        path.join(ASSETS_DIR, filename),
        { runningColor: override.runningColor }
      );

      return {
        id,
        src,
        runningColor,
        name:     override.name     ?? id,
        slogan:   override.slogan   ?? DEFAULT_SLOGAN,
        featured: override.featured ?? false,
        isNew:    override.isNew    ?? false,
      };
    })
  );

  return products.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Conteo de productos por RunningColor — para mostrar/ocultar pills del filtro.
 */
export function getRunningColorCounts(
  catalog: RunningProduct[]
): Partial<Record<RunningColor, number>> {
  const counts: Partial<Record<RunningColor, number>> = {};
  for (const p of catalog) {
    counts[p.runningColor] = (counts[p.runningColor] ?? 0) + 1;
  }
  return counts;
}
