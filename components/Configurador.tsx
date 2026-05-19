"use client";

import { useState } from "react";

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
export type Color = "negra" | "blanca" | "roja";

export interface AssetItem {
  code: string;
  filename: string;
  src: string;
}

type TipoShirt = "personalizada" | "running" | "yoteempujo";
type AppView =
  | "type-select"
  | "personalizada"
  | "running"
  | "yoteempujo"
  | "size-picker-fixed"
  | "added"
  | "cart";
type StepP = 1 | 2 | 3 | 4 | 5;

/** Mapa talla → cantidad, ej: { L: 2, XL: 1 } */
type SizeMap = Record<string, number>;

interface CartPersonalizada {
  tipo: "personalizada";
  color: Color;
  fraseCode: string;
  disenoCode: string;
  disenoCategoria: string;
  sizes: SizeMap;
}
interface CartFixed {
  tipo: "running" | "yoteempujo";
  code: string;
  src: string;
  sizes: SizeMap;
}
type CartItem = CartPersonalizada | CartFixed;

interface Props {
  frasesByColor: Record<Color, AssetItem[]>;
  disenosByCategory: Record<string, AssetItem[]>;
  runningItems: AssetItem[];
  yoteempujoItems: AssetItem[];
}

/* ──────────────────────────────────────────────
   Constants
────────────────────────────────────────────── */
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const COLORS: Array<{
  id: Color;
  label: string;
  bgClass: string;
  fillHex: string;
  badgeBg: string;
  suffix: string;
}> = [
  { id: "negra",  label: "NEGRA",  bgClass: "bg-black",       fillHex: "#111111", badgeBg: "bg-black text-white",                           suffix: "B" },
  { id: "blanca", label: "BLANCA", bgClass: "bg-white",       fillHex: "#FFFFFF", badgeBg: "bg-white text-black border border-gray-300",     suffix: "W" },
  { id: "roja",   label: "ROJA",   bgClass: "bg-[#FF1E1E]",   fillHex: "#FF1E1E", badgeBg: "bg-[#FF1E1E] text-white",                       suffix: "R" },
];

/* ──────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
function getColorSuffix(color: Color): string {
  return COLORS.find((c) => c.id === color)!.suffix;
}

function totalUnits(sizes: SizeMap): number {
  return Object.values(sizes).reduce((a, b) => a + b, 0);
}

function sizesLabel(sizes: SizeMap): string {
  return Object.entries(sizes)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => `${size}×${qty}`)
    .join(", ");
}

function cartItemLabel(item: CartItem): string {
  const sl = sizesLabel(item.sizes);
  const units = totalUnits(item.sizes);
  const unitStr = `${units} ud${units !== 1 ? "s" : ""}`;
  if (item.tipo === "personalizada") {
    const cfg = COLORS.find((c) => c.id === item.color)!;
    return `Personalizada · ${cfg.label} · ${item.fraseCode} · ${item.disenoCode} · ${sl} (${unitStr})`;
  }
  if (item.tipo === "running") return `Running · ${item.code} · ${sl} (${unitStr})`;
  return `#YoTeEmpujo · ${item.code} · ${sl} (${unitStr})`;
}

/* ──────────────────────────────────────────────
   Telegram deep-link builder
────────────────────────────────────────────── */
function buildTelegramUrl(items: CartItem[]): string {
  const lines: string[] = ["🛒 PEDIDO BENOT", ""];
  items.forEach((item, i) => {
    if (items.length > 1) lines.push(`📦 ARTÍCULO ${i + 1}:`);
    if (item.tipo === "personalizada") {
      const cfg = COLORS.find((c) => c.id === item.color)!;
      lines.push(`👕 Tipo: Personalizada`);
      lines.push(`🎨 Color: ${cfg.label}`);
      lines.push(`✏️ Frase: ${item.fraseCode}`);
      lines.push(`🖌️ Diseño: ${item.disenoCode} (${item.disenoCategoria.toUpperCase()})`);
    } else if (item.tipo === "running") {
      lines.push(`👟 Tipo: Running`);
      lines.push(`🏃 Modelo: ${item.code}`);
    } else {
      lines.push(`❤️ Tipo: Solidaria #YoTeEmpujo`);
      lines.push(`🤝 Modelo: ${item.code}`);
    }
    lines.push(`📏 Tallas: ${sizesLabel(item.sizes)}`);
    lines.push(`🔢 Total: ${totalUnits(item.sizes)} ud${totalUnits(item.sizes) !== 1 ? "s" : ""}`);
    if (i < items.length - 1) lines.push("");
  });
  lines.push("", "— Enviado desde benot.store/configurador");
  return `https://t.me/Benotpedidosbot?text=${encodeURIComponent(lines.join("\n"))}`;
}

