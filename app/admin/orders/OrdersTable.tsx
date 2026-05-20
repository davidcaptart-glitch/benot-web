"use client";
import { useState } from "react";
import type { Order } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending:          "bg-gray-100 text-gray-500",
  paid:             "bg-blue-50 text-blue-700",
  production_sent:  "bg-yellow-50 text-yellow-700",
  in_production:    "bg-purple-50 text-purple-700",
  shipped:          "bg-orange-50 text-orange-700",
  delivered:        "bg-green-50 text-green-700",
};

const ALL_STATUSES = ["pending","paid","production_sent","in_production","shipped","delivered"];

function fmt(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.orderRef.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="bg-white border border-gray-100">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Buscar referencia, cliente, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 px-3 py-2 text-xs w-64 focus:outline-none focus:border-black"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-black bg-white"
        >
          <option value="all">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["REFERENCIA","FECHA","CLIENTE","PRODUCTOS","IMPORTE","ESTADO",""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-gray-400 tracking-wider font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-mono font-semibold text-[#FF1E1E] whitespace-nowrap">{o.orderRef}</td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800">{o.customerName || "—"}</p>
                  <p className="text-gray-400">{o.customerEmail}</p>
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {o.items.map((i) => (
                    <p key={i.id} className="whitespace-nowrap">
                      {i.productName.split(" ").slice(0, 2).join(" ")} ×{i.quantity}
                    </p>
                  ))}
                </td>
                <td className="px-5 py-3 font-semibold whitespace-nowrap">{fmt(o.totalAmount)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] tracking-wider font-medium whitespace-nowrap ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {o.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <a
                    href={`/admin/orders/${o.orderRef}`}
                    className="text-[10px] tracking-widest text-black hover:text-[#FF1E1E] transition-colors font-medium"
                  >
                    VER →
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                  No hay pedidos que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
