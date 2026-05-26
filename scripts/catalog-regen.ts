/**
 * BENOT — Regenerador de metadatos del catálogo Running.
 *
 * USO:
 *   npm run catalog:regen
 *
 * QUÉ HACE:
 *   1. Lee todas las imágenes de assets/Running/
 *   2. Analiza el color dominante de cada imagen con sharp
 *   3. Actualiza assets/Running/metadata.json con los RunningColors auto-detectados
 *      (respeta los campos que ya existen en metadata.json, solo añade/actualiza color)
 *
 * CUÁNDO USARLO:
 *   • Después de subir nuevas imágenes si quieres pre-calcular los colores
 *   • Si los colores auto-detectados no son correctos (revisa y corrige en metadata.json)
 *
 * NOTA: El sistema funciona SIN ejecutar este script. Lo detecta automáticamente en runtime.
 * Este script es un shortcut para pre-calentar los colores o corregirlos manualmente.
 */

import fs   from "fs";
import path from "path";
import { analyzeRunningColor } from "../lib/catalog/colorAnalyzer";
import type { RunningMetadata } from "../lib/catalog/types";

const ASSETS_DIR    = path.join(process.cwd(), "assets", "Running");
const META_FILE     = path.join(ASSETS_DIR, "metadata.json");
const IMAGE_PATTERN = /\.(png|jpg|jpeg|webp|avif)$/i;

async function main() {
  console.log("🎽  BENOT catalog regenerator\n");

  // 1. Leer imágenes
  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => IMAGE_PATTERN.test(f) && !f.startsWith("."))
    .sort();

  console.log(`   Encontradas ${files.length} imágenes en assets/Running/\n`);

  // 2. Leer metadata existente
  let meta: RunningMetadata = {};
  try {
    const raw = fs.readFileSync(META_FILE, "utf-8");
    meta = JSON.parse(raw) as RunningMetadata;
    // Eliminar entradas de schema/comentarios
    delete (meta as Record<string, unknown>)["_comment"];
    delete (meta as Record<string, unknown>)["_schema"];
  } catch {
    console.log("   metadata.json no encontrado — creando desde cero\n");
  }

  // 3. Analizar cada imagen
  for (const filename of files) {
    const id        = path.parse(filename).name;
    const imagePath = path.join(ASSETS_DIR, filename);

    process.stdout.write(`   ${id}: analizando... `);

    try {
      const runningColor = await analyzeRunningColor(imagePath);

      // Si el producto ya tiene override de runningColor en metadata.json, respetarlo
      const existing = meta[id];
      const hasOverride = existing?.runningColor;

      if (hasOverride) {
        console.log(`→ ${runningColor} (ignorado — override en metadata.json: ${hasOverride})`);
      } else {
        meta[id] = {
          ...(meta[id] ?? {}),
          runningColor,
        };
        console.log(`→ ${runningColor} ✓`);
      }
    } catch (err) {
      console.log(`→ ERROR: ${err}`);
    }
  }

  // 4. Escribir metadata.json actualizado
  const output = {
    _comment: "Overrides de producto. Cualquier campo puede omitirse — el sistema auto-detecta lo que falte con sharp.",
    _schema: {
      runningColor: "Color premium: white_ice | electric_purple | cyan | broken_orange | emerald | electric_blue | wine_red | fuchsia",
      name:         "Nombre corto mostrado en tarjetas de recomendación",
      slogan:       "Frase motivacional / texto impreso",
      featured:     "true → aparece primero en el catálogo",
      isNew:        "true → badge NUEVO",
    },
    ...meta,
  };

  fs.writeFileSync(META_FILE, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n✅  metadata.json actualizado: ${META_FILE}`);
}

main().catch((err) => {
  console.error("\n❌  Error:", err);
  process.exit(1);
});
