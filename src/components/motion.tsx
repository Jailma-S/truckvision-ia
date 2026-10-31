"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Anima o número até o valor (aceita prefixo e sufixo: "25%", "R$ 12,4 mi").
 * Na primeira vez parte de 0; quando o valor muda, anima do valor anterior até o novo.
 */
export function CountUp({ value, duration = 1200 }: { value: string | number; duration?: number }) {
  const match = String(value).match(/^(\D*?)(\d+(?:,\d+)?)(\D*)$/);
  const prefix = match?.[1] ?? "";
  const target = match ? Number(match[2].replace(",", ".")) : 0;
  const suffix = match?.[3] ?? "";
  const decimals = match?.[2].split(",")[1]?.length ?? 0;
  const [current, setCurrent] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!match) return;
    if (prefersReducedMotion()) {
      from.current = target;
      setCurrent(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setCurrent(origin + (target - origin) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  if (!match) return <>{value}</>;
  return (
    <>
      {prefix}
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
