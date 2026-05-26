import type { Metadata }         from "next";
import Header                    from "@/components/Header";
import RunningDestaca             from "@/components/RunningDestaca";
import RunningCatalogSection      from "@/components/RunningCatalogSection";
import { getRunningCatalog, getColorGroupCounts } from "@/lib/catalog/runningCatalog";

export const metadata: Metadata = {
  title: "Running | BENOT",
  description:
    "Camisetas BENOT Running. Diseñadas para correr y para destacar. Elige la tuya según el color de la carrera.",
};

// force-dynamic garantiza que el catálogo se re-lee en cada request
// (necesario mientras las imágenes se añaden vía volumen Docker sin rebuild)
export const dynamic = "force-dynamic";

export default async function RunningPage() {
  // Catálogo auto-generado desde assets/Running/
  // Sharp analiza colores por primera vez y los cachea por mtime.
  // Añadir una imagen nueva → aparece automáticamente en el próximo request.
  const catalog = await getRunningCatalog();
  const colorGroupCounts = getColorGroupCounts(catalog);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-[68px]">

        {/* ── Herramienta interactiva de contraste ────────────────── */}
        {/* Recibe el catálogo dinámico para el motor de recomendación */}
        <RunningDestaca catalog={catalog} />

        {/* ── Catálogo completo con filtro de color ───────────────── */}
        <RunningCatalogSection
          products={catalog}
          colorGroupCounts={colorGroupCounts}
        />

      </main>

      <footer className="bg-black py-6 text-center">
        <p className="font-bebas tracking-widest text-gray-600 text-xs">
          © 2026 BENOT. TODOS LOS DERECHOS RESERVADOS.
        </p>
      </footer>
    </div>
  );
}
