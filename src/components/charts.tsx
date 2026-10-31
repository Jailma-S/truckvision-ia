"use client";

import { useState } from "react";
import { formatBRLCompact } from "@/lib/utils";

/** Formato do eixo (funções não podem vir de Server Components). */
export type AxisFormat = "brl" | "percent";

const formatAxis = (format: AxisFormat, v: number) =>
  format === "percent" ? `${Math.round(v)}%` : v === 0 ? "0" : formatBRLCompact(v).replace("R$ ", "");

/*
 * Gráficos de série única em SVG.
 * Regras: um eixo por gráfico, marcas finas com ponta arredondada, grade recessiva,
 * texto em tons de texto (nunca na cor da série) e tooltip ao passar o mouse.
 */

const SERIES = "#3b82f6"; // contraste ≥ 3:1 sobre o cartão azul-marinho
const GRID = "rgb(148 180 255 / 0.10)";
const W = 640;
const H = 240;
// topo com folga para o rótulo direto do último ponto
const M = { top: 30, right: 16, bottom: 28, left: 52 };

interface Point {
  label: string;
  value: number;
  display: string;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / p) * p;
}

function Tooltip({ x, y, title, value }: { x: number; y: number; title: string; value: string }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-[#0b1a3a] px-3 py-2 text-xs shadow-xl"
      style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
    >
      <p className="text-muted capitalize">{title}</p>
      <p className="font-display font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

export function BarChart({ data, label, axis }: { data: Point[]; label: string; axis: AxisFormat }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const band = innerW / data.length;
  const barW = Math.min(44, band * 0.55);
  const y = (v: number) => M.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#93a4c3">
              {formatAxis(axis, t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = M.left + band * i + band / 2;
          const top = y(d.value);
          const h = M.top + innerH - top;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={M.left + band * i} y={M.top} width={band} height={innerH} fill="transparent" />
              {h > 0 && (
                <path
                  // ponta superior arredondada (4px), base reta no eixo
                  d={`M${cx - barW / 2},${top + h} V${top + Math.min(4, h)} Q${cx - barW / 2},${top} ${cx - barW / 2 + 4},${top} H${cx + barW / 2 - 4} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + Math.min(4, h)} V${top + h} Z`}
                  fill={SERIES}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  className="fill-anim"
                  style={{ transformOrigin: `${cx}px ${top + h}px`, animationName: "tv-grow", ["--i" as string]: i }}
                />
              )}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#93a4c3" className="capitalize">
                {d.label}
              </text>
              {i === data.length - 1 && (
                <text x={cx} y={top - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="#e8eefc">
                  {d.display}
                </text>
              )}
            </g>
          );
        })}
        <line x1={M.left} x2={W - M.right} y1={M.top + innerH} y2={M.top + innerH} stroke="rgb(148 180 255 / 0.3)" />
      </svg>
      {hover !== null && (
        <Tooltip
          x={M.left + band * hover + band / 2}
          y={y(data[hover].value) - 6}
          title={data[hover].label}
          value={data[hover].display}
        />
      )}
    </div>
  );
}

export function LineChart({
  data,
  label,
  axis,
  zeroLabel,
}: {
  data: Point[];
  label: string;
  axis: AxisFormat;
  /** rótulo da linha de referência no zero (ex.: ponto de equilíbrio) */
  zeroLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((d) => d.value);
  const max = niceMax(Math.max(0, ...values));
  const min = -niceMax(Math.max(0, -Math.min(0, ...values)));
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const x = (i: number) => M.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => M.top + ((max - v) / (max - min || 1)) * innerH;
  const ticks = Array.from({ length: 5 }, (_, k) => min + ((max - min) * k) / 4);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join("");

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={label}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - M.left) / innerW) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity="0.28" />
            <stop offset="100%" stopColor={SERIES} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#93a4c3">
              {formatAxis(axis, t)}
            </text>
          </g>
        ))}
        {min < 0 && (
          <g>
            <line x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} stroke="#93a4c3" strokeDasharray="4 4" />
            {zeroLabel && (
              <text x={W - M.right} y={y(0) - 6} textAnchor="end" fontSize="11" fill="#93a4c3">
                {zeroLabel}
              </text>
            )}
          </g>
        )}
        <path d={`${line}L${x(data.length - 1)},${y(min)}L${x(0)},${y(min)}Z`} fill="url(#line-area)" />
        <path d={line} fill="none" stroke={SERIES} strokeWidth="2.5" strokeLinejoin="round" className="draw-line" />
        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 6 : 4} fill={SERIES} stroke="#0b1730" strokeWidth="2" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#93a4c3" className="capitalize">
              {d.label}
            </text>
          </g>
        ))}
        <text
          x={x(data.length - 1)}
          y={y(values[values.length - 1]) - 12}
          textAnchor="end"
          fontSize="12"
          fontWeight="700"
          fill="#e8eefc"
        >
          {data[data.length - 1].display}
        </text>
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + innerH} stroke="rgb(148 180 255 / 0.35)" />
        )}
      </svg>
      {hover !== null && (
        <Tooltip x={x(hover)} y={y(data[hover].value) - 10} title={data[hover].label} value={data[hover].display} />
      )}
    </div>
  );
}
