/**
 * BENOT Catalog — analizador de color basado en sharp.
 *
 * Extrae el color dominante no-fondo de una imagen de producto
 * y lo mapea a ColorCategory + ProductColorGroup.
 *
 * ⚠️  SERVER-ONLY — nunca importar desde componentes client.
 *
 * Algoritmo:
 *  1. Redimensionar a 48×48 (velocidad)
 *  2. Aplanar canal alpha sobre fondo blanco
 *  3. Descartar píxeles cercanos al blanco (fondo de producto)
 *  4. Clasificar píxeles cromáticos en 12 buckets de tono (30° cada uno)
 *  5. El bucket dominante determina la ColorCategory
 */

import type { ColorCategory, ProductColorGroup } from "./types";
import { COLOR_CATEGORY_TO_GROUP } from "./types";

/* ── Conversión RGB → HSL ────────────────────────────────────────── */

/** Devuelve [hue 0-360, saturation 0-1, lightness 0-1] */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l]; // acromático

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break;
    case gg: h = (bb - rr) / d + 2;                  break;
    default: h = (rr - gg) / d + 4;
  }

  return [h * 60, s, l];
}

/* ── Mapeo HSL → ColorCategory ──────────────────────────────────── */

/**
 * Clasifica un píxel cromático (ya filtrado de fondo y acromáticos)
 * en una de las 10 ColorCategory usando su tono dominante.
 */
function hueToCategory(h: number, s: number, l: number): ColorCategory {
  // Bordes acromaticos (por si llegan aquí)
  if (l < 0.18)                      return "black";
  if (l > 0.82 && s < 0.15)          return "white";
  if (s < 0.12)                       return l < 0.5 ? "gray" : "white";

  // Rueda cromática: rojo=0°, naranja≈30°, amarillo≈60°,
  //                 verde≈120°, cian≈180°, azul≈240°, morado≈280°
  if (h <  30 || h >= 330)           return "red";     // rojo / magenta
  if (h <  60)                        return "orange";
  if (h <  85)                        return "yellow";
  if (h < 165)                        return "green";
  if (h < 205)                        return "cyan";
  if (h < 265)                        return "blue";
  if (h < 300)                        return "purple";
  return "red"; // 300-330 es magenta rojizo
}

/* ── Resultado del análisis ─────────────────────────────────────── */

export interface ColorAnalysisResult {
  colorCategory: ColorCategory;
  colorGroup:    ProductColorGroup;
}

/* ── Función principal ──────────────────────────────────────────── */

/**
 * Analiza el color dominante no-fondo de la imagen en `imagePath`.
 * Usa import dinámico para que falle con gracia si sharp no está disponible.
 */
export async function analyzeImageColor(
  imagePath: string
): Promise<ColorAnalysisResult> {
  // Import dinámico → si sharp falla, el catch exterior devuelve fallback
  const sharp = (await import("sharp")).default;

  const { data, info } = await sharp(imagePath)
    .resize(48, 48, { fit: "fill" })
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // alpha → blanco
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels; // 3 tras flatten

  // 12 buckets de 30° para cubrir la rueda de color completa
  const hueBuckets = new Array<number>(12).fill(0);
  let darkCount  = 0;
  let lightCount = 0;
  let sampled    = 0;

  for (let i = 0; i < data.length; i += ch) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Ignorar blanco puro / fondo (umbral conservador)
    if (r > 230 && g > 230 && b > 230) continue;

    const [h, s, l] = rgbToHsl(r, g, b);
    sampled++;

    if (l < 0.18)             { darkCount++;  continue; }
    if (l > 0.80 || s < 0.12) { lightCount++; continue; }

    // Píxel cromático: clasificar en bucket de 30°
    hueBuckets[Math.floor(h / 30) % 12]++;
  }

  // Casi nada muestreado → camiseta blanca sobre fondo blanco
  if (sampled === 0) {
    return { colorCategory: "white", colorGroup: COLOR_CATEGORY_TO_GROUP["white"] };
  }

  const chromatic = hueBuckets.reduce((a, b) => a + b, 0);

  // Camiseta acromática (negro o blanco predomina sobre cromático)
  if (chromatic < sampled * 0.25) {
    const cat: ColorCategory = darkCount >= lightCount ? "black" : "white";
    return { colorCategory: cat, colorGroup: COLOR_CATEGORY_TO_GROUP[cat] };
  }

  // Bucket de tono dominante → punto medio del bucket
  const dominantBucket = hueBuckets.indexOf(Math.max(...hueBuckets));
  const dominantHue    = dominantBucket * 30 + 15;

  const cat = hueToCategory(dominantHue, 0.7, 0.5);
  return { colorCategory: cat, colorGroup: COLOR_CATEGORY_TO_GROUP[cat] };
}
