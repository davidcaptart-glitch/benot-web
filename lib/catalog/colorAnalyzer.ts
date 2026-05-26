/**
 * BENOT Catalog — analizador de color premium.
 *
 * En lugar de mapear a categorías genéricas (red, blue, green),
 * detecta el RunningColor más cercano de la paleta premium de BENOT
 * usando distancia perceptual en espacio HSL.
 *
 * ⚠️  SERVER-ONLY — nunca importar desde componentes client.
 *
 * Algoritmo:
 *  1. Redimensionar imagen a 48×48 (rendimiento)
 *  2. Aplanar canal alpha sobre fondo blanco
 *  3. Descartar píxeles de fondo (near-white)
 *  4. Calcular el color dominante: bucket de tono + métricas de luminosidad/saturación
 *  5. Nearest-neighbor contra los perfiles RunningColor con distancia perceptual ponderada
 */

import type { RunningColor }       from "./types";
import { RUNNING_COLOR_PROFILES }  from "./types";

/* ─── Conversión RGB → HSL ───────────────────────────────────────── */

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
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

/* ─── Distancia perceptual en espacio HSL ────────────────────────── */
//
// Distancia ponderada entre dos colores en HSL.
// El tono importa más cuando ambos colores son saturados.
// La saturación y luminosidad tienen mayor peso que el tono puro
// porque son los factores más perceptualmente discriminantes
// al comparar colores de sportswear.
//

function hslDistance(
  [h1, s1, l1]: [number, number, number],
  [h2, s2, l2]: [number, number, number]
): number {
  // Distancia circular de tono (0-180)
  const hueDiff  = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180;
  // El tono solo importa si ambos colores son cromáticos
  const satWeight = (s1 + s2) / 2;

  const hueScore = hueDiff * satWeight;       // 0-1 (pesado por saturación)
  const satScore = Math.abs(s1 - s2);         // 0-1
  const lightScore = Math.abs(l1 - l2);       // 0-1

  // Pesos calibrados para distinción premium de sportswear
  return Math.sqrt(
    hueScore   ** 2 * 2.0 +   // tono: peso 2
    satScore   ** 2 * 2.5 +   // saturación: peso 2.5 (distingue neon de pastel)
    lightScore ** 2 * 2.0     // luminosidad: peso 2 (distingue white_ice de otros)
  );
}

/* ─── Función principal ──────────────────────────────────────────── */

/**
 * Analiza la imagen en `imagePath` y devuelve el RunningColor más cercano
 * de la paleta premium de BENOT.
 *
 * Para productos conocidos (BNTRN001-008) el override en metadata.json
 * tiene prioridad y esta función nunca se llama para ellos.
 * Se usa para auto-detectar colores de productos nuevos.
 */
export async function analyzeRunningColor(imagePath: string): Promise<RunningColor> {
  const sharp = (await import("sharp")).default;

  const { data, info } = await sharp(imagePath)
    .resize(48, 48, { fit: "fill" })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels; // 3 tras flatten

  // Acumuladores para calcular HSL dominante
  let sumH_sin = 0, sumH_cos = 0; // media circular de tono
  let sumS = 0, sumL = 0;
  let darkCount = 0, lightCount = 0;
  let chromatic = 0;
  let sampled = 0;

  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Descartar fondo blanco
    if (r > 228 && g > 228 && b > 228) continue;

    const [h, s, l] = rgbToHsl(r, g, b);
    sampled++;

    if (l < 0.18) { darkCount++;  continue; }
    if (l > 0.80 && s < 0.15) { lightCount++; continue; }
    if (s < 0.10) {
      // Gris neutro — cuenta hacia oscuro/claro según luminosidad
      l < 0.50 ? darkCount++ : lightCount++;
      continue;
    }

    // Píxel cromático: acumular
    const hRad = (h * Math.PI) / 180;
    sumH_sin += Math.sin(hRad);
    sumH_cos += Math.cos(hRad);
    sumS     += s;
    sumL     += l;
    chromatic++;
  }

  if (sampled === 0) return "white_ice";

  // Camiseta principalmente acromática (dominancia de blanco o negro)
  if (chromatic < sampled * 0.20) {
    return darkCount >= lightCount ? "wine_red" : "white_ice";
    // wine_red es el color oscuro de la colección (dark shirt = closest to black profile)
  }

  // Color dominante promedio
  const dominantHSL: [number, number, number] = [
    ((Math.atan2(sumH_sin, sumH_cos) * 180) / Math.PI + 360) % 360,
    sumS / chromatic,
    sumL / chromatic,
  ];

  // Nearest-neighbor contra los perfiles RunningColor
  let bestColor: RunningColor = "electric_blue";
  let bestDist  = Infinity;

  for (const profile of RUNNING_COLOR_PROFILES) {
    const profileHSL: [number, number, number] = [
      profile.hsl.h,
      profile.hsl.s,
      profile.hsl.l,
    ];
    const dist = hslDistance(dominantHSL, profileHSL);
    if (dist < bestDist) {
      bestDist  = dist;
      bestColor = profile.id;
    }
  }

  return bestColor;
}
