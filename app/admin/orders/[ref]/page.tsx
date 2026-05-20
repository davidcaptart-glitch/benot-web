export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { ordersRepo, providersRepo } from "@/lib/db";
import {
  updateOrderStatus,
  updateItemProductionStatus,
  resendCustomerEmail,
  resendProviderEmail,
} from "@/lib/admin-actions";
import type { OrderStatus, ProductionStatus } from "@/lib/types";
import fs from "fs";

const ORDER_STATUSES: OrderStatus[] = [
  "pending","paid","production_sent","in_production","shipped","delivered",
];
const PROD_STATUSES: ProductionStatus[] = [
  "pending","queued","printing","completed","shipped",
];

function fmt(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
}

const STATUS_COLORS: Record<string, string> = {
  pending:          "bg-gray-100 text-gray-600",
  paid:             "bg-blue-50 text-blue-700",
  production_sent:  "bg-yellow-50 text-yellow-700",
  in_production:    "bg-purple-50 text-purple-700",
  shipped:          "bg-orange-50 text-orange-700",
  delivered:        "bg-green-50 text-green-700",
  queued:           "bg-sky-50 text-sky-700",
  printing:         "bg-violet-50 text-violet-700",
  completed:        "bg-emerald-50 text-emerald-700",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const [order, providers] = await Promise.all([
    ordersRepo.findByRef(ref.toUpperCase()),
    providersRepo.all(),
  ]);
  if (!order) notFound();

  const addr        = order.shippingAddress;
  const frozenAssets = order.frozenAssets ?? [];

  const providerMap = new Map(providers.map((p) => [p.id, p]));

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <p className="text-xs text-gray-400 mb-4">
        <a href="/admin/orders" className="hover:text-black">Pedidos</a>
        {" / "}
        <span className="text-black font-medium">{order.orderRef}</span>
      </p>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="font-bebas tracking-[0.25em] text-[#FF1E1E] text-xs mb-1">DETALLE DE PEDIDO</p>
          <h1 className="font-bebas tracking-wider text-4xl text-black leading-none">{order.orderRef}</h1>
          <p className="text-gray-400 text-xs mt-1">
            {new Date(order.createdAt).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>
        <span className={`px-3 py-1.5 text-xs tracking-wider font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-500"}`}>
          {order.status.replace(/_/g, " ").toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Customer */}
        <Card title="CLIENTE">
          <Row label="Nombre"   value={order.customerName || "—"} />
          <Row label="Email"    value={order.customerEmail} />
          <Row label="Teléfono" value={order.customerPhone ?? "—"} />
        </Card>

        {/* Shipping */}
        <Card title="DIRECCIÓN DE ENVÍO">
          {addr ? (
            <>
              <Row label="Nombre" value={addr.name} />
              <Row label="Calle"  value={`${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}`} />
              <Row label="Ciudad" value={`${addr.postal_code} ${addr.city}`} />
              <Row label="País"   value={addr.country} />
            </>
          ) : <p className="text-gray-400 text-xs">Sin dirección</p>}
          {order.shippingOption && <Row label="Envío" value={order.shippingOption} />}
        </Card>

        {/* Amounts */}
        <Card title="IMPORTES">
          <Row label="Subtotal" value={fmt(order.subtotalAmount)} />
          <Row label="Envío"    value={order.shippingAmount === 0 ? "GRATIS" : fmt(order.shippingAmount)} />
          <Row label="TOTAL"    value={fmt(order.totalAmount)} bold />
          <Row label="Moneda"   value={order.currency.toUpperCase()} />
        </Card>
      </div>

      {/* Change order status */}
      <Card title="ESTADO DEL PEDIDO" className="mb-5">
        <form
          action={async (fd: FormData) => {
            "use server";
            await updateOrderStatus(order.orderRef, fd.get("status") as OrderStatus);
          }}
          className="flex items-center gap-3"
        >
          <select
            name="status"
            defaultValue={order.status}
            className="border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-black bg-white"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white text-xs tracking-widest hover:bg-[#FF1E1E] transition-colors"
          >
            ACTUALIZAR
          </button>
        </form>
      </Card>

      {/* Items */}
      <Card title="ARTÍCULOS" className="mb-5">
        <div className="space-y-4">
          {order.items.map((item) => {
            const provider = item.providerId ? providerMap.get(item.providerId) : null;
            return (
              <div key={item.id} className="border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-sm text-black">{item.productName}</p>
                    {item.color         && <p className="text-xs text-gray-500">Color: {item.color}</p>}
                    {item.phraseCode    && <p className="text-xs text-gray-500">Frase: {item.phraseCode}</p>}
                    {item.designCode    && <p className="text-xs text-gray-500">Diseño: {item.designCode}</p>}
                    {item.itemCode      && <p className="text-xs text-gray-500">Código: {item.itemCode}</p>}
                    {item.printZones?.map((z) => (
                      <p key={z.zoneId} className="text-xs text-gray-500">{z.label}: {z.code}{z.isFixed ? " [FIJO]" : ""}</p>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">
                      {Object.entries(item.sizes).filter(([,q]) => q > 0).map(([s, q]) => `${s}×${q}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                    <p className="font-semibold text-sm">{fmt(item.subtotal)}</p>
                    {provider && (
                      <a href={`/admin/providers/${provider.id}`} className="text-[10px] text-[#FF1E1E] hover:underline">
                        {provider.name}
                      </a>
                    )}
                  </div>
                </div>

                {/* Per-item production status */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400 tracking-wider">PRODUCCIÓN:</span>
                  <span className={`px-2 py-0.5 text-[10px] tracking-wider font-medium ${STATUS_COLORS[item.productionStatus ?? "pending"] ?? "bg-gray-100 text-gray-500"}`}>
                    {(item.productionStatus ?? "pending").toUpperCase()}
                  </span>
                  <form
                    action={async (fd: FormData) => {
                      "use server";
                      await updateItemProductionStatus(
                        order.orderRef,
                        item.id,
                        fd.get("productionStatus") as ProductionStatus
                      );
                    }}
                    className="flex items-center gap-2 ml-auto"
                  >
                    <select
                      name="productionStatus"
                      defaultValue={item.productionStatus ?? "pending"}
                      className="border border-gray-200 px-2 py-1 text-[10px] focus:outline-none focus:border-black bg-white"
                    >
                      {PROD_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.toUpperCase()}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-black text-white text-[10px] tracking-widest hover:bg-[#FF1E1E] transition-colors"
                    >
                      OK
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Frozen assets */}
      {frozenAssets.length > 0 && (
        <Card title="ASSETS (SNAPSHOT INMUTABLE)" className="mb-5">
          <div className="grid grid-cols-2 gap-2">
            {frozenAssets.map((a, i) => {
              const exists = fs.existsSync(a.absolutePath);
              return (
                <div key={i} className={`flex items-center gap-2 p-2 border ${exists ? "border-gray-100" : "border-red-100 bg-red-50"}`}>
                  <span className={`text-[10px] ${exists ? "text-green-600" : "text-red-500"}`}>
                    {exists ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-700 truncate">{a.filename}</p>
                    <p className="text-[10px] text-gray-400">{a.label}</p>
                  </div>
                  {exists && (
                    <a
                      href={`/api/admin/orders/${order.orderRef}/file/${encodeURIComponent(a.filename)}`}
                      className="text-[10px] text-[#FF1E1E] hover:underline flex-shrink-0"
                      download
                    >
                      ↓
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Production PDFs */}
      {order.productionPdfs && Object.keys(order.productionPdfs).length > 0 && (
        <Card title="PRODUCTION SHEETS (PDF)" className="mb-5">
          <div className="space-y-2">
            {Object.entries(order.productionPdfs).map(([pid, pdfPath]) => {
              const provider = providerMap.get(pid);
              const exists   = fs.existsSync(pdfPath);
              return (
                <div key={pid} className="flex items-center justify-between p-3 border border-gray-100">
                  <div>
                    <p className="text-xs font-medium">{provider?.name ?? pid}</p>
                    <p className="text-[10px] text-gray-400">{pdfPath.split("/").pop()?.split("\\").pop()}</p>
                  </div>
                  {exists ? (
                    <a
                      href={`/api/admin/orders/${order.orderRef}/file/production-sheet-${pid}.pdf`}
                      className="text-xs tracking-widest text-[#FF1E1E] hover:underline"
                      download
                    >
                      DESCARGAR PDF →
                    </a>
                  ) : (
                    <span className="text-xs text-red-500">Archivo no encontrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Email actions */}
      <Card title="EMAILS">
        <div className="flex flex-wrap gap-3">
          <form action={async () => { "use server"; await resendCustomerEmail(order.orderRef); }}>
            <button
              type="submit"
              className="px-4 py-2 border border-black text-xs tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              REENVIAR EMAIL CLIENTE
            </button>
          </form>
          {providers
            .filter((p) => order.items.some((i) => i.providerId === p.id))
            .map((p) => (
              <form
                key={p.id}
                action={async () => { "use server"; await resendProviderEmail(order.orderRef, p.id); }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 border border-gray-300 text-xs tracking-widest hover:border-black transition-colors"
                >
                  REENVIAR → {p.name.toUpperCase()}
                </button>
              </form>
            ))}
        </div>
      </Card>
    </div>
  );
}

function Card({
  title, children, className,
}: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-100 ${className ?? ""}`}>
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="font-bebas tracking-widest text-xs text-gray-500">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-xs text-right ${bold ? "font-semibold text-black" : "text-gray-700"}`}>{value}</span>
    </div>
  );
}
