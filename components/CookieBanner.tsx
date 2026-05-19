"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LEGAL } from "@/lib/legal-config";

// ─────────────────────────────────────────────────────────────────────────────
// BANNER DE COOKIES — BENOT
// Guarda preferencias en localStorage bajo la clave STORAGE_KEY.
// Para añadir una nueva categoría de cookies: edita lib/legal-config.ts.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "benot_cookies";

type Prefs = {
  necesarias: true;
  funcionales: boolean;
  // analiticas: boolean;  ← añade aquí si incorporas analytics
};

function loadPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Prefs) : null;
  } catch {
    return null;
  }
}

function savePrefs(prefs: Prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function CookieBanner() {
  const [visible, setVisible]     = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [prefs, setPrefs]         = useState<Prefs>({ necesarias: true, funcionales: true });

  useEffect(() => {
    const saved = loadPrefs();
    if (!saved) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    savePrefs({ necesarias: true, funcionales: true });
    setVisible(false);
  };

  const rejectAll = () => {
    savePrefs({ necesarias: true, funcionales: false });
    setVisible(false);
  };

  const saveConfig = () => {
    savePrefs(prefs);
    setVisible(false);
  };

  // ── Panel de configuración ──────────────────────────────────────────────
  if (configuring) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
        <div className="w-full max-w-lg bg-white border-t-4 border-[#FF1E1E] shadow-2xl p-6 sm:p-8">
          <h2 className="font-bebas tracking-widest text-2xl mb-1">CONFIGURAR COOKIES</h2>
          <p className="text-xs text-gray-500 mb-6">
            Elige qué cookies quieres permitir. Las necesarias no pueden desactivarse.{" "}
            <Link href="/politica-cookies" className="underline hover:text-black">
              Más información
            </Link>
          </p>

          <div className="flex flex-col gap-4 mb-6">
            {LEGAL.cookiesCategorias.map((cat) => {
              const key = cat.id as keyof Omit<Prefs, "necesarias">;
              const checked = cat.obligatoria ? true : prefs[key] ?? false;

              return (
                <label
                  key={cat.id}
                  className={`flex items-start gap-3 p-4 border ${cat.obligatoria ? "border-gray-100 bg-gray-50" : "border-gray-200 cursor-pointer hover:border-black"} transition-colors`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <div
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                        checked ? "bg-black border-black" : "border-gray-300"
                      } ${cat.obligatoria ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {checked && (
                        <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bebas tracking-widest text-sm">{cat.nombre}</span>
                      {cat.obligatoria && (
                        <span className="font-bebas text-[9px] tracking-widest text-gray-400 border border-gray-200 px-1.5 py-0.5">SIEMPRE ACTIVAS</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{cat.descripcion}</p>
                  </div>
                  {!cat.obligatoria && (
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                    />
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={saveConfig}
              className="flex-1 font-bebas tracking-widest text-sm bg-black text-white py-3 hover:bg-[#FF1E1E] transition-colors"
            >
              GUARDAR CONFIGURACIÓN
            </button>
            <button
              onClick={() => setConfiguring(false)}
              className="flex-1 font-bebas tracking-widest text-sm border-2 border-gray-200 text-gray-600 py-3 hover:border-black hover:text-black transition-colors"
            >
              VOLVER
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Banner principal ────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t-4 border-[#FF1E1E] bg-white shadow-[0_-4px_40px_rgba(0,0,0,0.15)] px-5 py-5 sm:px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-bebas tracking-widest text-base text-black mb-0.5">
            🍪 USAMOS COOKIES
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Usamos cookies necesarias para el funcionamiento de la web y cookies de Stripe para el pago seguro.
            Consulta nuestra{" "}
            <Link href="/politica-cookies" className="underline hover:text-black">
              política de cookies
            </Link>{" "}
            y{" "}
            <Link href="/politica-privacidad" className="underline hover:text-black">
              política de privacidad
            </Link>.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={acceptAll}
            className="font-bebas tracking-widest text-sm bg-black text-white px-6 py-2.5 hover:bg-[#FF1E1E] transition-colors whitespace-nowrap"
          >
            ACEPTAR TODO
          </button>
          <button
            onClick={() => setConfiguring(true)}
            className="font-bebas tracking-widest text-sm border-2 border-gray-300 text-gray-700 px-6 py-2.5 hover:border-black hover:text-black transition-colors whitespace-nowrap"
          >
            CONFIGURAR
          </button>
          <button
            onClick={rejectAll}
            className="font-bebas tracking-widest text-sm text-gray-400 px-4 py-2.5 hover:text-black transition-colors whitespace-nowrap text-xs"
          >
            SOLO NECESARIAS
          </button>
        </div>
      </div>
    </div>
  );
}
