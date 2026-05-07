import CatalogPage from "@/components/CatalogPage";
import { getAssetFiles } from "@/lib/assets";

export const metadata = {
  title: "Anime | BENOT",
  description: "Camisetas BENOT categoría Anime. Pide la tuya por Telegram.",
};

export default function AnimePage() {
  const items = getAssetFiles("Anime");
  return (
    <CatalogPage
      title="CATEGORÍA ANIME"
      subtitle={`${items.length} DISEÑOS · CÓDIGO BASE: BNTAN`}
      items={items}
    />
  );
}
