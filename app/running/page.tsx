import CatalogPage from "@/components/CatalogPage";
import { getAssetFiles } from "@/lib/assets";

export const metadata = {
  title: "Running | BENOT",
  description: "Camisetas BENOT categoría Running. Pide la tuya por Telegram.",
};

export default function RunningPage() {
  const items = getAssetFiles("Running");
  return (
    <CatalogPage
      title="CATEGORÍA RUNNING"
      subtitle={`${items.length} DISEÑOS · CÓDIGO BASE: BNTRN`}
      items={items}
    />
  );
}
