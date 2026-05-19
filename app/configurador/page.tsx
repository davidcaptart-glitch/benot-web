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
  // Frases por color — carpeta: assets/Configurador/Frases/{color}/
  // Añadir BNTFRXXX.png en la carpeta correspondiente y hacer push → aparece automáticamente.
  const frasesByColor = {
    negra:  getAssetFiles("Configurador/Frases/negra"),
    blanca: getAssetFiles("Configurador/Frases/blanca"),
    roja:   getAssetFiles("Configurador/Frases/roja"),
  };

  // Diseños por categoría — carpeta: assets/Configurador/Diseños/{categoria}/
  // Añadir nueva categoría = crear carpeta + añadir imágenes + push.
  const disenosByCategory = {
    anime:     getAssetFiles("Configurador/Diseños/Anime"),
    guerreros: getAssetFiles("Configurador/Diseños/Guerreros"),
  };

  // Running — catálogo fijo: assets/Configurador/Running/
  const runningItems = getAssetFiles("Configurador/Running");

  // #YoTeEmpujo — camiseta solidaria: assets/Configurador/yoteempujo/
  const yoteempujoItems = getAssetFiles("Configurador/yoteempujo");

  return (
    <>
      <Header />
      <main className="pt-[68px]">
        <Configurador
          frasesByColor={frasesByColor}
          disenosByCategory={disenosByCategory}
          runningItems={runningItems}
          yoteempujoItems={yoteempujoItems}
        />
      </main>
      <Footer />
    </>
  );
}
