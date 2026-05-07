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
              href="https://t.me/BENOTpedidos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas tracking-widest text-sm text-gray-400 hover:text-[#FF1E1E] transition-colors duration-200"
            >
              TELEGRAM
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas tracking-widest text-sm text-gray-400 hover:text-[#FF1E1E] transition-colors duration-200"
            >
              INSTAGRAM
            </a>
            <a
              href="/#contacto"
              className="font-bebas tracking-widest text-sm text-gray-400 hover:text-[#FF1E1E] transition-colors duration-200"
            >
              CONTACTO
            </a>
          </nav>

          {/* Right: CTA */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <a
              href="https://t.me/BENOTpedidos"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-red font-bebas tracking-widest text-sm"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M22.265 2.428a1.99 1.99 0 0 0-2.021-.338L2.38 9.005C1.17 9.478.363 10.62.363 11.913c0 1.293.808 2.435 2.017 2.908l4.102 1.573 1.56 5.023c.166.534.647.903 1.205.903.33 0 .648-.12.898-.337l2.515-2.24 4.48 3.494c.282.22.624.34.97.34.847 0 1.567-.598 1.717-1.428l3.04-16.77a1.99 1.99 0 0 0-.602-1.951z"/>
              </svg>
              HACER MI PEDIDO
            </a>
            <span className="font-bebas tracking-widest text-gray-600 text-xs">
              @BENOTpedidos
            </span>
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
