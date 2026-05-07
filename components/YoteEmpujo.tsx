export default function YoteEmpujo() {
  return (
    <section id="yoteempujo" className="bg-black">
      <div className="max-w-[1200px] mx-auto">

        {/* Main banner image — clickable to Telegram */}
        <a
          href="https://t.me/Benotpedidosbot"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-opacity duration-300 hover:opacity-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/Webpage%20images/banner%20%23yoteempujo.png"
            alt="#YoTeEmpujo - Edición Solidaria BENOT"
            className="w-full h-auto block"
          />
        </a>

        {/* Secondary action — visit the movement's website */}
        <div className="flex justify-center pb-8">
          <a
            href="https://yoteempujo.es"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/30 text-white font-bebas tracking-widest text-sm px-6 py-3 hover:bg-white hover:text-black transition-all duration-250"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            VISITAR YOTEEMPUJO.ES
          </a>
        </div>

      </div>
    </section>
  );
}
