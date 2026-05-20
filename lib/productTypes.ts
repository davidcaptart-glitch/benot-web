/**
 * Product type utilities:
 * – CartItem → ProductType mapping
 * – Asset path resolution (for email attachments)
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

/* ── Resolve filesystem paths for the design assets ──────────────── */
export function resolveAssetPaths(item: CartItem): string[] {
  const paths: string[] = [];

  if (item.tipo === "personalizada") {
    const cap = (s: string) =>
      s.charAt(0).toUpperCase() + s.slice(1);

    // Phrase image (front)
    const phrasePath = existsOrNull(
      assetPath(
        "Configurador",
        "Camiseta personalizada",
        "01 - Frases",
        item.color,
        `${item.fraseCode}.png`
      )
    );
    if (phrasePath) paths.push(phrasePath);

    // Design image (back)
    const designPath = existsOrNull(
      assetPath(
        "Configurador",
        "Camiseta personalizada",
        "02 - Diseños",
        cap(item.disenoCategoria),
        item.color,
        `${item.disenoCode}.png`
      )
    );
    if (designPath) paths.push(designPath);

    // Result composite (front + back previews)
    const resultBase = assetPath(
      "Configurador",
      "Camiseta personalizada",
      "03 - Resultado"
    );
    const frontResult = existsOrNull(path.join(resultBase, `${item.fraseCode}R.png`));
    const backResult  = existsOrNull(path.join(resultBase, `${item.disenoCode}R.png`));
    if (frontResult) paths.push(frontResult);
    if (backResult)  paths.push(backResult);
  }

  if (item.tipo === "running") {
    const p = existsOrNull(
      assetPath("Configurador", "Running", `${item.code}.png`)
    );
    if (p) paths.push(p);
  }

  if (item.tipo === "yoteempujo") {
    const p = existsOrNull(
      assetPath("Configurador", "yoteempujo", `${item.code}.png`)
    );
    if (p) paths.push(p);
  }

  return paths;
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

  const base: Omit<OrderItem, "phraseCode" | "designCode" | "designCategory" | "color" | "itemCode"> = {
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
      color:           item.color,
      phraseCode:      item.fraseCode,
      designCode:      item.disenoCode,
      designCategory:  item.disenoCategoria,
    };
  }

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
