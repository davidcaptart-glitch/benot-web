export const dynamic = "force-dynamic";

import { ordersRepo, providersRepo, payoutsRepo, productConfigsRepo } from "@/lib/db";
import type { Order } from "@/lib/types";

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmt(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
}

function todayStr() {
  return new Date().toDateString();
}

function statusBadge(status: Order["status"]) {
  const map: Record<string, string> = {
    pending:          "bg-gray-100 text-gray-500",
    paid:             "bg-blue-50 text-blue-700",
    production_sent:  "bg-yellow-50 text-yellow-700",
    in_production:    "bg-purple-50 text-purple-700",
    shipped:          "bg-orange-50 text-orange-700",
    delivered:        "bg-green-50 text-green-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const allOrders    = ordersRepo.all();
  const allProviders = providersRepo.all();
  const allPayouts   = payoutsRepo.all();
  const configs      = productConfigsRepo.all();

  const todayOrders  = allOrders.filter((o) => new Date(o.createdAt).toDateString() === todayStr());
  const todayRevenue = todayOrders
    .filter((o) => o.status !== "pending")
    .reduce((s, o) => s + o.totalAmount, 0);

  const pending       = allOrders.filter((o) => ["paid", "production_sent", "in_production"].includes(o.status));
  const shipped       = allOrders.filter((o) => o.status === "shipped");
  const delivered     = allOrders.filter((o) => o.status === "delivered");
  const activeProviders = allProviders.filter((p) => p.active);
  const pendingPayouts  = allPayouts.filter((p) => p.status === "pending");

  // Sales by product type
  const salesByType: Record<string, { count: number; revenue: number }> = {};
  allOrders
    .filter((o) => o.status !== "pending")
    .forEach((o) => {
      o.items.forEach((item) => {
        const t = item.productType;
        if (!salesByType[t]) salesByType[t] = { count: 0, revenue: 0 };
        salesByType[t].count   += item.quantity;
        salesByType[t].revenue += item.subtotal;
      });
    });

  const recentOrders = allOrders.slice(0, 8);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-bebas tracking-[0.25em] text-[#FF1E1E] text-xs mb-1">PANEL DE CONTROL</p>
        <h1 className="font-bebas tracking-wider text-4xl text-black">DASHBOARD</h1>
        <p className="text-gray-400 text-xs mt-1">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="PEDIDOS HOY"      value={String(todayOrders.length)} sub={`${fmt(todayRevenue)} ingresos`} accent />
        <KpiCard label="EN PRODUCCIÓN"    value={String(pending.length)}     sub="pendientes de envío" />
        <KpiCard label="ENVIADOS"         value={String(shipped.length)}     sub="en tránsito" />
        <KpiCard label="ENTREGADOS"       value={String(delivered.length)}   sub="completados" />
        <KpiCard label="PROVEEDORES"      value={String(activeProviders.length)} sub="activos" />
        <KpiCard label="PAGOS PENDIENTES" value={String(pendingPayouts.length)} sub={`${fmt(pendingPayouts.reduce((s, p) => s + p.amount, 0))}`} />
        <KpiCard label="TOTAL PEDIDOS"    value={String(allOrders.length)}   sub="histórico" />
        <KpiCard label="INGRESOS TOTALES" value={fmt(allOrders.filter(o => o.status !== "pending").reduce((s, o) => s + o.totalAmount, 0))} sub="neto facturado" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bebas tracking-widest text-sm">ÚLTIMOS PEDIDOS</p>
            <a href="/admin/orders" className="text-[10px] tracking-widest text-[#FF1E1E] hover:underline">VER TODOS →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-400 tracking-wider font-medium">REF</th>
                  <th className="text-left px-5 py-3 text-gray-400 tracking-wider font-medium">CLIENTE</th>
                  <th className="text-left px-5 py-3 text-gray-400 tracking-wider font-medium">IMPORTE</th>
                  <th className="text-left px-5 py-3 text-gray-400 tracking-wider font-medium">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <a href={`/admin/orders/${o.orderRef}`} className="font-mono text-[#FF1E1E] hover:underline font-medium">{o.orderRef}</a>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{o.customerName || o.customerEmail}</td>
                    <td className="px-5 py-3 font-medium">{fmt(o.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] tracking-wider font-medium ${statusBadge(o.status)}`}>
                        {o.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">Sin pedidos todavía</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by product + config */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-bebas tracking-widest text-sm">VENTAS POR PRODUCTO</p>
            </div>
            <div className="divide-y divide-gray-50">
              {Object.entries(salesByType).map(([type, data]) => (
                <div key={type} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{type.replace("_", " ").toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400">{data.count} unidades</p>
                  </div>
                  <p className="text-sm font-semibold">{fmt(data.revenue)}</p>
                </div>
              ))}
              {Object.keys(salesByType).length === 0 && (
                <p className="px-5 py-6 text-center text-gray-400 text-xs">Sin ventas todavía</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bebas tracking-widest text-sm">PRECIOS ACTIVOS</p>
              <a href="/admin/products" className="text-[10px] tracking-widest text-[#FF1E1E] hover:underline">EDITAR →</a>
            </div>
            <div className="divide-y divide-gray-50">
              {configs.map((c) => (
                <div key={c.productType} className="px-5 py-3 flex items-center justify-between">
                  <p className="text-xs text-gray-600">{c.productType.replace("_", " ").toUpperCase()}</p>
                  <div className="text-right">
                    <p className="text-xs font-semibold">{fmt(c.basePrice)}</p>
                    {c.discountActive && (
                      <p className="text-[10px] text-[#FF1E1E]">−{c.discountPercent}%</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string; accent?: boolean;
}) {
  return (
    <div className={`p-5 border ${accent ? "bg-black border-black" : "bg-white border-gray-100"}`}>
      <p className={`text-[10px] tracking-widest font-medium mb-2 ${accent ? "text-[#FF1E1E]" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`font-bebas tracking-wide text-3xl leading-none ${accent ? "text-white" : "text-black"}`}>
        {value}
      </p>
      <p className={`text-[11px] mt-1 ${accent ? "text-white/50" : "text-gray-400"}`}>{sub}</p>
    </div>
  );
}
