import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

// Componente compartido para todas las páginas legales.
// Uso: <LegalPage title="Aviso Legal" updated="Mayo 2026"> ... </LegalPage>

interface Props {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, updated, children }: Props) {
  return (
    <>
      <Header />
      <main className="pt-[68px] min-h-screen bg-white">
        {/* Cabecera */}
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-10">
          <div className="max-w-[760px] mx-auto">
            <p className="font-bebas tracking-widest text-[#FF1E1E] text-xs mb-2">LEGAL</p>
            <h1 className="font-bebas tracking-widest text-4xl sm:text-5xl text-black mb-3">{title}</h1>
            <p className="text-xs text-gray-400">Última actualización: {updated}</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-[760px] mx-auto px-6 py-4">
          <nav className="flex gap-2 text-[11px] text-gray-400 font-bebas tracking-widest">
            <Link href="/" className="hover:text-black transition-colors">INICIO</Link>
            <span>/</span>
            <span className="text-black">{title.toUpperCase()}</span>
          </nav>
        </div>

        {/* Contenido */}
        <div className="max-w-[760px] mx-auto px-6 pb-20 legal-content">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
