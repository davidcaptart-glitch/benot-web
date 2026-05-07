"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  src: string;
  code: string;
  telegramUrl: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;

export default function ImageLightbox({ src, code, telegramUrl, onClose }: Props) {
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

        {/* ── Bottom bar: Telegram CTA ── */}
        <div className="w-full bg-black/90 px-3 py-2.5 flex items-center justify-between gap-4">
          <span className="text-white/40 text-[10px] font-bebas tracking-widest hidden sm:block">
            ARRASTRA PARA MOVER · SCROLL PARA ZOOM
          </span>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-red font-bebas tracking-widest text-xs py-2 px-5 ml-auto inline-flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M22.265 2.428a1.99 1.99 0 0 0-2.021-.338L2.38 9.005C1.17 9.478.363 10.62.363 11.913c0 1.293.808 2.435 2.017 2.908l4.102 1.573 1.56 5.023c.166.534.647.903 1.205.903.33 0 .648-.12.898-.337l2.515-2.24 4.48 3.494c.282.22.624.34.97.34.847 0 1.567-.598 1.717-1.428l3.04-16.77a1.99 1.99 0 0 0-.602-1.951z"/>
            </svg>
            PEDIR ESTE DISEÑO
          </a>
        </div>

      </div>
    </div>
  );
}
