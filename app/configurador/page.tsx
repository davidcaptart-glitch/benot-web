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
  // Frases detectadas por carpeta de color — al añadir BNTFR0XX.png
  // en las tres carpetas y hacer push, aparece automáticamente.
  const frasesByColor = {
    negra:  getAssetFiles("Configurador/frases/negra"),
    blanca: getAssetFiles("Configurador/frases/blanca"),
    roja:   getAssetFiles("Configurador/frases/roja"),
  };

  // Solo Anime y Guerreros son configurables.
  // Running y YoTeEmpujo son colecciones con diseño fijo — no aplican.
  const disenos = [
    ...getAssetFiles("Configurador/disenos"),
  ];

  return (
    <>
      <Header />
      <main className="pt-[68px]">
        <Configurador frasesByColor={frasesByColor} disenos={disenos} />
      </main>
      <Footer />
    </>
  );
}
