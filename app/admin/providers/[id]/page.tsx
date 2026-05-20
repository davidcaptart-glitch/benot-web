export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { providersRepo, ordersRepo } from "@/lib/db";
import {
  saveProvider,
  toggleProviderActive,
  onboardProvider,
  syncProviderStripe,
} from "@/lib/admin-actions";
import type { ProductType } from "@/lib/types";

const ALL_PRODUCT_TYPES: ProductType[] = [
  "premium_custom", "running_fullprint", "solidary_standard",
];

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = providersRepo.findById(id);
  if (!provider) notFound();

  const sc           = provider.stripeConnectStatus;
  const allOrders    = ordersRepo.all();
  const providerOrders = allOrders
    .filter((o) => o.items.some((i) => i.providerId === id))
    .slice(0, 5);

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <p className="text-xs text-gray-400 mb-4">
        <a href="/admin/providers" className="hover:text-black">Proveedores</a>
        {" / "}
        <span className="text-black font-medium">{provider.name}</span>
      </p>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="font-bebas tracking-[0.25em] text-[#FF1E1E] text-xs mb-1">PROVEEDOR</p>
          <h1 className="font-bebas tracking-wider text-4xl text-black leading-none">{provider.name}</h1>
        </div>
        <span className={`px-3 py-1.5 text-xs tracking-wider font-medium ${
          provider.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {provider.active ? "ACTIVO" : "INACTIVO"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Edit form */}
        <form
          className="bg-white border border-gray-100 p-5"
          action={async (fd: FormData) => {
            "use server";
            const types = ALL_PRODUCT_TYPES.filter((t) => fd.get(`type_${t}`) === "on") as ProductType[];
            await saveProvider({
              ...provider,
              name:                  fd.get("name") as string,
              email:                 fd.get("email") as string,
              feePercent:            Number(fd.get("feePercent")),
              supportedProductTypes: types,
            });
          }}
        >
          <p className="font-bebas tracking-widest text-xs text-gray-400 mb-4 border-b border-gray-100 pb-3">DATOS DEL PROVEEDOR</p>
          <div className="space-y-3">
            <Field label="Nombre" name="name" defaultValue={provider.name} required />
            <Field label="Email"  name="email" type="email" defaultValue={provider.email} required />
            <Field
              label="Margen BENOT (%)"
              name="feePercent"
              type="number"
              defaultValue={String(provider.feePercent)}
              min="0" max="100"
            />
            <div>
              <p className="text-xs text-gray-400 mb-2">Tipos de producto</p>
              <div className="space-y-1">
                {ALL_PRODUCT_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`type_${t}`}
                      defaultChecked={provider.supportedProductTypes.includes(t)}
                      className="accent-black"
                    />
                    <span className="text-xs text-gray-700">{t.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 w-full py-2 bg-black text-white text-xs tracking-widest hover:bg-[#FF1E1E] transition-colors"
          >
            GUARDAR CAMBIOS
          </button>
        </form>

        {/* Stripe Connect */}
        <div className="bg-white border border-gray-100 p-5">
          <p className="font-bebas tracking-widest text-xs text-gray-400 mb-4 border-b border-gray-100 pb-3">STRIPE CONNECT</p>
          {provider.stripeAccountId ? (
            <div className="space-y-3">
              <div className="font-mono text-xs text-gray-600 bg-gray-50 px-3 py-2 break-all">
                {provider.stripeAccountId}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ConnectBadge label="Pagos"    ok={sc?.chargesEnabled}   />
                <ConnectBadge label="Payouts"  ok={sc?.payoutsEnabled}   />
                <ConnectBadge label="Datos"    ok={sc?.detailsSubmitted} />
              </div>
              {sc?.lastSyncedAt && (
                <p className="text-[10px] text-gray-400">
                  Sincronizado: {new Date(sc.lastSyncedAt).toLocaleString("es-ES")}
                </p>
              )}
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <form action={async () => { "use server"; await syncProviderStripe(id); }}>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-gray-300 text-xs tracking-widest hover:border-black transition-colors"
                  >
                    SINCRONIZAR
                  </button>
                </form>
                <form action={async () => { "use server"; await onboardProvider(id); }}>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-gray-300 text-xs tracking-widest hover:border-black transition-colors"
                  >
                    REENVIAR ONBOARDING
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500 mb-4">Sin cuenta Stripe Connect asociada.</p>
              <form action={async () => { "use server"; await onboardProvider(id); }}>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white text-xs tracking-widest hover:bg-[#FF1E1E] transition-colors"
                >
                  CONECTAR CON STRIPE →
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Toggle active */}
      <div className="bg-white border border-gray-100 p-5 mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{provider.active ? "Proveedor activo" : "Proveedor inactivo"}</p>
          <p className="text-xs text-gray-400">
            {provider.active
              ? "Recibe asignaciones automáticas de pedidos."
              : "No recibe pedidos automáticamente."}
          </p>
        </div>
        <form action={async () => { "use server"; await toggleProviderActive(id); }}>
          <button
            type="submit"
            className={`px-4 py-2 text-xs tracking-widest border transition-colors ${
              provider.active
                ? "border-red-300 text-red-600 hover:bg-red-600 hover:text-white"
                : "border-green-300 text-green-600 hover:bg-green-600 hover:text-white"
            }`}
          >
            {provider.active ? "DESACTIVAR" : "ACTIVAR"}
          </button>
        </form>
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-bebas tracking-widest text-sm">PEDIDOS RECIENTES</p>
        </div>
        <div>
          {providerOrders.length > 0 ? (
            providerOrders.map((o) => (
              <a
                key={o.id}
                href={`/admin/orders/${o.orderRef}`}
                className="flex items-center justify-between px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <span className="font-mono text-xs text-[#FF1E1E] font-medium">{o.orderRef}</span>
                <span className="text-xs text-gray-500">{o.customerName}</span>
                <span className="text-xs font-semibold">{(o.totalAmount / 100).toFixed(2)} €</span>
                <span className={`text-[10px] px-2 py-0.5 ${
                  o.status === "delivered" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {o.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </a>
            ))
          ) : (
            <p className="px-5 py-8 text-center text-xs text-gray-400">Sin pedidos asociados</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label, name, defaultValue, type = "text", required, min, max,
}: {
  label: string; name: string; defaultValue?: string;
  type?: string; required?: boolean; min?: string; max?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-wider text-gray-400 mb-1">{label.toUpperCase()}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        className="w-full border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-black"
      />
    </div>
  );
}

function ConnectBadge({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className={`flex flex-col items-center p-2 border text-center ${
      ok === true  ? "border-green-200 bg-green-50" :
      ok === false ? "border-red-100 bg-red-50" :
                     "border-gray-100 bg-gray-50"
    }`}>
      <span className={`text-sm ${ok ? "text-green-600" : "text-red-500"}`}>{ok ? "✓" : "✗"}</span>
      <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}
