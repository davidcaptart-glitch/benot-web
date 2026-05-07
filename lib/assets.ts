import fs from "fs";
import path from "path";

const IMAGE_EXT = /\.(png|jpg|jpeg|webp|gif|avif)$/i;

export interface AssetItem {
  code: string;    // filename without extension, e.g. "BNTFR001"
  filename: string; // e.g. "BNTFR001.png"
  src: string;     // URL for <img src>, e.g. "/assets/Frases/BNTFR001.png"
}

/**
 * Reads all image files from assets/<folder> at request time.
 * Adding a file to the folder + refreshing is enough to see it on the web.
 */
export function getAssetFiles(folder: string): AssetItem[] {
  const dir = path.join(process.cwd(), "assets", folder);
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => IMAGE_EXT.test(f))
      .sort()
      .map((filename) => ({
        code: path.parse(filename).name,
        filename,
        src: `/assets/${folder}/${encodeURIComponent(filename)}`,
      }));
  } catch {
    return [];
  }
}
