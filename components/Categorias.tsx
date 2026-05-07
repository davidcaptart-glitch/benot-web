import Link from "next/link";

const cats = [
  {
    src: "/assets/Webpage%20images/Anime_v2.png",   // ← v2 actualizado
    alt: "Anime — BENOT",
    href: "/anime",
  },
  {
    src: "/assets/Webpage%20images/Guerreros.png",
    alt: "Guerreros — BENOT",
    href: "/guerreros",
  },
  {
    src: "/assets/Webpage%20images/Running.png",
    alt: "Running — BENOT",
    href: "/running",
  },
];

export default function Categorias() {
  return (
    <section id="categorias" className="bg-white py-10">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/Webpage%20images/categor%C3%ADas.png"
            alt="Categorías"
            className="h-14 sm:h-16 w-auto object-contain block"
          />
          <span className="font-bebas tracking-widest text-[11px] text-gray-400 uppercase">
            3 categorías
          </span>
        </div>

        {/* Three cards — fixed equal height, object-contain, no cropping */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cats.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="cat-card group block bg-[#111] overflow-hidden"
            >
              <div className="h-[260px] sm:h-[300px] lg:h-[320px] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.src}
                  alt={cat.alt}
                  className="w-full h-full object-contain transition-transform duration-450 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
