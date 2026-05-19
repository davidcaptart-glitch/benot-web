import Header from "@/components/Header";
import Hero from "@/components/Hero";
import UltimasFrases from "@/components/UltimasFrases";
import Slogan from "@/components/Slogan";
import Categorias from "@/components/Categorias";
import YoteEmpujo from "@/components/YoteEmpujo";
import ComoFunciona from "@/components/ComoFunciona";
import TelegramBanner from "@/components/TelegramBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <UltimasFrases />
      <Slogan />
      <Categorias />
      <YoteEmpujo />
      <ComoFunciona />
      <TelegramBanner />
      <Footer />
    </main>
  );
}
