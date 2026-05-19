import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Slogan from "@/components/Slogan";
import Configurador from "@/components/Configurador";
import { getAssetFiles } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Configura tu camiseta | BENOT",
  description:
    "Diseña tu camiseta BENOT paso a paso: elige el color, la frase y el diseño. Pedido directo al bot de Telegram.",
};

// Rutas base de activos del configurador
const BASE = "Configurador/Camiseta personalizada";

export default function ConfiguradorPage() {
  /*
   * Frases — por color, ya con sufijo en el nombre (BNTFR001W.png en blanca/, etc.)
   * Añadir BNTFRXXX{W|B|R}.png en la carpeta correspondiente + push → aparece automáticamente.
   */
  const frasesByColor = {
    negra:  getAssetFiles(`${BASE}/01 - Frases/negra`),
    blanca: getAssetFiles(`${BASE}/01 - Frases/blanca`),
    roja:   getAssetFiles(`${BASE}/01 - Frases/roja`),
  };

  /*
   * Diseños — organizados por categoría Y por color.
   * Los thumbnails ya muestran el diseño sobre el color de camiseta elegido.
   * Añadir categoría = crear carpeta nueva con subcarpetas blanca/negra/roja + imágenes + push.
   */
  const disenosByCategory = {
    anime: {
      negra:  getAssetFiles(`${BASE}/02 - Diseños/Anime/negra`),
      blanca: getAssetFiles(`${BASE}/02 - Diseños/Anime/blanca`),
      roja:   getAssetFiles(`${BASE}/02 - Diseños/Anime/roja`),
    },
    guerreros: {
      negra:  getAssetFiles(`${BASE}/02 - Diseños/Guerreros/negra`),
      blanca: getAssetFiles(`${BASE}/02 - Diseños/Guerreros/blanca`),
      roja:   getAssetFiles(`${BASE}/02 - Diseños/Guerreros/roja`),
    },
  };

  // Running — catálogo fijo: assets/Configurador/Running/
  const runningItems = getAssetFiles("Configurador/Running");

  // Solidaria #YoTeEmpujo: assets/Configurador/yoteempujo/
  const yoteempujoItems = getAssetFiles("Configurador/yoteempujo");

  return (
    <>
      <Header />
      <main className="pt-[68px]">
        <Slogan />
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
