"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Anima números de 0 até o valor (aceita sufixo, ex.: "25%"). Texto sem número é exibido como está. */
export function CountUp({ value, duration = 1200 }: { value: string | number; duration?: number }) {
  const match = String(value).match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  const target = match ? Number(match[1].replace(",", ".")) : 0;
  const suffix = match ? match[2] : "";
  const decimals = match?.[1].match(/[.,](\d+)/)?.[1].length ?? 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!match) return;
    if (prefersReducedMotion()) {
      setCurrent(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setCurrent(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  if (!match) return <>{value}</>;
  return (
    <>
      {current.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
}

/** Inclinação 3D suave e holofote que acompanha o mouse. */
export function Tilt({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateY(-2px)`;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("tilt relative rounded-2xl", className)}>
      {children}
      <div className="tilt-spot" aria-hidden />
    </div>
  );
}
