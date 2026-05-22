"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "INICIO", href: "/#inicio" },
  { label: "FRASES", href: "/frases" },
  { label: "CATEGORÍAS", href: "/#categorias" },
  { label: "#YOTEEMPUJO", href: "/#yoteempujo", red: true },
  { label: "CÓMO FUNCIONA", href: "/#como-funciona" },
  { label: "CONTACTO", href: "/#contacto" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
        scrolled
          ? "shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-gray-100"
          : "border-b border-gray-200"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[68px]">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/logo/logo.png"
            alt="BENOT"
            width={130}
            height={52}
            className="h-11 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`nav-link font-bebas tracking-widest text-[14px] transition-colors hover:text-[#FF1E1E] ${
                l.red ? "text-[#FF1E1E]" : "text-black"
              }`}
            >
              {l.label}
            </Link>
          ))}

          {/* CONFIGURA TU CAMISETA — highlighted link */}
          <Link
            href="/configurador"
            className="font-bebas tracking-widest text-[14px] bg-[#FF1E1E] text-white px-4 py-1.5 hover:bg-black transition-all duration-200"
          >
            ✦ CONFIGURA LA TUYA
          </Link>
        </nav>

        {/* Bot CTAs */}
        <div className="hidden lg:flex items-center gap-2">
          <a
            href="https://t.me/Benotpedidosbot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#2AABEE] text-white font-bebas tracking-widest text-[13px] px-4 py-2.5 transition-all duration-200 hover:bg-[#1a8bc7]"
          >
            <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.01 9.474c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.747z" />
            </svg>
            TELEGRAM
          </a>
          <a
            href="https://wa.me/34604868048"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white font-bebas tracking-widest text-[13px] px-4 py-2.5 transition-all duration-200 hover:bg-[#1da851]"
          >
            <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            WHATSAPP
          </a>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 -mr-2"
          aria-label="Menú"
        >
          <div className="w-6 flex flex-col gap-[5px]">
            <span className={`block h-[2px] bg-black transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block h-[2px] bg-black transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] bg-black transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden bg-white border-t border-gray-100 transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="px-6 py-5 flex flex-col gap-4">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`font-bebas tracking-widest text-xl transition-colors hover:text-[#FF1E1E] ${
                l.red ? "text-[#FF1E1E]" : "text-black"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/configurador"
            onClick={() => setMenuOpen(false)}
            className="font-bebas tracking-widest text-xl bg-[#FF1E1E] text-white px-4 py-2.5 text-center hover:bg-black transition-colors"
          >
            ✦ CONFIGURA LA TUYA
          </Link>
          <a
            href="https://t.me/Benotpedidosbot"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 bg-[#2AABEE] text-white font-bebas tracking-widest text-base px-4 py-2.5 text-center hover:bg-[#1a8bc7] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.01 9.474c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.747z" />
            </svg>
            TELEGRAM
          </a>
          <a
            href="https://wa.me/34604868048"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] text-white font-bebas tracking-widest text-base px-4 py-2.5 text-center hover:bg-[#1da851] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            WHATSAPP
          </a>
        </nav>
      </div>
    </header>
  );
}
