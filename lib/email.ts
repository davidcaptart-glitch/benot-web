/**
 * BENOT – Transactional email
 *
 * Two email flows:
 *  1. Customer confirmation  — sent right after payment is verified
 *  2. Provider production    — sent to each provider with their items + design attachments
 *
 * Depends on: nodemailer  (npm i nodemailer @types/nodemailer)
 */
import nodemailer from "nodemailer";
import type Mail  from "nodemailer/lib/mailer";

import type { FrozenAsset, Order, OrderItem, Provider } from "./types";
import { sizesLabel } from "./productTypes";

/* ── Transporter ─────────────────────────────────────────────────── */
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.EMAIL_FROM ?? "BENOT <benotstore@gmail.com>";

/* ── Shared CSS / design tokens ──────────────────────────────────── */
const CSS = `
  body { margin:0; padding:0; background:#f5f5f3; font-family: Arial, Helvetica, sans-serif; }
  .wrap { max-width:600px; margin:0 auto; background:#ffffff; }
  .header { background:#000000; padding:32px 40px; }
  .header-title { color:#ffffff; font-size:28px; font-weight:900; letter-spacing:0.18em; margin:0; }
  .header-sub { color:#FF1E1E; font-size:11px; letter-spacing:0.22em; margin:6px 0 0; }
  .body { padding:40px; }
  .section-label { color:#FF1E1E; font-size:10px; font-weight:700; letter-spacing:0.3em; margin:0 0 6px; text-transform:uppercase; }
  .section-title { color:#111; font-size:22px; font-weight:900; letter-spacing:0.08em; margin:0 0 24px; text-transform:uppercase; }
  .ref-box { background:#111; color:#FF1E1E; font-size:20px; font-weight:900; letter-spacing:0.25em; text-align:center; padding:18px 24px; margin-bottom:32px; }
  .items-table { width:100%; border-collapse:collapse; margin-bottom:32px; }
  .items-table th { background:#f5f5f3; color:#555; font-size:10px; letter-spacing:0.18em; font-weight:700; padding:10px 12px; text-align:left; border-bottom:2px solid #e5e5e5; }
  .items-table td { padding:14px 12px; border-bottom:1px solid #f0f0f0; color:#111; font-size:13px; vertical-align:top; }
  .item-name { font-weight:700; font-size:14px; margin-bottom:4px; }
  .item-detail { color:#666; font-size:11px; margin-top:3px; }
  .totals { border-top:2px solid #111; padding-top:16px; }
  .totals-row { display:flex; justify-content:space-between; color:#555; font-size:13px; margin-bottom:8px; }
  .totals-row.total { color:#111; font-weight:900; font-size:16px; margin-top:8px; border-top:1px solid #e5e5e5; padding-top:12px; }
  .address-box { background:#f5f5f3; padding:20px 24px; margin-bottom:32px; font-size:13px; color:#333; line-height:1.7; }
  .footer { background:#111; padding:24px 40px; text-align:center; color:#555; font-size:10px; letter-spacing:0.15em; }
  .divider { border:none; border-top:1px solid #e5e5e5; margin:24px 0; }
  .zone-table { width:100%; border-collapse:collapse; margin:12px 0 20px; }
  .zone-table th { background:#000; color:#FF1E1E; font-size:10px; letter-spacing:0.18em; font-weight:700; padding:8px 12px; text-align:left; }
  .zone-table td { padding:10px 12px; border-bottom:1px solid #f0f0f0; color:#111; font-size:13px; vertical-align:middle; }
  .zone-fixed { color:#888; font-size:10px; letter-spacing:0.1em; }
  .badge-fixed { display:inline-block; background:#f5f5f3; color:#888; font-size:9px; letter-spacing:0.12em; padding:2px 6px; border:1px solid #e5e5e5; margin-left:6px; vertical-align:middle; }
`;

/* ── Formatters ──────────────────────────────────────────────────── */
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style:    "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function itemDetailLines(item: OrderItem): string[] {
  const lines: string[] = [];
  if (item.color)          lines.push(`Color: ${item.color}`);
  if (item.phraseCode)     lines.push(`Frase: ${item.phraseCode}`);
  if (item.designCode)     lines.push(`Diseño: ${item.designCode}${item.designCategory ? ` (${item.designCategory})` : ""}`);
  if (item.itemCode)       lines.push(`Código: ${item.itemCode}`);
  if (item.printZones?.length) {
    item.printZones.forEach((z) => lines.push(`${z.label}: ${z.code}${z.isFixed ? " (fijo)" : ""}`));
  }
  lines.push(`Tallas: ${sizesLabel(item.sizes)}`);
  return lines;
}

