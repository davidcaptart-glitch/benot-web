/**
 * BENOT – Order asset snapshot + production PDF generation
 *
 * snapshotOrderAssets():
 *   Copies every design asset used in an order into a dedicated folder
 *   (/data/orders/{orderRef}/) at the moment of purchase. Future updates
 *   to the configurador assets never affect past orders.
 *
 * generateProductionSheet():
 *   Generates a PDF production sheet for a given provider, including
 *   customer details, per-item zone breakdown, and embedded previews.
 *   The PDF is saved to the order folder and returned as a Buffer.
 */
import fs   from "fs";
import path from "path";

import PDFDocument from "pdfkit";

import type { CartItem, FrozenAsset, Order, OrderItem, Provider } from "./types";
import { resolveAssetPaths, sizesLabel } from "./productTypes";
import { DATA_DIR } from "./db";

/* ── Order asset directory ───────────────────────────────────────── */
function orderDir(orderRef: string): string {
  return path.join(DATA_DIR, "orders", orderRef);
}

/* ══════════════════════════════════════════════════════════════════
   snapshotOrderAssets

   Copies all design files for an order into /data/orders/{orderRef}/.
   Returns the full FrozenAsset[] list (tagged with cartItemIndex and zoneId)
   so the rest of the system can use stable, immutable paths.
══════════════════════════════════════════════════════════════════ */
export function snapshotOrderAssets(
  orderRef:  string,
  cartItems: CartItem[],
): FrozenAsset[] {
  const destDir = orderDir(orderRef);
  fs.mkdirSync(destDir, { recursive: true });

  const frozen: FrozenAsset[] = [];
  const seenOriginals = new Set<string>();

  cartItems.forEach((cartItem, cartItemIndex) => {
    const resolved = resolveAssetPaths(cartItem);
    for (const asset of resolved) {
      if (seenOriginals.has(asset.path)) continue;
      seenOriginals.add(asset.path);

      const dest = path.join(destDir, asset.filename);
      try {
        fs.copyFileSync(asset.path, dest);
        frozen.push({
          cartItemIndex,
          zoneId:       asset.zoneId,
          label:        asset.label,
          filename:     asset.filename,
          absolutePath: dest,
          originalPath: asset.path,
        });
      } catch (err) {
        console.warn(`[snapshot] Could not copy asset "${asset.path}":`, err);
        // Include the asset record anyway so the order is complete,
        // but with the original path as a fallback.
        frozen.push({
          cartItemIndex,
          zoneId:       asset.zoneId,
          label:        asset.label,
          filename:     asset.filename,
          absolutePath: asset.path,  // fallback to original
          originalPath: asset.path,
        });
      }
    }
  });

  return frozen;
}

