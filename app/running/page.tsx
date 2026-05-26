import type { Metadata }         from "next";
import Header                    from "@/components/Header";
import RunningDestaca             from "@/components/RunningDestaca";
import RunningCatalogSection      from "@/components/RunningCatalogSection";
import WomenCollection            from "@/components/WomenCollection";
import { getRunningCatalog, getRunningColorCounts } from "@/lib/catalog/runningCatalog";
import { getAssetFiles }          from "@/lib/assets";

export const metadata: Metadata = {
  title: "Running | BENOT",
  description:
    "Camisetas BENOT Running. Diseñadas para correr y para destacar. Elige la tuya según el color de la carrera.",
};

// force-dynamic garantiza que el catálogo se re-lee en cada request
// (necesario mientras las imágenes se añaden vía volumen Docker sin rebuild)
export const dynamic = "force-dynamic";

export default async function RunningPage() {
  // Catálogo masculino auto-generado desde assets/Running/
  const catalog            = await getRunningCatalog();
  const runningColorCounts = getRunningColorCounts(catalog);

  // Colección femenina — colorways de BNTRW001
  // Añadir más imágenes a assets/Configurador/Running/BNTRW001/ → aparecen automáticamente
  const womenItems = getAssetFiles("Configurador/Running/BNTRW001");

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-[68px]">

        {/* ── Herramienta interactiva de contraste ────────────────── */}
        <RunningDestaca catalog={catalog} />

        {/* ── Catálogo masculino completo con filtro de color ─────── */}
        <RunningCatalogSection
          products={catalog}
          runningColorCounts={runningColorCounts}
        />

        {/* ── Primera Colección Femenina BENOT ────────────────────── */}
        {womenItems.length > 0 && (
          <WomenCollection items={womenItems} />
        )}

      </main>

      <footer className="bg-black py-6 text-center">
        <p className="font-bebas tracking-widest text-gray-600 text-xs">
          © 2026 BENOT. TODOS LOS DERECHOS RESERVADOS.
        </p>
      </footer>
    </div>
  );
}
