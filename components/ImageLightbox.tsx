"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  src: string;
  code: string;
  telegramUrl: string;
  whatsappUrl: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;

export default function ImageLightbox({ src, code, telegramUrl, whatsappUrl, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* ── Keyboard: Escape = close, +/- = zoom ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
      if (e.key === "-") zoomBy(-ZOOM_STEP);
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helpers ── */
  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta));
      if (next === MIN_SCALE) setPos({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  /* ── Mouse wheel zoom ── */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  }, [zoomBy]);

  /* ── Mouse drag ── */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [scale]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  /* ── Touch drag ── */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (scale <= 1) return;
    const t = e.touches[0];
    lastTouch.current = { x: t.clientX, y: t.clientY };
  }, [scale]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.current.x;
    const dy = t.clientY - lastTouch.current.y;
    lastTouch.current = { x: t.clientX, y: t.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, [scale]);

  const imgStyle: React.CSSProperties = {
    transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
    transformOrigin: "center center",
    transition: dragging ? "none" : "transform 0.2s cubic-bezier(0.22,1,0.36,1)",
    cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "default",
    userSelect: "none",
  };

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* ── Modal panel ── */}
      <div
        className="relative flex flex-col items-center gap-0 max-w-[92vw] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Top bar: code + controls + close ── */}
        <div className="w-full flex items-center justify-between px-3 py-2 bg-black/90">
          <span className="font-bebas tracking-widest text-white text-sm">{code}</span>

          <div className="flex items-center gap-1">
            {/* Zoom out */}
            <button
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={scale <= MIN_SCALE}
              className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors font-bold text-lg"
              aria-label="Reducir zoom"
            >
              −
            </button>
            {/* Scale indicator */}
            <span className="font-bebas text-xs text-white/60 w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            {/* Zoom in */}
            <button
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={scale >= MAX_SCALE}
              className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors font-bold text-lg"
              aria-label="Ampliar zoom"
            >
              +
            </button>
            {/* Reset */}
            <button
              onClick={reset}
              className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs ml-1"
              aria-label="Restablecer"
              title="Restablecer zoom"
            >
              ↺
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-[#FF1E1E] transition-colors ml-2 text-base font-bold"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Image area ── */}
        <div
          className="relative overflow-hidden bg-[#111] flex items-center justify-center"
          style={{ width: "min(80vw, 680px)", height: "min(72vh, 620px)" }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={code}
            draggable={false}
            style={imgStyle}
            className="max-w-full max-h-full object-contain select-none"
          />

          {/* Zoom hint when at 1x */}
          {scale === 1 && (
            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
              <span className="text-white/30 text-[10px] font-bebas tracking-widest">
                SCROLL O + PARA AMPLIAR
              </span>
            </div>
          )}
        </div>

        {/* ── Bottom bar: CTAs ── */}
        <div className="w-full bg-black/90 px-3 py-2.5 flex items-center justify-between gap-4">
          <span className="text-white/40 text-[10px] font-bebas tracking-widest hidden sm:block">
            ARRASTRA PARA MOVER · SCROLL PARA ZOOM
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas tracking-widest text-xs py-2 px-4 inline-flex items-center gap-1.5 whitespace-nowrap bg-[#2AABEE] hover:bg-[#1a8bc7] text-white transition-colors duration-200"
            >
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.01 9.474c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.747z"/>
              </svg>
              TELEGRAM
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas tracking-widest text-xs py-2 px-4 inline-flex items-center gap-1.5 whitespace-nowrap bg-[#25D366] hover:bg-[#1da851] text-white transition-colors duration-200"
            >
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              WHATSAPP
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
