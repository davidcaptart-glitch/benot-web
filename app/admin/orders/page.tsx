export const dynamic = "force-dynamic";
import { ordersRepo } from "@/lib/db";
import OrdersTable from "./OrdersTable";

export default function OrdersPage() {
  const orders = ordersRepo.all();
  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-bebas tracking-[0.25em] text-[#FF1E1E] text-xs mb-1">GESTIÓN</p>
          <h1 className="font-bebas tracking-wider text-4xl text-black">PEDIDOS</h1>
          <p className="text-gray-400 text-xs mt-1">{orders.length} pedidos en total</p>
        </div>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
