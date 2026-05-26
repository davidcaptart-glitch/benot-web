/**
 * BENOT — Regenerador de metadatos del catálogo Running.
 *
 * USO:
 *   npm run catalog:regen
 *
 * QUÉ HACE:
 *   1. Lee todas las imágenes de assets/Running/
 *   2. Analiza el color dominante de cada imagen con sharp
 *   3. Actualiza assets/Running/metadata.json con los colores auto-detectados
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
import { analyzeImageColor } from "../lib/catalog/colorAnalyzer";
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
    // Filtrar comentarios internos del schema al parsear
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
      const { colorCategory, colorGroup } = await analyzeImageColor(imagePath);

      // Si el producto ya tiene override de color en metadata.json, respetarlo
      const existing = meta[id];
      const hasOverride = existing?.colorCategory || existing?.colorGroup;

      if (hasOverride) {
        console.log(`→ ${colorCategory}/${colorGroup} (ignorado — override en metadata.json)`);
      } else {
        meta[id] = {
          ...(meta[id] ?? {}),
          colorCategory,
          colorGroup,
        };
        console.log(`→ ${colorCategory} / ${colorGroup} ✓`);
      }
    } catch (err) {
      console.log(`→ ERROR: ${err}`);
    }
  }

  // 4. Escribir metadata.json actualizado (conserva orden original + añade nuevos al final)
  const output = {
    _comment: "Overrides opcionales por producto. Cualquier campo puede omitirse — el sistema auto-detecta lo que falte.",
    _schema: {
      name:          "Nombre corto del producto",
      slogan:        "Frase impresa / eslogan motivacional",
      colorCategory: "Categoría semántica: white|black|red|orange|yellow|green|cyan|blue|purple|gray",
      colorGroup:    "Bucket de filtro UI: negro|blanco|rojo|azul",
      featured:      "true → aparece primero en el catálogo",
      isNew:         "true → muestra badge NUEVO",
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
