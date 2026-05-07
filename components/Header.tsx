"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "INICIO", href: "/#inicio" },
  { label: "FRASES", href: "/frases" },
  { label: "DISEÑOS", href: "/#disenos" },
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

        {/* Logo — slightly bigger */}
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
        <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`nav-link font-bebas tracking-widest text-[14.5px] transition-colors hover:text-[#FF1E1E] ${
                l.red ? "text-[#FF1E1E]" : "text-black"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Telegram CTA */}
        <a
          href="https://t.me/BENOTpedidos"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-2 bg-black text-white font-bebas tracking-widest text-[13.5px] px-5 py-2.5 transition-all duration-200 hover:bg-[#FF1E1E]"
        >
          <Image
            src="/assets/Webpage images/icono telegram.png"
            alt="Telegram"
            width={16}
            height={16}
            className="w-4 h-4 object-contain"
          />
          @BENOTpedidos
        </a>

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
          menuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
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
          <a
            href="https://t.me/BENOTpedidos"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 bg-black text-white font-bebas tracking-widest text-base px-4 py-2.5 text-center hover:bg-[#FF1E1E] transition-colors"
          >
            @BENOTpedidos
          </a>
        </nav>
      </div>
    </header>
  );
}
