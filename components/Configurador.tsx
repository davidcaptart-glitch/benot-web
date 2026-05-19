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

interface Props {
  frasesByColor: Record<Color, AssetItem[]>;
  disenos: AssetItem[];
}

/* ──────────────────────────────────────────────
   Color config
────────────────────────────────────────────── */
const COLORS: Array<{
  id: Color;
  label: string;
  bgClass: string;
  fillHex: string;
  textClass: string;
  badgeBg: string;
}> = [
  {
    id: "negra",
    label: "NEGRA",
    bgClass: "bg-black",
    fillHex: "#111111",
    textClass: "text-white",
    badgeBg: "bg-black text-white",
  },
  {
    id: "blanca",
    label: "BLANCA",
    bgClass: "bg-white",
    fillHex: "#FFFFFF",
    textClass: "text-black",
    badgeBg: "bg-white text-black border border-gray-300",
  },
  {
    id: "roja",
    label: "ROJA",
    bgClass: "bg-[#FF1E1E]",
    fillHex: "#FF1E1E",
    textClass: "text-white",
    badgeBg: "bg-[#FF1E1E] text-white",
  },
];

/* ──────────────────────────────────────────────
   Telegram order message
────────────────────────────────────────────── */
function buildTelegramUrl(color: Color, fraseCode: string, disenoCode: string) {
  const lines = [
    "🛒 PEDIDO BENOT",
    "",
    `👕 Color: ${color.toUpperCase()}`,
    `✏️ Frase: ${fraseCode}`,
    `🎨 Diseño: ${disenoCode}`,
    "",
    "— Enviado desde benot.store/configurador",
  ];
  return `https://t.me/Benotpedidosbot?text=${encodeURIComponent(lines.join("\n"))}`;
}

