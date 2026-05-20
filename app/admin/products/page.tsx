export const dynamic = "force-dynamic";
import { productConfigsRepo } from "@/lib/db";
import { saveProductConfig }  from "@/lib/admin-actions";
import type { ProductConfig } from "@/lib/types";

const PRODUCT_LABELS: Record<string, string> = {
  premium_custom:    "Camiseta personalizada premium",
  running_fullprint: "Camiseta multideporte fullprint",
  solidary_standard: "Camiseta solidaria estándar",
};

function fmt(cents: number) {
  return (cents / 100).toFixed(2);
}

export default async function ProductsPage() {
  const configs = await productConfigsRepo.all();

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="font-bebas tracking-[0.25em] text-[#FF1E1E] text-xs mb-1">CONFIGURACIÓN</p>
        <h1 className="font-bebas tracking-wider text-4xl text-black">PRODUCTOS Y PRECIOS</h1>
        <p className="text-gray-400 text-xs mt-1">Todos los precios en euros. Los cambios se aplican a nuevos pedidos.</p>
      </div>

      <div className="space-y-6">
        {configs.map((config) => (
          <ProductConfigForm key={config.productType} config={config} />
        ))}
      </div>
    </div>
  );
}

function ProductConfigForm({ config }: { config: ProductConfig }) {
  const label = PRODUCT_LABELS[config.productType] ?? config.productType;

  return (
    <form
      className="bg-white border border-gray-100"
      action={async (fd: FormData) => {
        "use server";
        const updated: ProductConfig = {
          ...config,
          basePrice:               Math.round(Number(fd.get("basePrice")) * 100),
          providerCost:            Math.round(Number(fd.get("providerCost")) * 100),
          shippingCost:            Math.round(Number(fd.get("shippingCost")) * 100),
          urgentShippingCost:      Math.round(Number(fd.get("urgentShippingCost")) * 100),
          freeShippingThreshold:   Math.round(Number(fd.get("freeShippingThreshold")) * 100),
          discountActive:          fd.get("discountActive") === "on",
          discountPercent:         Number(fd.get("discountPercent")),
          active:                  fd.get("active") === "on",
          estimatedProductionDays: Number(fd.get("estimatedProductionDays")),
          estimatedShippingDays:   Number(fd.get("estimatedShippingDays")),
        };
        await saveProductConfig(updated);
      }}
    >
      {/* Card header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-bebas tracking-widest text-sm">{label.toUpperCase()}</p>
          <p className="text-[10px] text-gray-400 font-mono">{config.productType}</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-500">Activo</span>
            <input type="checkbox" name="active" defaultChecked={config.active} className="accent-black" />
          </label>
          <button
            type="submit"
            className="px-5 py-2 bg-black text-white text-xs tracking-widest hover:bg-[#FF1E1E] transition-colors"
          >
            GUARDAR
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <PriceField label="Precio cliente (€)" name="basePrice"            defaultValue={fmt(config.basePrice)} />
        <PriceField label="Coste proveedor (€)" name="providerCost"        defaultValue={fmt(config.providerCost)} />
        <PriceField label="Envío estándar (€)"  name="shippingCost"        defaultValue={fmt(config.shippingCost)} />
        <PriceField label="Envío urgente (€)"   name="urgentShippingCost"  defaultValue={fmt(config.urgentShippingCost)} />
        <PriceField label="Envío gratis desde (€)" name="freeShippingThreshold" defaultValue={fmt(config.freeShippingThreshold)} />

        <NumField label="Días producción"  name="estimatedProductionDays" defaultValue={String(config.estimatedProductionDays)} />
        <NumField label="Días envío est."  name="estimatedShippingDays"   defaultValue={String(config.estimatedShippingDays)} />

        {/* Discount */}
        <div className="col-span-2 flex gap-4 items-end">
          <div className="flex-1">
            <NumField label="Descuento (%)" name="discountPercent" defaultValue={String(config.discountPercent)} />
          </div>
          <label className="flex items-center gap-2 pb-2 cursor-pointer">
            <input
              type="checkbox"
              name="discountActive"
              defaultChecked={config.discountActive}
              className="accent-[#FF1E1E]"
            />
            <span className="text-xs text-gray-600">Activo</span>
          </label>
        </div>
      </div>

      {/* Margin summary */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex gap-6">
        <div>
          <p className="text-[10px] text-gray-400">MARGEN BRUTO</p>
          <p className="text-sm font-semibold">
            {fmt(config.basePrice - config.providerCost)} €
            <span className="text-xs text-gray-400 ml-1">
              ({config.basePrice > 0
                ? Math.round(((config.basePrice - config.providerCost) / config.basePrice) * 100)
                : 0}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">PRECIO CON DESCUENTO</p>
          <p className="text-sm font-semibold">
            {config.discountActive
              ? fmt(Math.round(config.basePrice * (1 - config.discountPercent / 100))) + " €"
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">ÚLTIMA ACTUALIZACIÓN</p>
          <p className="text-xs text-gray-600">{new Date(config.updatedAt).toLocaleString("es-ES")}</p>
        </div>
      </div>
    </form>
  );
}

function PriceField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-[10px] tracking-wider text-gray-400 mb-1">{label.toUpperCase()}</label>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        step="0.01"
        min="0"
        className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
      />
    </div>
  );
}

function NumField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-[10px] tracking-wider text-gray-400 mb-1">{label.toUpperCase()}</label>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        step="1"
        min="0"
        className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
      />
    </div>
  );
}
