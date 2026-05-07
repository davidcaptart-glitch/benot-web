import CatalogPage from "@/components/CatalogPage";
import { getAssetFiles } from "@/lib/assets";

export const metadata = {
  title: "Frases | BENOT",
  description: "Todas las frases disponibles en camisetas BENOT. Pide la tuya por Telegram.",
};

export default function FrasesPage() {
  const items = getAssetFiles("Frases");
  return (
    <CatalogPage
      title="TODAS LAS FRASES"
      subtitle={`${items.length} DISEÑOS · PIDE EL TUYO POR TELEGRAM`}
      items={items}
    />
  );
}
