import CatalogPage from "@/components/CatalogPage";
import { getAssetFiles } from "@/lib/assets";

export const metadata = {
  title: "Guerreros | BENOT",
  description: "Camisetas BENOT categoría Guerreros. Pide la tuya por Telegram.",
};

export default function GuerrerosPage() {
  const items = getAssetFiles("Guerreros");
  return (
    <CatalogPage
      title="CATEGORÍA GUERREROS"
      subtitle={`${items.length} DISEÑOS · CÓDIGO BASE: BNTWR`}
      items={items}
    />
  );
}