/* ── Build items table rows (customer email) ─────────────────────── */
function buildItemRows(items: OrderItem[]): string {
  return items.map(item => `
    <tr>
      <td>
        <div class="item-name">${item.productName}</div>
        ${itemDetailLines(item).map(l => `<div class="item-detail">${l}</div>`).join("")}
      </td>
      <td style="white-space:nowrap;">${item.quantity}</td>
      <td style="white-space:nowrap;">${formatCents(item.unitPrice)}</td>
      <td style="white-space:nowrap; font-weight:700;">${formatCents(item.subtotal)}</td>
    </tr>
  `).join("");
}

/* ── Build per-item production block (provider email) ────────────── */
// For running_fullprint: renders a zone-by-zone breakdown table.
// For other types: renders a simple details list.
function buildProviderItemBlock(item: OrderItem): string {
  const header = `
    <div style="margin-bottom:28px; border:1px solid #e5e5e5; padding:20px;">
      <div class="item-name" style="font-size:15px; margin-bottom:12px;">${item.productName}</div>
      <div class="item-detail">Cantidad: <strong>${item.quantity}</strong></div>
      <div class="item-detail">Tallas: <strong>${sizesLabel(item.sizes)}</strong></div>
  `;

  if (item.printZones?.length) {
    // Running fullprint — zone breakdown
    const zoneRows = item.printZones.map(z => `
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; font-weight:700; font-size:12px; width:40%;">
          ${z.label}${z.isFixed ? `<span class="badge-fixed">FIJO</span>` : ""}
        </td>
        <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; font-size:12px; color:#555;">
          ${z.code}
        </td>
        <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; font-size:11px; color:#888;">
          ver adjunto: ${z.zoneId}_${z.code}.png
        </td>
      </tr>
    `).join("");

    const previewRow = item.finalPreview ? `
      <tr>
        <td style="padding:8px 12px; font-weight:700; font-size:12px; color:#FF1E1E;">Preview final</td>
        <td style="padding:8px 12px; font-size:12px; color:#555;">${item.finalPreview}</td>
        <td style="padding:8px 12px; font-size:11px; color:#888;">ver adjunto: preview_${item.finalPreview}.png</td>
      </tr>
    ` : "";

    return `
      ${header}
      <div style="margin-top:16px;">
        <div class="section-label" style="margin-bottom:8px;">Zonas de impresión</div>
        <table class="zone-table">
          <thead>
            <tr>
              <th>Zona</th>
              <th>Código</th>
              <th>Adjunto</th>
            </tr>
          </thead>
          <tbody>
            ${zoneRows}
            ${previewRow}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  // Standard item
  const extraLines = [
    item.color         ? `Color: <strong>${item.color}</strong>` : null,
    item.phraseCode    ? `Frase: <strong>${item.phraseCode}</strong>` : null,
    item.designCode    ? `Diseño: <strong>${item.designCode}</strong>${item.designCategory ? ` (${item.designCategory})` : ""}` : null,
    item.itemCode      ? `Código modelo: <strong>${item.itemCode}</strong>` : null,
  ].filter(Boolean);

  return `
    ${header}
    ${extraLines.map(l => `<div class="item-detail">${l}</div>`).join("")}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   1. CUSTOMER CONFIRMATION EMAIL
══════════════════════════════════════════════════════════════════ */
export async function sendCustomerConfirmationEmail(order: Order): Promise<void> {
  const addr = order.shippingAddress;
  const addressBlock = addr ? `
    <div class="address-box">
      <strong>${addr.name}</strong><br/>
      ${addr.line1}${addr.line2 ? `<br/>${addr.line2}` : ""}<br/>
      ${addr.postal_code} ${addr.city}${addr.state ? `, ${addr.state}` : ""}<br/>
      ${addr.country}
    </div>
  ` : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pedido ${order.orderRef}</title>
<style>${CSS}</style></head>
<body>
<div class="wrap">
  <div class="header">
    <p class="header-title">BENOT</p>
    <p class="header-sub">CONFIRMACIÓN DE PEDIDO</p>
  </div>
  <div class="body">
    <p class="section-label">Referencia</p>
    <div class="ref-box">${order.orderRef}</div>

    <p class="section-label">Hola, ${order.customerName.split(" ")[0]}</p>
    <p class="section-title">Tu pedido está confirmado.</p>
    <p style="color:#555; font-size:14px; margin-bottom:32px; line-height:1.6;">
      Hemos recibido tu pedido y ya está en camino a producción.
      Te avisaremos en cuanto esté listo para el envío.
    </p>

    <p class="section-label">Resumen del pedido</p>
    <table class="items-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Uds.</th>
          <th>P/u</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${buildItemRows(order.items)}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${formatCents(order.subtotalAmount)}</span>
      </div>
      <div class="totals-row">
        <span>Envío${order.shippingOption ? ` (${order.shippingOption})` : ""}</span>
        <span>${order.shippingAmount === 0 ? "GRATIS" : formatCents(order.shippingAmount)}</span>
      </div>
      <div class="totals-row total">
        <span>TOTAL</span>
        <span>${formatCents(order.totalAmount)}</span>
      </div>
    </div>

    ${addr ? `<hr class="divider"/><p class="section-label">Dirección de entrega</p>${addressBlock}` : ""}

    <hr class="divider"/>
    <p style="color:#888; font-size:12px; line-height:1.6;">
      ¿Tienes alguna pregunta sobre tu pedido? Contáctanos por Telegram en
      <a href="https://t.me/Benotpedidosbot" style="color:#FF1E1E;">@Benotpedidosbot</a>
      indicando tu referencia <strong>${order.orderRef}</strong>.
    </p>
  </div>
  <div class="footer">© 2026 BENOT · TODOS LOS DERECHOS RESERVADOS</div>
</div>
</body></html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from:    FROM,
    to:      order.customerEmail,
    subject: `Pedido confirmado ${order.orderRef} – BENOT`,
    html,
  });
}

