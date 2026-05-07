export default function Hero() {
  return (
    <section id="inicio" className="pt-[68px] bg-white">
      <div className="max-w-[1200px] mx-auto fade-in-up">
        <a
          href="https://t.me/BENOTpedidos"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-opacity duration-300 hover:opacity-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/Webpage%20images/hero%20principal.png"
            alt="BENOT - No Negocio Conmigo - Camisetas que no piden permiso"
            className="w-full h-auto block"
          />
        </a>
      </div>
    </section>
  );
}
