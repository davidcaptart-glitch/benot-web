/**
 * Product type utilities:
 * – CartItem → ProductType mapping
 * – Asset path resolution (for email attachments + snapshots)
 * – CartItem → OrderItem conversion
 */
import path from "path";
import fs   from "fs";

import type { CartItem, ProductType, OrderItem, SizeMap } from "./types";
import { PRODUCT_TYPE_NAMES } from "./types";
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
// A single design file with metadata for email rendering and snapshots.
export interface ResolvedAsset {
  /** Absolute filesystem path to the source image file */
  path:      string;
  /** Human-readable zone label (Spanish), used in emails and PDFs */
  label:     string;
  /** Filename for the order snapshot folder and email attachments */
  filename:  string;
  /** Zone identifier — set for running zones, preview, etc. */
  zoneId?:   string;
}

/* ── Resolve filesystem paths for the design assets ──────────────── */
//
// Returns a structured list of assets for each cart item.
// Each entry includes the source path, a label, a suggested filename,
// and an optional zoneId (for running fullprint zone matching).
//
// Running fullprint path convention:
//   <ASSETS_BASE>/Configurador/Running/<zoneId>/<code>.png
//   <ASSETS_BASE>/Configurador/Running/preview/<code>.png
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
        zoneId:   "front",
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
        zoneId:   "back",
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
        zoneId:   "preview_front",
      });
    }
    if (backResult) {
      assets.push({
        path:     backResult,
        label:    "Preview detrás",
        filename: `preview_back_${item.disenoCode}.png`,
        zoneId:   "preview_back",
      });
    }
  }

  /* ── running fullprint (multi-zone) ─────────────────────────── */
  if (item.tipo === "running") {
    // Each print zone lives in its own subfolder: Running/<zoneId>/<code>.png
    for (const zone of item.zones) {
      const p = existsOrNull(
        assetPath("Configurador", "Running", zone.zoneId, `${zone.code}.png`)
      );
      if (p) {
        assets.push({
          path:     p,
          label:    zone.label,
          filename: `${zone.zoneId}_${zone.code}.png`,
          zoneId:   zone.zoneId,
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
          zoneId:   "preview",
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
        zoneId:   "front",
      });
    }
  }

  return assets;
}

/* ── CartItem → OrderItem ────────────────────────────────────────── */
// Provider assignment is done asynchronously in the webhook after all items
// are built — pass providerIdMap if known, otherwise providerId is null.
export function cartItemToOrderItem(
  item: CartItem,
  providerIdMap?: Map<ProductType, string | null>
): OrderItem {
  const productType = cartTipoToProductType(item.tipo);
  const sizes       = (item.sizes ?? {}) as SizeMap;
  const quantity    = Math.max(
    1,
    Object.values(sizes).reduce((a, b) => a + b, 0)
  );
  const unitPrice  = PRICES[item.tipo] ?? 2990;
  const providerId = providerIdMap?.get(productType) ?? null;

  const base: Omit<
    OrderItem,
    "phraseCode" | "designCode" | "designCategory" | "color" |
    "printZones" | "finalPreview" | "itemCode"
  > = {
    id:               randomUUID(),
    productType,
    productName:      PRODUCT_TYPE_NAMES[productType],
    providerId,
    productionStatus: "pending",
    sizes,
    quantity,
    unitPrice,
    subtotal:         unitPrice * quantity,
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
