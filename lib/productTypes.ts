/**
 * Product type utilities:
 * – CartItem → ProductType mapping
 * – Asset path resolution (for email attachments)
 * – CartItem → OrderItem conversion
 */
import path from "path";
import fs   from "fs";

import type { CartItem, ProductType, OrderItem, SizeMap } from "./types";
import { PRODUCT_TYPE_NAMES } from "./types";
import { providersRepo } from "./db";
import { randomUUID } from "crypto";

/* ── Prices (cents) ──────────────────────────────────────────────── */
export const PRICES: Record<string, number> = {
  personalizada: Number(process.env.PRICE_PERSONALIZADA ?? 4290),
  running:       Number(process.env.PRICE_RUNNING       ?? 3790),
  yoteempujo:    Number(process.env.PRICE_YOTEEMPUJO    ?? 2790),
};

/* ── CartItem tipo → ProductType ─────────────────────────────────── */
export function cartTipoToProductType(tipo: string): ProductType {
  if (tipo === "personalizada") return "premium_custom";
  if (tipo === "running")       return "running_fullprint";
  if (tipo === "yoteempujo")    return "solidary_standard";
  return "premium_custom";
}

/* ── Assets base path (filesystem) ──────────────────────────────── */
// In Docker: /app/public/assets  (volume mount ./assets:/app/public/assets:ro)
// In dev:    <project_root>/public/assets  (Windows junction or symlink)
const ASSETS_BASE =
  process.env.ASSETS_PATH ??
  path.join(process.cwd(), "public", "assets");

function assetPath(...parts: string[]): string {
  return path.join(ASSETS_BASE, ...parts);
}

function existsOrNull(p: string): string | null {
  return fs.existsSync(p) ? p : null;
}

/* ── Resolved asset ──────────────────────────────────────────────── */
// A single design file with metadata for email rendering.
export interface ResolvedAsset {
  /** Absolute filesystem path to the image file */
  path: string;
  /** Human-readable label shown in the provider email (Spanish) */
  label: string;
  /** Suggested filename for the email attachment */
  filename: string;
}

/* ── Resolve filesystem paths for the design assets ──────────────── */
//
// Returns a structured list of assets (image path + label + filename)
// ready to be used as Nodemailer attachments with contextual labels.
//
// Running fullprint path convention:
//   <ASSETS_BASE>/Configurador/Running/<zoneId>/<code>.png
//   <ASSETS_BASE>/Configurador/Running/preview/<code>.png
//
// The caller must check `path` exists before attaching (already done here).
//
export function resolveAssetPaths(item: CartItem): ResolvedAsset[] {
  const assets: ResolvedAsset[] = [];

  /* ── personalizada ───────────────────────────────────────────── */
  if (item.tipo === "personalizada") {
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const phrasePath = existsOrNull(
      assetPath(
        "Configurador", "Camiseta personalizada", "01 - Frases",
        item.color, `${item.fraseCode}.png`
      )
    );
    if (phrasePath) {
      assets.push({
        path:     phrasePath,
        label:    "Frase (delante)",
        filename: `frase_${item.fraseCode}.png`,
      });
    }

    const designPath = existsOrNull(
      assetPath(
        "Configurador", "Camiseta personalizada", "02 - Diseños",
        cap(item.disenoCategoria), item.color, `${item.disenoCode}.png`
      )
    );
    if (designPath) {
      assets.push({
        path:     designPath,
        label:    "Diseño (detrás)",
        filename: `diseno_${item.disenoCode}.png`,
      });
    }

    const resultBase  = assetPath("Configurador", "Camiseta personalizada", "03 - Resultado");
    const frontResult = existsOrNull(path.join(resultBase, `${item.fraseCode}R.png`));
    const backResult  = existsOrNull(path.join(resultBase, `${item.disenoCode}R.png`));
    if (frontResult) {
      assets.push({
        path:     frontResult,
        label:    "Preview delante",
        filename: `preview_front_${item.fraseCode}.png`,
      });
    }
    if (backResult) {
      assets.push({
        path:     backResult,
        label:    "Preview detrás",
        filename: `preview_back_${item.disenoCode}.png`,
      });
    }
  }

  /* ── running fullprint (multi-zone) ─────────────────────────── */
  if (item.tipo === "running") {
    // Each print zone is stored in its own subfolder: Running/<zoneId>/<code>.png
    for (const zone of item.zones) {
      const p = existsOrNull(
        assetPath("Configurador", "Running", zone.zoneId, `${zone.code}.png`)
      );
      if (p) {
        assets.push({
          path:     p,
          label:    zone.label,
          filename: `${zone.zoneId}_${zone.code}.png`,
        });
      }
    }

    // Composite mockup / final render
    if (item.finalPreview) {
      const p = existsOrNull(
        assetPath("Configurador", "Running", "preview", `${item.finalPreview}.png`)
      );
      if (p) {
        assets.push({
          path:     p,
          label:    "Preview final",
          filename: `preview_${item.finalPreview}.png`,
        });
      }
    }
  }

  /* ── yoteempujo ──────────────────────────────────────────────── */
  if (item.tipo === "yoteempujo") {
    const p = existsOrNull(
      assetPath("Configurador", "yoteempujo", `${item.code}.png`)
    );
    if (p) {
      assets.push({
        path:     p,
        label:    "Diseño",
        filename: `yoteempujo_${item.code}.png`,
      });
    }
  }

  return assets;
}

/* ── CartItem → OrderItem ────────────────────────────────────────── */
export function cartItemToOrderItem(item: CartItem): OrderItem {
  const productType = cartTipoToProductType(item.tipo);
  const provider    = providersRepo.findByProductType(productType);
  const sizes       = (item.sizes ?? {}) as SizeMap;
  const quantity    = Math.max(
    1,
    Object.values(sizes).reduce((a, b) => a + b, 0)
  );
  const unitPrice   = PRICES[item.tipo] ?? 2990;

  const base: Omit<
    OrderItem,
    "phraseCode" | "designCode" | "designCategory" | "color" |
    "printZones" | "finalPreview" | "itemCode"
  > = {
    id:          randomUUID(),
    productType,
    productName: PRODUCT_TYPE_NAMES[productType],
    providerId:  provider?.id ?? null,
    sizes,
    quantity,
    unitPrice,
    subtotal:    unitPrice * quantity,
  };

  if (item.tipo === "personalizada") {
    return {
      ...base,
      color:          item.color,
      phraseCode:     item.fraseCode,
      designCode:     item.disenoCode,
      designCategory: item.disenoCategoria,
    };
  }

  if (item.tipo === "running") {
    return {
      ...base,
      printZones:   item.zones,
      finalPreview: item.finalPreview,
    };
  }

  // yoteempujo
  return {
    ...base,
    itemCode: item.code,
  };
}

/* ── Human-readable size list ────────────────────────────────────── */
export function sizesLabel(sizes: SizeMap): string {
  return Object.entries(sizes)
    .filter(([, q]) => q > 0)
    .map(([s, q]) => `${s}×${q}`)
    .join(", ") || "—";
}
