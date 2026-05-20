import { NextRequest, NextResponse } from "next/server";
import { verifyProviderToken } from "@/lib/tokens";
import { ordersRepo } from "@/lib/db";
import { sendCustomerStatusEmail } from "@/lib/email";
import type { ProductionStatus, OrderStatus } from "@/lib/types";

/* ══════════════════════════════════════════════════════════════════
   GET /api/provider-action
   Magic-link endpoint for providers to update order item status
   without logging into the admin panel.

   Query params:
     token    – HMAC-SHA256(ADMIN_SECRET, orderRef:itemId:action)
     ref      – BN-2026-000124
     itemId   – OrderItem UUID
     action   – "printing_started" | "production_complete" | "shipped"

   On success: returns a simple HTML confirmation page.
   On invalid token: returns 403 HTML error page.
══════════════════════════════════════════════════════════════════ */

type ProviderAction = "printing_started" | "production_complete" | "shipped";

const ACTION_LABELS: Record<ProviderAction, string> = {
  printing_started:    "Impresión iniciada",
  production_complete: "Producción completada",
  shipped:             "Enviado al cliente",
};

const ACTION_TO_PRODUCTION_STATUS: Record<ProviderAction, ProductionStatus> = {
  printing_started:    "printing",
  production_complete: "completed",
  shipped:             "shipped",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token   = searchParams.get("token")  ?? "";
  const ref     = searchParams.get("ref")    ?? "";
  const itemId  = searchParams.get("itemId") ?? "";
  const action  = (searchParams.get("action") ?? "") as ProviderAction;

  const validActions: ProviderAction[] = ["printing_started", "production_complete", "shipped"];
  if (!validActions.includes(action)) {
    return htmlPage("❌ Acción no válida", "La acción especificada no existe.", false);
  }

  if (!verifyProviderToken(token, ref, itemId, action)) {
    return htmlPage("❌ Token inválido", "Este enlace no es válido o ha caducado.", false);
  }

  const order = ordersRepo.findByRef(ref.toUpperCase());
  if (!order) {
    return htmlPage("❌ Pedido no encontrado", `No existe el pedido ${ref}.`, false);
  }

  const item = order.items.find((i) => i.id === itemId);
  if (!item) {
    return htmlPage("❌ Artículo no encontrado", "El artículo no pertenece a este pedido.", false);
  }

  // Update per-item production status
  const productionStatus = ACTION_TO_PRODUCTION_STATUS[action];
  const updatedOrder = ordersRepo.updateItemProductionStatus(order.id, itemId, productionStatus);

  if (!updatedOrder) {
    return htmlPage("❌ Error", "No se pudo actualizar el estado.", false);
  }

  // Determine aggregate order status
  const allItems         = updatedOrder.items;
  const allCompleted     = allItems.every((i) => i.productionStatus === "completed" || i.productionStatus === "shipped");
  const allShipped       = allItems.every((i) => i.productionStatus === "shipped");
  const anyInProduction  = allItems.some((i) => i.productionStatus === "printing");

  let newOrderStatus: OrderStatus | null = null;
  if (allShipped)      newOrderStatus = "shipped";
  else if (allCompleted) newOrderStatus = "in_production";
  else if (anyInProduction) newOrderStatus = "in_production";

  if (newOrderStatus && newOrderStatus !== updatedOrder.status) {
    ordersRepo.updateStatus(updatedOrder.id, newOrderStatus);
  }

  // Send customer status email (fire-and-forget)
  if (action === "production_complete" || action === "shipped") {
    const emailStatus = action === "shipped" ? "shipped" : "in_production";
    sendCustomerStatusEmail(updatedOrder, emailStatus).catch((err) =>
      console.error("[provider-action] Customer email failed:", err)
    );
  }

  const label = ACTION_LABELS[action];
  return htmlPage(
    `✓ ${label}`,
    `El estado del pedido <strong>${ref}</strong> ha sido actualizado correctamente.<br/>
     Artículo: <em>${item.productName}</em><br/>
     Nuevo estado: <strong>${productionStatus}</strong>`,
    true
  );
}

function htmlPage(title: string, body: string, success: boolean): NextResponse {
  const color = success ? "#16A34A" : "#DC2626";
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} – BENOT</title>
  <style>
    body { margin:0; padding:0; background:#f5f5f3; font-family:Arial,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { background:#fff; border-top:4px solid ${color}; padding:48px 40px; max-width:480px; width:90%; box-shadow:0 2px 16px rgba(0,0,0,.08); }
    h1 { color:${color}; font-size:22px; margin:0 0 16px; }
    p { color:#555; font-size:15px; line-height:1.6; margin:0; }
    .brand { font-size:11px; letter-spacing:0.2em; color:#aaa; margin-bottom:24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">BENOT · SISTEMA DE PRODUCCIÓN</div>
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status:  success ? 200 : 403,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