/* ──────────────────────────────────────────────
   Floating cart badge
────────────────────────────────────────────── */
function CartBadge({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black text-white font-bebas tracking-widest text-sm px-5 py-3 shadow-2xl hover:bg-[#FF1E1E] transition-all duration-200"
    >
      <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24">
        <path d="M6 2 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zm0 2h12l2 2.67H4L6 4zm0 5h2v3H6V9zm10 0h2v3h-2V9z" />
      </svg>
      CARRITO ({count})
    </button>
  );
}

/* ──────────────────────────────────────────────
   Step bar (personalizada — 5 pasos)
────────────────────────────────────────────── */
function StepBar({ current }: { current: StepP }) {
  const steps = ["COLOR", "FRASE", "DISEÑO", "RESULTADO", "TALLA"];
  return (
    <div className="flex items-start justify-center gap-0 mb-14 select-none">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5 w-12 sm:w-20">
              <div className={`w-8 h-8 flex items-center justify-center font-bebas text-sm transition-all duration-300 ${active ? "bg-[#FF1E1E] text-white" : done ? "bg-black text-white" : "bg-gray-100 text-gray-400"}`}>
                {done ? "✓" : num}
              </div>
              <span className={`font-bebas tracking-widest text-[9px] sm:text-[10px] text-center leading-tight hidden sm:block ${active ? "text-black" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 sm:w-10 h-px mt-4 transition-all duration-300 ${done ? "bg-black" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Selectable card (shared)
────────────────────────────────────────────── */
function SelectCard({ item, isSelected, onSelect }: { item: AssetItem; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`group relative text-left border-2 transition-all duration-200 overflow-hidden ${isSelected ? "border-[#FF1E1E] shadow-lg scale-[1.02]" : "border-gray-200 hover:border-gray-400"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={item.code} className="w-full h-auto block bg-gray-50" />
      <div className="px-2 py-1.5 bg-white border-t border-gray-100">
        <span className="font-bebas tracking-widest text-xs text-gray-500 block truncate">{item.code}</span>
      </div>
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-[#FF1E1E] rounded-full flex items-center justify-center shadow">
          <span className="text-white text-xs leading-none">✓</span>
        </div>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────
   Size selector (reutilizable)
────────────────────────────────────────────── */
function SizeSelector({ sizes, onChange }: { sizes: SizeMap; onChange: (s: SizeMap) => void }) {
  const total = totalUnits(sizes);

  const set = (size: string, delta: number) => {
    const next = Math.max(0, (sizes[size] ?? 0) + delta);
    onChange({ ...sizes, [size]: next });
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-[640px]">
        {SIZES.map((size) => {
          const qty = sizes[size] ?? 0;
          return (
            <div
              key={size}
              className={`flex flex-col items-center gap-2 border-2 p-3 transition-all duration-200 ${qty > 0 ? "border-[#FF1E1E] bg-red-50" : "border-gray-200"}`}
            >
              <span className={`font-bebas tracking-widest text-xl leading-none ${qty > 0 ? "text-[#FF1E1E]" : "text-black"}`}>
                {size}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => set(size, -1)}
                  disabled={qty === 0}
                  className={`w-7 h-7 flex items-center justify-center font-bebas text-base transition-colors ${qty === 0 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-black"}`}
                >
                  −
                </button>
                <span className="font-bebas text-xl w-5 text-center">{qty}</span>
                <button
                  onClick={() => set(size, +1)}
                  className="w-7 h-7 flex items-center justify-center font-bebas text-base bg-black text-white hover:bg-[#FF1E1E] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-5 flex items-center gap-3">
        {total > 0 ? (
          <>
            <span className="font-bebas tracking-widest text-sm text-gray-500">
              TOTAL:
            </span>
            <span className="font-bebas tracking-widest text-xl text-black">
              {total} CAMISETA{total !== 1 ? "S" : ""}
            </span>
            <span className="font-bebas tracking-widest text-xs text-gray-400 ml-1">
              ({sizesLabel(sizes)})
            </span>
          </>
        ) : (
          <span className="font-bebas tracking-widest text-sm text-gray-400">
            SELECCIONA AL MENOS UNA TALLA
          </span>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 0 — Tipo de camiseta
────────────────────────────────────────────── */
function StepTipoSeleccion({ onSelect }: { onSelect: (tipo: TipoShirt) => void }) {
  const types: Array<{ id: TipoShirt; icon: string; title: string; tag: string; desc: string; accent: string }> = [
    { id: "personalizada", icon: "✦", title: "CAMISETA PERSONALIZADA", tag: "ELIGE COLOR · FRASE · DISEÑO", desc: "Configura tu camiseta a medida paso a paso. Tú eliges el color, la frase motivacional y el diseño.", accent: "bg-[#FF1E1E] text-white" },
    { id: "running",       icon: "🏃", title: "CAMISETA RUNNING",       tag: "COLECCIÓN DEPORTIVA",          desc: "Camisetas técnicas BENOT diseñadas para correr. Diseños con identidad propia, listos para pedir.", accent: "bg-black text-white" },
    { id: "yoteempujo",    icon: "❤️", title: "CAMISETA SOLIDARIA",     tag: "#YOTEEMPUJO",                  desc: "Únete al movimiento. Una camiseta, un mensaje, un propósito. 100% solidaria.", accent: "bg-[#FF1E1E] text-white" },
  ];

  return (
    <div className="fade-in-up max-w-[960px]">
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-3">¿QUÉ CAMISETA QUIERES?</h2>
      <p className="font-bebas tracking-widest text-gray-400 text-sm mb-12 tracking-widest">SELECCIONA EL TIPO PARA CONTINUAR</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {types.map((t) => (
          <button key={t.id} onClick={() => onSelect(t.id)} className="group flex flex-col text-left border-2 border-gray-200 hover:border-black transition-all duration-200 hover:shadow-xl">
            <div className={`${t.accent} px-6 py-5`}>
              <p className="font-bebas tracking-widest text-2xl leading-tight mb-0.5">{t.icon} {t.title}</p>
              <p className="font-bebas tracking-widest text-xs opacity-80">{t.tag}</p>
            </div>
            <div className="px-6 py-5 flex-1 flex flex-col justify-between">
              <p className="font-bebas tracking-widest text-sm text-gray-500 leading-relaxed mb-6">{t.desc}</p>
              <span className="font-bebas tracking-widest text-xs text-[#FF1E1E] flex items-center gap-1 group-hover:gap-2 transition-all">SELECCIONAR →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 1 — Color
────────────────────────────────────────────── */
function Step1Color({ selected, onSelect }: { selected: Color | null; onSelect: (c: Color) => void }) {
  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">01 / 05</p>
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-10">ELIGE EL COLOR</h2>
      <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-[640px]">
        {COLORS.map((c) => {
          const isSelected = selected === c.id;
          return (
            <button key={c.id} onClick={() => onSelect(c.id)} className={`group flex flex-col items-center gap-3 p-4 sm:p-6 border-2 transition-all duration-200 ${isSelected ? "border-[#FF1E1E] shadow-xl" : "border-gray-200 hover:border-gray-400"}`}>
              <div className={`w-full aspect-[1/1] flex items-center justify-center relative transition-all duration-200 ${isSelected ? "scale-105" : ""}`}>
                <svg viewBox="0 0 120 130" className="w-4/5 drop-shadow-md">
                  <path d="M35 12 L8 42 L28 50 L23 118 L97 118 L92 50 L112 42 L85 12 Q72 22 60 22 Q48 22 35 12 Z" fill={c.fillHex} stroke={c.id === "blanca" ? "#e5e7eb" : "transparent"} strokeWidth="2" />
                </svg>
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#FF1E1E] rounded-full flex items-center justify-center shadow">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                )}
              </div>
              <span className={`font-bebas tracking-widest text-xl transition-colors ${isSelected ? "text-[#FF1E1E]" : "text-gray-600 group-hover:text-black"}`}>{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 2 — Frase
────────────────────────────────────────────── */
function Step2Frase({ frasesByColor, selected, onSelect, color }: { frasesByColor: Record<Color, AssetItem[]>; selected: string | null; onSelect: (code: string) => void; color: Color }) {
  const colorCfg = COLORS.find((c) => c.id === color)!;
  const frases = frasesByColor[color];
  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">02 / 05</p>
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl">ELIGE LA FRASE</h2>
        <span className={`font-bebas tracking-widest text-xs px-3 py-1 ${colorCfg.badgeBg}`}>CAMISETA {colorCfg.label}</span>
      </div>
      {frases.length === 0 ? (
        <p className="font-bebas tracking-widest text-gray-400 text-lg">Próximamente — estamos preparando las frases para esta variante.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {frases.map((item) => <SelectCard key={item.code} item={item} isSelected={selected === item.code} onSelect={() => onSelect(item.code)} />)}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 3 — Diseño con categorías
────────────────────────────────────────────── */
function Step3Diseno({ disenosByCategory, selected, selectedCategoria, onSelect }: { disenosByCategory: Record<string, AssetItem[]>; selected: string | null; selectedCategoria: string | null; onSelect: (code: string, categoria: string) => void }) {
  const categories = Object.keys(disenosByCategory);
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategoria ?? categories[0] ?? "anime");
  const items = disenosByCategory[activeCategory] ?? [];

  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">03 / 05</p>
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-6">ELIGE EL DISEÑO</h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`font-bebas tracking-widest text-sm px-5 py-2 border-2 transition-all duration-200 ${activeCategory === cat ? "bg-black text-white border-black" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black"}`}>
            {cat.toUpperCase()}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="font-bebas tracking-widest text-gray-400 text-lg">No hay diseños disponibles en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => <SelectCard key={item.code} item={item} isSelected={selected === item.code && selectedCategoria === activeCategory} onSelect={() => onSelect(item.code, activeCategory)} />)}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 4 — Resultado (imágenes pre-compuestas)
────────────────────────────────────────────── */
function Step4Resultado({ color, fraseCode, disenoCode, disenoCategoria }: { color: Color; fraseCode: string; disenoCode: string; disenoCategoria: string }) {
  const colorCfg  = COLORS.find((c) => c.id === color)!;
  const suffix    = getColorSuffix(color);
  const fraseResultSrc  = `/assets/Configurador/Resultado/${fraseCode}.png`;
  const disenoResultSrc = `/assets/Configurador/Resultado/${disenoCode}${suffix}.png`;

  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">04 / 05</p>
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-10">TU CAMISETA</h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-[680px] mb-10">
        <div>
          <p className="font-bebas tracking-widest text-xs text-gray-400 tracking-[0.2em] text-center mb-3">DELANTERA</p>
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fraseResultSrc} alt="Vista delantera" className="absolute inset-0 w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = `/assets/Configurador/base/${color}-frente.png`; }} />
          </div>
        </div>
        <div>
          <p className="font-bebas tracking-widest text-xs text-gray-400 tracking-[0.2em] text-center mb-3">TRASERA</p>
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={disenoResultSrc} alt="Vista trasera" className="absolute inset-0 w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = `/assets/Configurador/base/${color}-detras.png`; }} />
          </div>
        </div>
      </div>
      <div className="border-2 border-gray-100 p-6 max-w-[680px]">
        <p className="font-bebas tracking-widest text-[10px] text-gray-400 tracking-[0.25em] mb-5">RESUMEN</p>
        <div className="grid grid-cols-3 gap-4 divide-x divide-gray-100">
          <div className="pr-4">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-2">COLOR</p>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 ${colorCfg.bgClass} ${color === "blanca" ? "border border-gray-300" : ""}`} />
              <span className="font-bebas tracking-widest text-xl">{colorCfg.label}</span>
            </div>
          </div>
          <div className="px-4">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-2">FRASE</p>
            <span className="font-bebas tracking-widest text-lg break-all">{fraseCode}</span>
          </div>
          <div className="pl-4">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-2">DISEÑO</p>
            <span className="font-bebas tracking-widest text-lg">{disenoCode}</span>
            <br />
            <span className="font-bebas tracking-widest text-[10px] text-gray-400">{disenoCategoria.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 5 — Talla y cantidad
────────────────────────────────────────────── */
function Step5Talla({ sizes, onChange }: { sizes: SizeMap; onChange: (s: SizeMap) => void }) {
  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">05 / 05</p>
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-4">TALLA Y CANTIDAD</h2>
      <p className="font-bebas tracking-widest text-gray-400 text-sm mb-10 tracking-widest">
        PUEDES PEDIR VARIAS TALLAS A LA VEZ — SUMA LAS QUE NECESITES
      </p>
      <SizeSelector sizes={sizes} onChange={onChange} />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Vista Running — catálogo
────────────────────────────────────────────── */
function ViewRunning({ items, onSelect }: { items: AssetItem[]; onSelect: (item: AssetItem) => void }) {
  return (
    <div className="fade-in-up">
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-3">CAMISETAS RUNNING</h2>
      <p className="font-bebas tracking-widest text-gray-400 text-sm mb-10 tracking-widest">
        {items.length} DISEÑOS DISPONIBLES · SELECCIONA UNO PARA ELEGIR TALLA
      </p>
      {items.length === 0 ? (
        <p className="font-bebas tracking-widest text-gray-400 text-lg">Próximamente — colección en preparación.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.code} className="border-2 border-gray-200 hover:border-black transition-all duration-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={item.code} className="w-full h-auto block bg-gray-50" />
              <div className="p-3">
                <p className="font-bebas tracking-widest text-sm text-gray-600 mb-3">{item.code}</p>
                <button onClick={() => onSelect(item)} className="w-full font-bebas tracking-widest text-xs bg-black text-white py-2 hover:bg-[#FF1E1E] transition-colors duration-200">
                  ELEGIR TALLA →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Vista YoTeEmpujo
────────────────────────────────────────────── */
function ViewYoteempujo({ items, onSelect }: { items: AssetItem[]; onSelect: (item: AssetItem) => void }) {
  const item = items[0];
  return (
    <div className="fade-in-up max-w-[680px]">
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-2">CAMISETA SOLIDARIA</h2>
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-xl mb-10 tracking-widest">#YOTEEMPUJO</p>
      {!item ? (
        <p className="font-bebas tracking-widest text-gray-400 text-lg">Próximamente — camiseta en preparación.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src} alt={item.code} className="w-full h-auto block border-2 border-gray-100" />
          <div>
            <p className="font-bebas tracking-widest text-sm text-gray-500 leading-relaxed mb-6">
              ÚNETE AL MOVIMIENTO. UNA CAMISETA, UN MENSAJE, UN PROPÓSITO.
            </p>
            <p className="font-bebas tracking-widest text-xs text-gray-400 mb-1">REFERENCIA</p>
            <p className="font-bebas tracking-widest text-2xl mb-8">{item.code}</p>
            <button onClick={() => onSelect(item)} className="w-full font-bebas tracking-widest text-sm bg-[#FF1E1E] text-white py-4 hover:bg-black transition-colors duration-200">
              ELEGIR TALLA →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Size picker para Running / YoTeEmpujo
   (aparece al seleccionar un artículo fijo)
────────────────────────────────────────────── */
function SizePickerFixed({
  item,
  tipo,
  sizes,
  onSizesChange,
  onAdd,
  onBack,
}: {
  item: AssetItem;
  tipo: "running" | "yoteempujo";
  sizes: SizeMap;
  onSizesChange: (s: SizeMap) => void;
  onAdd: () => void;
  onBack: () => void;
}) {
  const total = totalUnits(sizes);
  return (
    <div className="fade-in-up max-w-[680px]">
      <div className="flex items-start gap-6 mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={item.code} className="w-24 h-auto flex-shrink-0 border-2 border-gray-100" />
        <div>
          <p className="font-bebas tracking-widest text-xs text-gray-400 mb-1">
            {tipo === "running" ? "RUNNING" : "#YOTEEMPUJO"}
          </p>
          <p className="font-bebas tracking-widest text-2xl mb-1">{item.code}</p>
          <p className="font-bebas tracking-widest text-sm text-gray-400">
            SELECCIONA LA TALLA Y CANTIDAD
          </p>
        </div>
      </div>

      <h3 className="font-bebas tracking-widest text-2xl mb-4">TALLA Y CANTIDAD</h3>
      <p className="font-bebas tracking-widest text-gray-400 text-sm mb-8 tracking-widest">
        PUEDES PEDIR VARIAS TALLAS A LA VEZ — SUMA LAS QUE NECESITES
      </p>
      <SizeSelector sizes={sizes} onChange={onSizesChange} />

      <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
        <button onClick={onBack} className="font-bebas tracking-widest text-sm text-gray-500 border border-gray-300 px-6 py-3 hover:border-black hover:text-black transition-all duration-200">
          ← VOLVER
        </button>
        <button
          onClick={onAdd}
          disabled={total === 0}
          className={`font-bebas tracking-widest text-sm px-10 py-3 flex items-center gap-2 transition-all duration-200 ${total > 0 ? "bg-[#FF1E1E] text-white hover:bg-black" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
        >
          <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
            <path d="M6 2 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zm0 2h12l2 2.67H4L6 4zm0 5h2v3H6V9zm10 0h2v3h-2V9z" />
          </svg>
          AÑADIR AL CARRITO
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Pantalla "Añadido al carrito"
────────────────────────────────────────────── */
function AddedScreen({ item, onAddMore, onViewCart }: { item: CartItem; onAddMore: () => void; onViewCart: () => void }) {
  return (
    <div className="fade-in-up max-w-[560px] text-center mx-auto py-8">
      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-3xl">✓</span>
      </div>
      <h2 className="font-bebas tracking-widest text-3xl sm:text-4xl mb-3">¡AÑADIDO AL CARRITO!</h2>
      <p className="font-bebas tracking-widest text-gray-500 text-sm mb-1">{cartItemLabel(item)}</p>
      <p className="font-bebas tracking-widest text-gray-400 text-xs mb-12">¿QUIERES ALGO MÁS?</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onAddMore} className="font-bebas tracking-widest text-sm border-2 border-gray-300 text-gray-700 px-8 py-3 hover:border-black hover:text-black transition-all duration-200">
          + AÑADIR OTRA CAMISETA
        </button>
        <button onClick={onViewCart} className="font-bebas tracking-widest text-sm bg-[#FF1E1E] text-white px-8 py-3 hover:bg-black transition-all duration-200">
          VER CARRITO Y FINALIZAR →
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Vista carrito
────────────────────────────────────────────── */
function CartView({ cart, onRemove, onAddMore }: { cart: CartItem[]; onRemove: (idx: number) => void; onAddMore: () => void }) {
  return (
    <div className="fade-in-up max-w-[680px]">
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-10">TU CARRITO</h2>

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-bebas tracking-widest text-gray-400 text-xl mb-6">TU CARRITO ESTÁ VACÍO</p>
          <button onClick={onAddMore} className="font-bebas tracking-widest text-sm bg-black text-white px-10 py-3 hover:bg-[#FF1E1E] transition-colors">
            AÑADIR CAMISETA
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-8">
            {cart.map((item, i) => {
              const total = totalUnits(item.sizes);
              return (
                <div key={i} className="flex items-start gap-4 border-2 border-gray-100 p-4">
                  {/* Icon / thumbnail */}
                  {item.tipo === "personalizada" ? (
                    <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gray-50">
                      <svg viewBox="0 0 120 130" className="w-10">
                        <path d="M35 12 L8 42 L28 50 L23 118 L97 118 L92 50 L112 42 L85 12 Q72 22 60 22 Q48 22 35 12 Z" fill={COLORS.find((c) => c.id === item.color)!.fillHex} stroke={item.color === "blanca" ? "#e5e7eb" : "transparent"} strokeWidth="2" />
                      </svg>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.src} alt={item.code} className="w-14 h-14 object-cover flex-shrink-0 bg-gray-50" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-0.5">
                      {item.tipo === "personalizada" ? "PERSONALIZADA" : item.tipo === "running" ? "RUNNING" : "#YOTEEMPUJO"}
                    </p>
                    {item.tipo === "personalizada" && (
                      <p className="font-bebas tracking-widest text-sm">
                        {COLORS.find((c) => c.id === item.color)!.label} · {item.fraseCode} · {item.disenoCode}
                      </p>
                    )}
                    {item.tipo !== "personalizada" && (
                      <p className="font-bebas tracking-widest text-sm">{item.code}</p>
                    )}
                    <p className="font-bebas tracking-widest text-xs text-[#FF1E1E] mt-1">
                      📏 {sizesLabel(item.sizes)} · {total} ud{total !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <button onClick={() => onRemove(i)} className="flex-shrink-0 font-bebas tracking-widest text-xs text-gray-400 hover:text-[#FF1E1E] transition-colors px-2 py-1 border border-transparent hover:border-[#FF1E1E]" aria-label="Eliminar">
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Total general */}
          <div className="border-t-2 border-gray-100 pt-4 mb-8 flex items-center justify-between">
            <span className="font-bebas tracking-widest text-sm text-gray-500">TOTAL PRENDAS</span>
            <span className="font-bebas tracking-widest text-2xl">
              {cart.reduce((acc, item) => acc + totalUnits(item.sizes), 0)} CAMISETAS
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button onClick={onAddMore} className="font-bebas tracking-widest text-sm border-2 border-gray-300 text-gray-600 px-6 py-3 hover:border-black hover:text-black transition-all duration-200">
              + AÑADIR OTRA CAMISETA
            </button>
          </div>

          <div className="border-t-2 border-gray-100 pt-8">
            <p className="font-bebas tracking-widest text-xs text-gray-400 mb-4 leading-relaxed">
              AL CONFIRMAR SE ABRIRÁ TELEGRAM CON TU PEDIDO COMPLETO. EL BOT LO PROCESARÁ DIRECTAMENTE Y PROCEDERÁ AL PAGO.
            </p>
            <a
              href={buildTelegramUrl(cart)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-bebas tracking-widest text-sm bg-[#FF1E1E] text-white px-10 py-4 hover:bg-black transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.265 2.428a1.99 1.99 0 0 0-2.021-.338L2.38 9.005C1.17 9.478.363 10.62.363 11.913c0 1.293.808 2.435 2.017 2.908l4.102 1.573 1.56 5.023c.166.534.647.903 1.205.903.33 0 .648-.12.898-.337l2.515-2.24 4.48 3.494c.282.22.624.34.97.34.847 0 1.567-.598 1.717-1.428l3.04-16.77a1.99 1.99 0 0 0-.602-1.951z" />
              </svg>
              FINALIZAR PEDIDO EN TELEGRAM
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Wizard principal
────────────────────────────────────────────── */
export default function Configurador({ frasesByColor, disenosByCategory, runningItems, yoteempujoItems }: Props) {

  /* ── App view ── */
  const [view, setView] = useState<AppView>("type-select");

  /* ── Personalizada ── */
  const [step, setStep]                   = useState<StepP>(1);
  const [color, setColor]                 = useState<Color | null>(null);
  const [fraseCode, setFraseCode]         = useState<string | null>(null);
  const [disenoCode, setDisenoCode]       = useState<string | null>(null);
  const [disenoCategoria, setDisenoCategoria] = useState<string | null>(null);
  const [personSizes, setPersonSizes]     = useState<SizeMap>({});

  /* ── Fixed item (running / yoteempujo) ── */
  const [pendingItem, setPendingItem]     = useState<AssetItem | null>(null);
  const [pendingTipo, setPendingTipo]     = useState<"running" | "yoteempujo" | null>(null);
  const [fixedSizes, setFixedSizes]       = useState<SizeMap>({});

  /* ── Cart ── */
  const [cart, setCart]         = useState<CartItem[]>([]);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);

  /* ──────── Helpers ──────── */
  const resetPersonalizada = () => {
    setStep(1); setColor(null); setFraseCode(null);
    setDisenoCode(null); setDisenoCategoria(null); setPersonSizes({});
  };

  const goTypeSelect = () => {
    setView("type-select");
    resetPersonalizada();
    setPendingItem(null); setPendingTipo(null); setFixedSizes({});
  };

  const handleTipoSelect = (tipo: TipoShirt) => {
    if (tipo === "personalizada") { resetPersonalizada(); setView("personalizada"); }
    else if (tipo === "running")  setView("running");
    else                          setView("yoteempujo");
  };

  const handleColorSelect = (c: Color) => {
    setColor(c);
    setFraseCode(null); // reset frase on color change
  };

  const handleDisenoSelect = (code: string, categoria: string) => {
    setDisenoCode(code); setDisenoCategoria(categoria);
  };

  /* Add personalizada to cart */
  const addPersonalizadaToCart = () => {
    if (!color || !fraseCode || !disenoCode || !disenoCategoria) return;
    const item: CartPersonalizada = { tipo: "personalizada", color, fraseCode, disenoCode, disenoCategoria, sizes: personSizes };
    setCart((p) => [...p, item]);
    setLastAdded(item);
    setView("added");
  };

  /* Select fixed item → go to size picker */
  const handleFixedSelect = (tipo: "running" | "yoteempujo", asset: AssetItem) => {
    setPendingItem(asset); setPendingTipo(tipo); setFixedSizes({});
    setView("size-picker-fixed");
  };

  /* Add fixed item to cart */
  const addFixedToCart = () => {
    if (!pendingItem || !pendingTipo) return;
    const item: CartFixed = { tipo: pendingTipo, code: pendingItem.code, src: pendingItem.src, sizes: fixedSizes };
    setCart((p) => [...p, item]);
    setLastAdded(item);
    setView("added");
  };

  const removeFromCart = (idx: number) => setCart((p) => p.filter((_, i) => i !== idx));

  /* ── Personalizada nav ── */
  const canNext =
    (step === 1 && color !== null) ||
    (step === 2 && fraseCode !== null) ||
    (step === 3 && disenoCode !== null) ||
    (step === 4) ||
    (step === 5 && totalUnits(personSizes) > 0);

  const next = () => setStep((s) => Math.min(s + 1, 5) as StepP);
  const prev = () => {
    if (step === 1) goTypeSelect();
    else setStep((s) => Math.max(s - 1, 1) as StepP);
  };

  /* ──────── Render ──────── */
  return (
    <section className="min-h-[calc(100vh-68px)] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12">

        {/* TYPE SELECTION */}
        {view === "type-select" && (
          <StepTipoSeleccion onSelect={handleTipoSelect} />
        )}

        {/* PERSONALIZADA FLOW */}
        {view === "personalizada" && (
          <>
            <StepBar current={step} />

            {step === 1 && <Step1Color selected={color} onSelect={handleColorSelect} />}
            {step === 2 && <Step2Frase frasesByColor={frasesByColor} selected={fraseCode} onSelect={setFraseCode} color={color!} />}
            {step === 3 && <Step3Diseno disenosByCategory={disenosByCategory} selected={disenoCode} selectedCategoria={disenoCategoria} onSelect={handleDisenoSelect} />}
            {step === 4 && <Step4Resultado color={color!} fraseCode={fraseCode!} disenoCode={disenoCode!} disenoCategoria={disenoCategoria!} />}
            {step === 5 && <Step5Talla sizes={personSizes} onChange={setPersonSizes} />}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-14 pt-8 border-t border-gray-100">
              <button onClick={prev} className="font-bebas tracking-widest text-sm text-gray-500 border border-gray-300 px-6 py-3 hover:border-black hover:text-black transition-all duration-200">
                ← VOLVER
              </button>

              {step < 5 ? (
                <button onClick={next} disabled={!canNext} className={`font-bebas tracking-widest text-sm px-10 py-3 transition-all duration-200 ${canNext ? "bg-black text-white hover:bg-[#FF1E1E]" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                  SIGUIENTE →
                </button>
              ) : (
                <button
                  onClick={addPersonalizadaToCart}
                  disabled={totalUnits(personSizes) === 0}
                  className={`font-bebas tracking-widest text-sm px-10 py-3 flex items-center gap-2 transition-all duration-200 ${totalUnits(personSizes) > 0 ? "bg-[#FF1E1E] text-white hover:bg-black" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
                >
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M6 2 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zm0 2h12l2 2.67H4L6 4zm0 5h2v3H6V9zm10 0h2v3h-2V9z" />
                  </svg>
                  AÑADIR AL CARRITO
                </button>
              )}
            </div>
          </>
        )}

        {/* RUNNING */}
        {view === "running" && (
          <>
            <div className="mb-8">
              <button onClick={goTypeSelect} className="font-bebas tracking-widest text-sm text-gray-500 border border-gray-300 px-6 py-3 hover:border-black hover:text-black transition-all duration-200">
                ← VOLVER
              </button>
            </div>
            <ViewRunning items={runningItems} onSelect={(item) => handleFixedSelect("running", item)} />
          </>
        )}

        {/* YOTEEMPUJO */}
        {view === "yoteempujo" && (
          <>
            <div className="mb-8">
              <button onClick={goTypeSelect} className="font-bebas tracking-widest text-sm text-gray-500 border border-gray-300 px-6 py-3 hover:border-black hover:text-black transition-all duration-200">
                ← VOLVER
              </button>
            </div>
            <ViewYoteempujo items={yoteempujoItems} onSelect={(item) => handleFixedSelect("yoteempujo", item)} />
          </>
        )}

        {/* SIZE PICKER — running / yoteempujo */}
        {view === "size-picker-fixed" && pendingItem && pendingTipo && (
          <SizePickerFixed
            item={pendingItem}
            tipo={pendingTipo}
            sizes={fixedSizes}
            onSizesChange={setFixedSizes}
            onAdd={addFixedToCart}
            onBack={() => setView(pendingTipo)}
          />
        )}

        {/* ADDED CONFIRMATION */}
        {view === "added" && lastAdded && (
          <AddedScreen item={lastAdded} onAddMore={goTypeSelect} onViewCart={() => setView("cart")} />
        )}

        {/* CART */}
        {view === "cart" && (
          <>
            <div className="mb-8">
              <button onClick={goTypeSelect} className="font-bebas tracking-widest text-sm text-gray-500 border border-gray-300 px-6 py-3 hover:border-black hover:text-black transition-all duration-200">
                ← SEGUIR COMPRANDO
              </button>
            </div>
            <CartView cart={cart} onRemove={removeFromCart} onAddMore={goTypeSelect} />
          </>
        )}

      </div>

      {/* Floating cart badge */}
      {view !== "cart" && (
        <CartBadge count={cart.length} onClick={() => setView("cart")} />
      )}
    </section>
  );
}
