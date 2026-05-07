const steps = [
  {
    num: "01", title: "ELIGE DISEÑO", desc: "Explora categorías y diseños.",
    Icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M9 21V9"/></svg>,
  },
  {
    num: "02", title: "ELIGE FRASE", desc: "Elige una frase o crea la tuya.",
    Icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    num: "03", title: "ELIGE TALLA", desc: "Talla, color y cantidad.",
    Icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  },
  {
    num: "04", title: "HAZ TU PEDIDO", desc: "Escríbenos por @BENOTpedidos.",
    Icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  },
  {
    num: "05", title: "CONFIRMAMOS", desc: "Te confirmamos diseño y precio.",
    Icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  {
    num: "06", title: "LO RECIBES", desc: "Producimos y enviamos a casa.",
    Icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 8h14M5 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0M5 8l-1 12h16L19 8M10 12v4M14 12v4"/></svg>,
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-white py-10">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Title — legible size */}
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/Webpage%20images/c%C3%B3mo%20funciona.png"
            alt="Cómo funciona BENOT"
            className="h-14 sm:h-16 w-auto object-contain block"
          />
        </div>

        {/* Steps grid — compact, clean */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-gray-100 border border-gray-100">
          {steps.map((step) => (
            <div
              key={step.num}
              className="px-4 py-5 flex flex-col items-center text-center gap-2 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 border border-gray-200 flex items-center justify-center text-black">
                <step.Icon />
              </div>
              <span className="font-bebas text-[#FF1E1E] text-[10px] tracking-widest">{step.num}</span>
              <h3 className="font-bebas text-[12px] tracking-wide text-black leading-tight">{step.title}</h3>
              <p className="text-[10px] text-gray-400 leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