/* ══════════════════════════════════════════════════════════════════
   2. PROVIDER PRODUCTION EMAIL  (with image attachments per zone)
══════════════════════════════════════════════════════════════════ */
export async function sendProviderProductionEmail(
  order:    Order,
  provider: Provider,
  items:    OrderItem[],
  assets:   FrozenAsset[],   // frozen snapshot paths for this provider's items
  pdfPath?: string,           // optional production-sheet PDF to attach
): Promise<void> {
  // Build attachments from the frozen (immutable) asset paths
  const attachments: Mail.Attachment[] = [];
  const seenPaths = new Set<string>();

  for (const asset of assets) {
    if (!seenPaths.has(asset.absolutePath)) {
      seenPaths.add(asset.absolutePath);
      attachments.push({
        filename: asset.filename,
        path:     asset.absolutePath,
      });
    }
  }

  // Attach the production PDF last
  if (pdfPath) {
    attachments.push({
      filename: `production-sheet-${order.orderRef}.pdf`,
      path:     pdfPath,
    });
  }

  const addr = order.shippingAddress;
  const addressBlock = addr ? `
    <div class="address-box">
      <strong>${addr.name}</strong><br/>
      ${addr.line1}${addr.line2 ? `<br/>${addr.line2}` : ""}<br/>
      ${addr.postal_code} ${addr.city}${addr.state ? `, ${addr.state}` : ""}<br/>
      ${addr.country}
    </div>
  ` : "<p style='color:#888;'>Sin dirección registrada.</p>";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Producción ${order.orderRef}</title>
<style>${CSS}</style></head>
<body>
<div class="wrap">
  <div class="header">
    <p class="header-title">BENOT</p>
    <p class="header-sub">ORDEN DE PRODUCCIÓN</p>
  </div>
  <div class="body">
    <p class="section-label">Referencia de pedido</p>
    <div class="ref-box">${order.orderRef}</div>

    <p class="section-label">Proveedor</p>
    <p class="section-title">${provider.name}</p>

    <p style="color:#555; font-size:14px; margin-bottom:32px; line-height:1.6;">
      Se adjuntan a este correo las imágenes de diseño necesarias para la producción.
      Por favor, confirma la recepción respondiendo a este mensaje.
    </p>

    <p class="section-label">Artículos a producir</p>
    ${items.map(buildProviderItemBlock).join("")}

    <hr class="divider"/>
    <p class="section-label">Datos del cliente</p>
    <div class="address-box">
      <strong>${order.customerName}</strong><br/>
      Email: <a href="mailto:${order.customerEmail}" style="color:#FF1E1E;">${order.customerEmail}</a><br/>
      ${order.customerPhone ? `Tel: ${order.customerPhone}<br/>` : ""}
    </div>

    <p class="section-label">Dirección de envío</p>
    ${addressBlock}

    ${order.shippingOption ? `
    <p class="section-label">Modalidad de envío</p>
    <div class="address-box">${order.shippingOption}</div>
    ` : ""}

    <hr class="divider"/>
    <p style="color:#888; font-size:12px; line-height:1.6;">
      Fecha de pedido: ${new Date(order.createdAt).toLocaleDateString("es-ES", { day:"numeric", month:"long", year:"numeric" })}<br/>
      Importe total del pedido: <strong>${formatCents(order.totalAmount)}</strong><br/>
      ${attachments.length > 0
        ? `Archivos adjuntos (${attachments.length}): ${attachments.map(a => String(a.filename)).join(", ")}`
        : "No se encontraron archivos de diseño en el servidor."}
    </p>
  </div>
  <div class="footer">© 2026 BENOT · SISTEMA DE PRODUCCIÓN INTERNO</div>
</div>
</body></html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from:        FROM,
    to:          provider.email,
    subject:     `[PRODUCCIÓN] ${order.orderRef} – ${items.length} artículo${items.length !== 1 ? "s" : ""}`,
    html,
    attachments,
  });
}
