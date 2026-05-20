export const dynamic = "force-dynamic";
import { providersRepo } from "@/lib/db";
import Link from "next/link";

export default async function ProvidersPage() {
  const providers = await providersRepo.all();

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="font-bebas tracking-[0.25em] text-[#FF1E1E] text-xs mb-1">GESTIÓN</p>
        <h1 className="font-bebas tracking-wider text-4xl text-black">PROVEEDORES</h1>
        <p className="text-gray-400 text-xs mt-1">{providers.length} proveedores registrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers.map((p) => {
          const sc    = p.stripeConnectStatus;
          const ready = sc?.payoutsEnabled && sc?.chargesEnabled;
          return (
            <Link
              key={p.id}
              href={`/admin/providers/${p.id}`}
              className="bg-white border border-gray-100 hover:border-gray-300 transition-colors block p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm text-black">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.email}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 font-medium tracking-wider ${
                  p.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  {p.active ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {p.supportedProductTypes.map((t) => (
                  <span key={t} className="inline-block text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 mr-1 tracking-wider">
                    {t.replace(/_/g, " ").toUpperCase()}
                  </span>
                ))}
              </div>

              <div className="border-t border-gray-50 pt-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  !p.stripeAccountId ? "bg-gray-300" :
                  ready ? "bg-green-500" :
                  sc?.detailsSubmitted ? "bg-yellow-400" : "bg-red-400"
                }`} />
                <p className="text-[10px] text-gray-500">
                  {!p.stripeAccountId ? "Sin cuenta Stripe" :
                   ready ? "Connect activo" :
                   sc?.detailsSubmitted ? "Pendiente verificación" : "Onboarding incompleto"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
