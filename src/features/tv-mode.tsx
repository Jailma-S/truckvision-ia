"use client";

import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, Truck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TvSlide {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const SLIDE_SECONDS = 20;

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
}

/** Carrossel de tela cheia para sala de vendas e reuniões: troca de tela sozinho. */
export function TvMode({ slides }: { slides: TvSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [clock, setClock] = useState("");

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  // troca automática
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(index + 1), SLIDE_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [index, paused, go]);

  // relógio
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Fortaleza",
        }),
      );
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  // teclado: ← → navegam, espaço pausa, F tela cheia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [index, go]);

  const slide = slides[index];

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* luzes de fundo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb absolute top-[-15%] left-[15%] h-[36rem] w-[36rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="orb-slow absolute right-[-10%] bottom-[-10%] h-[30rem] w-[30rem] rounded-full bg-secondary/15 blur-[120px]" />
      </div>

      {/* barra superior */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050b1a]/80 backdrop-blur">
        <div className="flex items-center gap-4 px-6 py-3">
          <span className="tile-3d flex h-10 w-10 items-center justify-center rounded-xl">
            <Truck className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-white">TruckVision IA</p>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-emerald-300 uppercase">
              <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" /> Ao vivo · Maranhão
            </p>
          </div>

          <div className="mx-auto hidden text-center md:block">
            <p className="font-display text-xl font-bold text-white">{slide.title}</p>
            <p className="text-xs text-muted">{slide.subtitle}</p>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-3 hidden text-sm text-slate-300 capitalize tabular-nums sm:block">{clock}</span>
            <TvButton label="Anterior (←)" onClick={() => go(index - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </TvButton>
            <TvButton label={paused ? "Continuar (espaço)" : "Pausar (espaço)"} onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </TvButton>
            <TvButton label="Próxima (→)" onClick={() => go(index + 1)}>
              <ChevronRight className="h-4 w-4" />
            </TvButton>
            <TvButton label={fullscreen ? "Sair da tela cheia (F)" : "Tela cheia (F)"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </TvButton>
            <Link
              href="/"
              aria-label="Sair do Modo TV"
              title="Sair do Modo TV"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* progresso: um segmento por tela */}
        <div className="flex gap-1 px-6 pb-2">
          {slides.map((s, i) => (
            <button
              key={s.title}
              onClick={() => go(i)}
              aria-label={`Ir para ${s.title}`}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"
            >
              <span
                key={`${index}-${paused}`}
                className={cn(
                  "block h-full rounded-full bg-accent shadow-[0_0_8px_rgb(110_168_255)]",
                  i < index && "w-full",
                  i > index && "w-0",
                  i === index && (paused ? "w-1/2 opacity-60" : "tv-progress"),
                )}
                style={i === index && !paused ? { animationDuration: `${SLIDE_SECONDS}s` } : undefined}
              />
            </button>
          ))}
        </div>
      </header>

      {/* tela atual: remonta a cada troca para repetir as animações de entrada */}
      <main key={index} className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-6">
        <div className="mb-4 md:hidden">
          <p className="font-display text-xl font-bold text-white">{slide.title}</p>
          <p className="text-xs text-muted">{slide.subtitle}</p>
        </div>
        {slide.content}
      </main>
    </div>
  );
}

function TvButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  );
}