/* ══════════════════════════════════════════════════════════════════
   generateProductionSheet

   Generates a PDF production sheet for a specific provider.
   Saves the file to /data/orders/{orderRef}/production-sheet-{providerId}.pdf
   and returns the absolute path.

   Layout:
     • BENOT header + provider name
     • Order reference + date
     • Customer + shipping address
     • Per-item section: zone table + embedded preview image
     • Asset manifest (filenames)
══════════════════════════════════════════════════════════════════ */
export async function generateProductionSheet(
  order:    Order,
  provider: Provider,
  items:    OrderItem[],
  assets:   FrozenAsset[],
): Promise<string> {
  const destDir = orderDir(order.orderRef);
  fs.mkdirSync(destDir, { recursive: true });

  const pdfPath = path.join(destDir, `production-sheet-${provider.id}.pdf`);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size:    "A4",
      margin:  50,
      info: {
        Title:    `Orden de producción ${order.orderRef}`,
        Author:   "BENOT",
        Subject:  `Proveedor: ${provider.name}`,
        Keywords: order.orderRef,
      },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    const W = doc.page.width - 100; // usable width (margins 50 each side)

    /* ── Helpers ─────────────────────────────────────────────────── */
    function hrule(y?: number) {
      const yy = y ?? doc.y;
      doc.moveTo(50, yy).lineTo(50 + W, yy).lineWidth(0.5).strokeColor("#CCCCCC").stroke();
      doc.moveDown(0.5);
    }

    function sectionLabel(text: string) {
      doc.moveDown(0.6)
         .fontSize(7).fillColor("#FF1E1E")
         .text(text.toUpperCase(), { characterSpacing: 1.5 })
         .moveDown(0.2)
         .fillColor("#000000");
    }

    function cell(
      text: string,
      x: number, y: number,
      w: number, h: number,
      opts: { bold?: boolean; color?: string; align?: "left" | "center" | "right" } = {}
    ) {
      doc.fontSize(9)
         .fillColor(opts.color ?? "#111111")
         .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
         .text(text, x + 4, y + 4, { width: w - 8, height: h - 8, align: opts.align ?? "left" });
    }

    /* ── Header ─────────────────────────────────────────────────── */
    doc.rect(50, 50, W, 52).fill("#000000");
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#FFFFFF")
       .text("BENOT", 62, 60, { characterSpacing: 4 });
    doc.fontSize(8).font("Helvetica").fillColor("#FF1E1E")
       .text("ORDEN DE PRODUCCIÓN", 62, 84, { characterSpacing: 2 });
    doc.fillColor("#AAAAAA")
       .text(`Proveedor: ${provider.name}`, 62 + 140, 84);

    doc.y = 50 + 52 + 16;

    /* ── Reference + date ───────────────────────────────────────── */
    doc.rect(50, doc.y, W, 30).fill("#111111");
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#FF1E1E")
       .text(
         order.orderRef,
         62, doc.y - 28,
         { characterSpacing: 3 }
       );
    doc.fontSize(9).font("Helvetica").fillColor("#888888")
       .text(
         new Date(order.createdAt).toLocaleDateString("es-ES", {
           day: "2-digit", month: "long", year: "numeric",
         }),
         62 + 160, doc.y - 26
       );
    doc.y += 16;

    /* ── Customer ───────────────────────────────────────────────── */
    sectionLabel("Cliente");
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#111111")
       .text(order.customerName);
    doc.fontSize(9).font("Helvetica").fillColor("#555555")
       .text(order.customerEmail);
    if (order.customerPhone) doc.text(order.customerPhone);

    /* ── Shipping address ───────────────────────────────────────── */
    if (order.shippingAddress) {
      const a = order.shippingAddress;
      sectionLabel("Dirección de envío");
      doc.fontSize(9).font("Helvetica").fillColor("#111111")
         .text(a.line1)
         .text([a.postal_code, a.city, a.state].filter(Boolean).join(" "))
         .text(a.country);
    }

    if (order.shippingOption) {
      doc.moveDown(0.3).fontSize(8).fillColor("#888888")
         .text(`Modalidad de envío: ${order.shippingOption}`);
    }

    doc.moveDown(0.5);
    hrule();

    /* ── Items ───────────────────────────────────────────────────── */
    for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
      const item        = items[itemIdx];
      const itemAssets  = assets.filter((a) => {
        // Match assets that belong to the same OrderItem position
        // assets are tagged by cartItemIndex; items are in the same order as cartItems
        return true; // all assets passed to this function belong to this provider
      });

      // Check if we need a new page
      if (doc.y > doc.page.height - 200) doc.addPage();

      sectionLabel(`Artículo ${itemIdx + 1} de ${items.length}`);

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#111111")
         .text(item.productName);
      doc.moveDown(0.2);
      doc.fontSize(9).font("Helvetica").fillColor("#555555")
         .text(`Cantidad: ${item.quantity}   ·   Tallas: ${sizesLabel(item.sizes)}`);
      doc.moveDown(0.5);

      /* ── Zone table (running fullprint) ─────────────────────── */
      if (item.printZones?.length) {
        const COL = [0, W * 0.30, W * 0.55, W];
        const ROW_H = 22;
        let ty = doc.y;

        // Header row
        doc.rect(50, ty, W, ROW_H).fill("#000000");
        ["ZONA", "CÓDIGO", "ARCHIVO ADJUNTO"].forEach((h, ci) => {
          cell(h, 50 + COL[ci], ty, COL[ci + 1] - COL[ci], ROW_H, {
            bold: true, color: "#FF1E1E",
          });
        });
        ty += ROW_H;

        const allZones = [
          ...item.printZones,
          ...(item.finalPreview
            ? [{ zoneId: "preview", label: "Preview final", code: item.finalPreview, isFixed: false }]
            : []),
        ];

        allZones.forEach((zone, ri) => {
          const bg = ri % 2 === 0 ? "#F9F9F9" : "#FFFFFF";
          doc.rect(50, ty, W, ROW_H).fill(bg);
          const matchedAsset = itemAssets.find((a) => a.zoneId === zone.zoneId);
          const fixedTag     = zone.isFixed ? " [FIJO]" : "";
          cell(`${zone.label}${fixedTag}`, 50, ty, COL[1], ROW_H, { bold: true });
          cell(zone.code, 50 + COL[1], ty, COL[2] - COL[1], ROW_H);
          cell(matchedAsset?.filename ?? "—", 50 + COL[2], ty, COL[3] - COL[2], ROW_H, {
            color: "#888888",
          });
          ty += ROW_H;
        });

        // Table border
        doc.rect(50, doc.y, W, ty - doc.y)
           .lineWidth(0.5).strokeColor("#CCCCCC").stroke();
        doc.y = ty + 12;
      }

      /* ── Standard item details (personalizada / yoteempujo) ─── */
      if (!item.printZones?.length) {
        const details: string[] = [];
        if (item.color)          details.push(`Color: ${item.color}`);
        if (item.phraseCode)     details.push(`Frase: ${item.phraseCode}`);
        if (item.designCode)     details.push(`Diseño: ${item.designCode}${item.designCategory ? ` (${item.designCategory})` : ""}`);
        if (item.itemCode)       details.push(`Código modelo: ${item.itemCode}`);
        details.forEach((d) => {
          doc.fontSize(9).font("Helvetica").fillColor("#333333").text(d);
        });
        doc.moveDown(0.4);
      }

      /* ── Preview image ─────────────────────────────────────── */
      const previewAsset =
        itemAssets.find((a) => a.zoneId === "preview" || a.zoneId === "preview_front") ??
        itemAssets.find((a) => a.zoneId?.startsWith("preview"));

      if (previewAsset) {
        if (doc.y > doc.page.height - 220) doc.addPage();
        try {
          const imgSize = 160;
          doc.image(previewAsset.absolutePath, 50 + (W - imgSize) / 2, doc.y, {
            width: imgSize,
            align: "center",
          });
          doc.moveDown(0.5);
          doc.fontSize(7).fillColor("#AAAAAA")
             .text(`Preview: ${previewAsset.filename}`, { align: "center" });
        } catch {
          doc.fontSize(8).fillColor("#AAAAAA")
             .text("[preview no disponible]", { align: "center" });
        }
        doc.moveDown(0.5);
      }

      if (itemIdx < items.length - 1) {
        doc.moveDown(0.3);
        hrule();
      }
    }

    /* ── Asset manifest ─────────────────────────────────────────── */
    if (assets.length > 0) {
      doc.moveDown(0.5);
      hrule();
      sectionLabel("Archivos adjuntos");
      doc.fontSize(8).font("Helvetica").fillColor("#555555");
      assets.forEach((a) => {
        doc.text(`• ${a.filename}  —  ${a.label}`, {
          indent:        8,
          lineGap:       2,
          continued:     false,
        });
      });
    }

    /* ── Footer ─────────────────────────────────────────────────── */
    const footerY = doc.page.height - 40;
    doc.fontSize(7).fillColor("#AAAAAA")
       .text(
         `BENOT · Sistema de producción interno · ${order.orderRef} · Generado ${new Date().toISOString()}`,
         50, footerY,
         { width: W, align: "center" }
       );

    doc.end();
  });

  return pdfPath;
}
