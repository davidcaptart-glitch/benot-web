import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Configurador from "@/components/Configurador";
import { getAssetFiles } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Configura tu camiseta | BENOT",
  description:
    "Diseña tu camiseta BENOT paso a paso: elige el color, la frase y el diseño. Pedido directo al bot de Telegram.",
};

export default function ConfiguradorPage() {
  const frases = getAssetFiles("Frases");

  // Merge all graphic categories as the "diseño" pool
  const disenos = [
    ...getAssetFiles("Anime"),
    ...getAssetFiles("Guerreros"),
    ...getAssetFiles("Running"),
  ];

  return (
    <>
      <Header />
      <main className="pt-[68px]">
        <Configurador frases={frases} disenos={disenos} />
      </main>
      <Footer />
    </>
  );
}