/* ──────────────────────────────────────────────
   Step progress bar
────────────────────────────────────────────── */
function StepBar({ current }: { current: number }) {
  const steps = ["COLOR", "FRASE", "DISEÑO", "VISTA PREVIA"];
  return (
    <div className="flex items-start justify-center gap-0 mb-14 select-none">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5 w-16 sm:w-24">
              <div
                className={`w-8 h-8 flex items-center justify-center font-bebas text-sm transition-all duration-300 ${
                  active
                    ? "bg-[#FF1E1E] text-white"
                    : done
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? "✓" : num}
              </div>
              <span
                className={`font-bebas tracking-widest text-[10px] text-center leading-tight hidden sm:block ${
                  active ? "text-black" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-px mt-4 transition-all duration-300 ${
                  done ? "bg-black" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 1 — Color picker
────────────────────────────────────────────── */
function Step1Color({
  selected,
  onSelect,
}: {
  selected: Color | null;
  onSelect: (c: Color) => void;
}) {
  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">01 / 04</p>
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-10">
        ELIGE EL COLOR
      </h2>
      <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-[640px]">
        {COLORS.map((c) => {
          const isSelected = selected === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group flex flex-col items-center gap-3 p-4 sm:p-6 border-2 transition-all duration-200 ${
                isSelected
                  ? "border-[#FF1E1E] shadow-xl"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {/* T-shirt silhouette */}
              <div
                className={`w-full aspect-[1/1] flex items-center justify-center relative transition-all duration-200 ${
                  isSelected ? "scale-105" : "group-hover:scale-102"
                }`}
              >
                <svg viewBox="0 0 120 130" className="w-4/5 drop-shadow-md">
                  <path
                    d="M35 12 L8 42 L28 50 L23 118 L97 118 L92 50 L112 42 L85 12 Q72 22 60 22 Q48 22 35 12 Z"
                    fill={c.fillHex}
                    stroke={c.id === "blanca" ? "#e5e7eb" : "transparent"}
                    strokeWidth="2"
                  />
                </svg>
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#FF1E1E] rounded-full flex items-center justify-center shadow">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                  </div>
                )}
              </div>
              <span
                className={`font-bebas tracking-widest text-xl transition-colors ${
                  isSelected ? "text-[#FF1E1E]" : "text-gray-600 group-hover:text-black"
                }`}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Shared selectable card
────────────────────────────────────────────── */
function SelectCard({
  item,
  isSelected,
  onSelect,
}: {
  item: AssetItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative text-left border-2 transition-all duration-200 overflow-hidden ${
        isSelected
          ? "border-[#FF1E1E] shadow-lg scale-[1.02]"
          : "border-gray-200 hover:border-gray-400"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.code}
        className="w-full h-auto block bg-gray-50"
      />
      <div className="px-2 py-1.5 bg-white border-t border-gray-100">
        <span className="font-bebas tracking-widest text-xs text-gray-500 block truncate">
          {item.code}
        </span>
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
   Step 2 — Frase picker
   Los thumbnails se muestran ya en el color elegido:
   assets/Configurador/frases/{color}/{code}.png
   Al añadir un .png en las 3 carpetas y hacer push → aparece solo.
────────────────────────────────────────────── */
function Step2Frase({
  frasesByColor,
  selected,
  onSelect,
  color,
}: {
  frasesByColor: Record<Color, AssetItem[]>;
  selected: string | null;
  onSelect: (code: string) => void;
  color: Color;
}) {
  const colorCfg = COLORS.find((c) => c.id === color)!;
  const frases = frasesByColor[color];

  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">02 / 04</p>
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl">ELIGE LA FRASE</h2>
        <span className={`font-bebas tracking-widest text-xs px-3 py-1 ${colorCfg.badgeBg}`}>
          CAMISETA {colorCfg.label}
        </span>
      </div>
      {frases.length === 0 ? (
        <p className="font-bebas tracking-widest text-gray-400 text-lg">
          Próximamente — estamos preparando las frases.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {frases.map((item) => (
            <SelectCard
              key={item.code}
              item={item}
              isSelected={selected === item.code}
              onSelect={() => onSelect(item.code)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 3 — Diseño picker
────────────────────────────────────────────── */
function Step3Diseno({
  disenos,
  selected,
  onSelect,
}: {
  disenos: AssetItem[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">03 / 04</p>
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-10">
        ELIGE EL DISEÑO
      </h2>
      {disenos.length === 0 ? (
        <p className="font-bebas tracking-widest text-gray-400 text-lg">
          No hay diseños disponibles todavía.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {disenos.map((item) => (
            <SelectCard
              key={item.code}
              item={item}
              isSelected={selected === item.code}
              onSelect={() => onSelect(item.code)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Shirt mockup (3-layer compositing)
   Rutas:
     base   → assets/Configurador/base/{color}-{frente|detras}.png
     frase  → assets/Configurador/frases/{color}/{code}.png
     diseño → assets/Configurador/disenos/{code}.png
────────────────────────────────────────────── */
function ShirtMockup({
  color,
  fraseCode,
  disenoCode,
  view,
}: {
  color: Color;
  fraseCode: string;
  disenoCode: string;
  view: "frente" | "detras";
}) {
  const base   = `/assets/Configurador/base/${color}-${view}.png`;
  const frase  = `/assets/Configurador/frases/${color}/${fraseCode}.png`;
  const diseno = `/assets/Configurador/disenos/${disenoCode}.png`;

  const shirtBg =
    color === "negra" ? "bg-[#1a1a1a]" : color === "blanca" ? "bg-gray-100" : "bg-red-50";

  return (
    <div className={`relative aspect-[3/4] w-full overflow-hidden ${shirtBg}`}>
      {/* Layer 1 — base shirt */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={base}
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
        onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
      />

      {/* Layer 2 — frase (front only) */}
      {view === "frente" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frase}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
        />
      )}

      {/* Layer 3 — dibujo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={diseno}
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
        onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
      />

      {/* Fallback shirt silhouette (shows through until real images load) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
        <svg viewBox="0 0 120 130" className="w-3/5 opacity-10">
          <path
            d="M35 12 L8 42 L28 50 L23 118 L97 118 L92 50 L112 42 L85 12 Q72 22 60 22 Q48 22 35 12 Z"
            fill={color === "blanca" ? "#666" : color === "negra" ? "#fff" : "#fff"}
          />
        </svg>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 4 — Preview + confirm
────────────────────────────────────────────── */
function Step4Preview({
  color,
  fraseCode,
  disenoCode,
}: {
  color: Color;
  fraseCode: string;
  disenoCode: string;
}) {
  const colorCfg = COLORS.find((c) => c.id === color)!;

  return (
    <div className="fade-in-up">
      <p className="font-bebas tracking-widest text-[#FF1E1E] text-sm mb-1">04 / 04</p>
      <h2 className="font-bebas tracking-widest text-4xl sm:text-5xl mb-10">
        TU CAMISETA
      </h2>

      {/* Front + Back mockup */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-[680px] mb-10">
        <div>
          <p className="font-bebas tracking-widest text-xs text-gray-400 tracking-[0.2em] text-center mb-3">
            DELANTERA
          </p>
          <ShirtMockup
            color={color}
            fraseCode={fraseCode}
            disenoCode={disenoCode}
            view="frente"
          />
        </div>
        <div>
          <p className="font-bebas tracking-widest text-xs text-gray-400 tracking-[0.2em] text-center mb-3">
            TRASERA
          </p>
          <ShirtMockup
            color={color}
            fraseCode={fraseCode}
            disenoCode={disenoCode}
            view="detras"
          />
        </div>
      </div>

      {/* Order summary */}
      <div className="border-2 border-gray-100 p-6 max-w-[680px] mb-6">
        <p className="font-bebas tracking-widest text-[10px] text-gray-400 tracking-[0.25em] mb-5">
          RESUMEN DEL PEDIDO
        </p>
        <div className="grid grid-cols-3 gap-4 divide-x divide-gray-100">
          <div className="pr-4">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-2">COLOR</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 border ${
                  color === "blanca" ? "border-gray-300" : "border-transparent"
                } ${colorCfg.bgClass}`}
              />
              <span className="font-bebas tracking-widest text-xl">{colorCfg.label}</span>
            </div>
          </div>
          <div className="px-4">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-2">FRASE</p>
            <span className="font-bebas tracking-widest text-xl">{fraseCode}</span>
          </div>
          <div className="pl-4">
            <p className="font-bebas tracking-widest text-[10px] text-gray-400 mb-2">DISEÑO</p>
            <span className="font-bebas tracking-widest text-xl">{disenoCode}</span>
          </div>
        </div>
      </div>

      <p className="font-bebas tracking-widest text-xs text-gray-400 max-w-[680px] leading-relaxed">
        AL CONFIRMAR SE ABRIRÁ TELEGRAM CON TU PEDIDO PRECONFIGURADO.
        SOLO TIENES QUE PULSAR ENVIAR — EL BOT LO PROCESARÁ AUTOMÁTICAMENTE.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main wizard
────────────────────────────────────────────── */
export default function Configurador({ frasesByColor, disenos }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [color, setColor] = useState<Color | null>(null);
  const [fraseCode, setFraseCode] = useState<string | null>(null);
  const [disenoCode, setDisenoCode] = useState<string | null>(null);

  const canNext =
    (step === 1 && color !== null) ||
    (step === 2 && fraseCode !== null) ||
    (step === 3 && disenoCode !== null);

  const next = () => setStep((s) => (Math.min(s + 1, 4) as 1 | 2 | 3 | 4));
  const prev = () => setStep((s) => (Math.max(s - 1, 1) as 1 | 2 | 3 | 4));

  // Si el usuario cambia de color, limpia la frase seleccionada
  // (puede que no exista esa frase en el nuevo color)
  const handleColorSelect = (c: Color) => {
    setColor(c);
    setFraseCode(null);
  };

  return (
    <section className="min-h-[calc(100vh-68px)] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <StepBar current={step} />

        {step === 1 && (
          <Step1Color selected={color} onSelect={handleColorSelect} />
        )}
        {step === 2 && (
          <Step2Frase
            frasesByColor={frasesByColor}
            selected={fraseCode}
            onSelect={setFraseCode}
            color={color!}
          />
        )}
        {step === 3 && (
          <Step3Diseno
            disenos={disenos}
            selected={disenoCode}
            onSelect={setDisenoCode}
          />
        )}
        {step === 4 && (
          <Step4Preview
            color={color!}
            fraseCode={fraseCode!}
            disenoCode={disenoCode!}
          />
        )}

        {/* ── Navigation ── */}
        <div className={`flex items-center mt-14 pt-8 border-t border-gray-100 ${step > 1 ? "justify-between" : "justify-end"}`}>
          {step > 1 && (
            <button
              onClick={prev}
              className="font-bebas tracking-widest text-sm text-gray-500 border border-gray-300 px-6 py-3 hover:border-black hover:text-black transition-all duration-200"
            >
              ← VOLVER
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className={`font-bebas tracking-widest text-sm px-10 py-3 transition-all duration-200 ${
                canNext
                  ? "bg-black text-white hover:bg-[#FF1E1E]"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              SIGUIENTE →
            </button>
          ) : (
            <a
              href={buildTelegramUrl(color!, fraseCode!, disenoCode!)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 font-bebas tracking-widest text-sm bg-[#FF1E1E] text-white px-10 py-4 hover:bg-black transition-all duration-200"
            >
              <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.265 2.428a1.99 1.99 0 0 0-2.021-.338L2.38 9.005C1.17 9.478.363 10.62.363 11.913c0 1.293.808 2.435 2.017 2.908l4.102 1.573 1.56 5.023c.166.534.647.903 1.205.903.33 0 .648-.12.898-.337l2.515-2.24 4.48 3.494c.282.22.624.34.97.34.847 0 1.567-.598 1.717-1.428l3.04-16.77a1.99 1.99 0 0 0-.602-1.951z" />
              </svg>
              CONFIRMAR PEDIDO
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
