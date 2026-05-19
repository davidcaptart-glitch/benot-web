import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black">
      {/* Top divider line */}
      <div className="w-full h-px bg-[#FF1E1E] opacity-60" />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10">

          {/* Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Image
              src="/assets/logo/logo.png"
              alt="BENOT"
              width={120}
              height={48}
              className="h-10 w-auto object-contain brightness-0 invert"
            />
            <p className="font-bebas tracking-widest text-gray-600 text-xs uppercase">
              Camisetas que no piden permiso
            </p>
          </div>

          {/* Center nav */}
          <nav className="flex flex-col items-center gap-3">
            <a
              href="https://t.me/Benotpedidosbot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas tracking-widest text-sm text-gray-400 hover:text-[#FF1E1E] transition-colors duration-200"
            >
              TELEGRAM
            </a>
            <a
              href="https://instagram.com/benotstore"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas tracking-widest text-sm text-gray-400 hover:text-[#FF1E1E] transition-colors duration-200"
            >
              INSTAGRAM
            </a>
            <a
              href="mailto:benotstore@gmail.com"
              className="font-bebas tracking-widest text-sm text-gray-400 hover:text-[#FF1E1E] transition-colors duration-200"
            >
              benotstore@gmail.com
            </a>
          </nav>

          {/* Right: CTA */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <a
              href="/configurador"
              className="btn-red font-bebas tracking-widest text-sm"
            >
              ✦ CONFIGURA LA TUYA
            </a>
            <a
              href="mailto:benotstore@gmail.com"
              className="font-bebas tracking-widest text-gray-600 text-xs hover:text-[#FF1E1E] transition-colors"
            >
              benotstore@gmail.com
            </a>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-bebas tracking-widest text-gray-700 text-xs text-center">
            © 2026 BENOT. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex gap-4">
            {["FRASES", "ANIME", "GUERREROS", "RUNNING"].map((cat) => (
              <a
                key={cat}
                href={`/${cat.toLowerCase()}`}
                className="font-bebas tracking-widest text-xs text-gray-700 hover:text-[#FF1E1E] transition-colors duration-200"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
