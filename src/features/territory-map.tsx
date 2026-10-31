"use client";

import { Building2, MapPin, Target, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IacScore, PriorityBadge } from "@/components/domain";
import { CardTitle } from "@/components/ui";
import type { TerritoryPoint } from "@/application/use-cases/territory";
import type { Priority } from "@/domain/entities";
import { MA_MUNICIPALITIES, MA_STATE_PATH, MA_VIEWBOX } from "@/infrastructure/geo/maranhao-geo";
import { cn, formatBRLCompact } from "@/lib/utils";

const COLOR: Record<Priority | "none", string> = {
  alta: "#34d399",
  media: "#fbbf24",
  exploratoria: "#6ea8ff",
  none: "#6ea8ff",
};

export function TerritoryMap({ points }: { points: TerritoryPoint[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const byCode = useMemo(() => new Map(points.map((p) => [p.code, p])), [points]);
  const maxCount = Math.max(1, ...points.map((p) => p.companies.length));
  const current = selected ? byCode.get(selected) : null;
  const hovered = hover ? (byCode.get(hover) ?? MA_MUNICIPALITIES.find((m) => m.code === hover)) : null;
  // pontos menores por cima dos maiores
  const drawOrder = [...points].sort((a, b) => b.companies.length - a.companies.length);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {/* Mapa */}
      <section
        data-tour="map"
        className="card-3d card-glow reveal relative overflow-hidden rounded-2xl p-3 sm:p-5"
      >
        <div aria-hidden className="orb pointer-events-none absolute top-10 left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <CardTitle>Maranhão · oportunidades por município</CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <Legend color={COLOR.alta} label="Alta" />
            <Legend color={COLOR.media} label="Média" />
            <Legend color={COLOR.exploratoria} label="Exploratória" />
          </div>
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${MA_VIEWBOX.width} ${MA_VIEWBOX.height}`}
            className="mx-auto block max-h-[72vh] w-full"
            role="img"
            aria-label="Mapa do Maranhão com oportunidades por município"
          >
            <defs>
              {(Object.keys(COLOR) as (keyof typeof COLOR)[]).map((k) => (
                <radialGradient key={k} id={`heat-${k}`}>
                  <stop offset="0%" stopColor={COLOR[k]} stopOpacity="0.75" />
                  <stop offset="45%" stopColor={COLOR[k]} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={COLOR[k]} stopOpacity="0" />
                </radialGradient>
              ))}
              <linearGradient id="ma-surface" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14306b" />
                <stop offset="100%" stopColor="#0a1a3d" />
              </linearGradient>
              <filter id="ma-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="ma-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
            </defs>

            {/* relevo 3D: sombra projetada + lateral do bloco */}
            <path d={MA_STATE_PATH} transform="translate(14 26)" fill="#000" opacity="0.55" filter="url(#ma-shadow)" />
            <path d={MA_STATE_PATH} transform="translate(0 12)" fill="#061232" />
            <path d={MA_STATE_PATH} transform="translate(0 6)" fill="#0a1d4a" />
            <path d={MA_STATE_PATH} fill="url(#ma-surface)" />

            {/* municípios */}
            {MA_MUNICIPALITIES.map((m) => {
              const p = byCode.get(m.code);
              const isSel = selected === m.code;
              return (
                <path
                  key={m.code}
                  d={m.d}
                  onMouseEnter={() => setHover(m.code)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(p ? (isSel ? null : m.code) : null)}
                  className={cn("transition-[fill] duration-200", p && "cursor-pointer")}
                  fill={
                    isSel
                      ? "rgb(0 87 255 / 0.55)"
                      : p
                        ? hover === m.code
                          ? "rgb(0 87 255 / 0.42)"
                          : "rgb(0 87 255 / 0.24)"
                        : hover === m.code
                          ? "rgb(255 255 255 / 0.06)"
                          : "transparent"
                  }
                  stroke="rgb(110 168 255 / 0.16)"
                  strokeWidth="0.7"
                />
              );
            })}

            {/* contorno iluminado do estado */}
            <path d={MA_STATE_PATH} fill="none" stroke="#6ea8ff" strokeWidth="2.2" opacity="0.9" filter="url(#ma-glow)" pointerEvents="none" />

            {/* calor */}
            <g pointerEvents="none" style={{ mixBlendMode: "screen" }}>
              {drawOrder.map((p) => (
                <circle
                  key={`heat-${p.code}`}
                  cx={p.x}
                  cy={p.y}
                  r={40 + (p.companies.length / maxCount) * 60}
                  fill={`url(#heat-${p.topPriority ?? "none"})`}
                />
              ))}
            </g>

            {/* pontos pulsantes */}
            {drawOrder.map((p, i) => {
              const color = COLOR[p.topPriority ?? "none"];
              const r = 7 + (p.companies.length / maxCount) * 6;
              const isSel = selected === p.code;
              return (
                <g
                  key={p.code}
                  className="cursor-pointer"
                  onClick={() => setSelected(isSel ? null : p.code)}
                  onMouseEnter={() => setHover(p.code)}
                  onMouseLeave={() => setHover(null)}
                >
                  {[0, 1].map((k) => (
                    <circle
                      key={k}
                      cx={p.x}
                      cy={p.y}
                      r={r}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      className="map-ripple"
                      style={{ animationDelay: `${(i * 0.45 + k * 1.2) % 2.4}s` }}
                    />
                  ))}
                  <circle cx={p.x} cy={p.y} r={r + 10} fill="transparent" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSel ? r + 3 : r}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={isSel ? 3 : 2}
                    style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                  />
                  <text
                    x={p.x + r + 8}
                    y={p.y + 6}
                    className="font-display"
                    fontSize="21"
                    fontWeight="700"
                    fill="#fff"
                    stroke="#050b1a"
                    strokeWidth="4"
                    paintOrder="stroke"
                  >
                    {p.name}
                    <tspan fill={color} dx="6">
                      {p.companies.length}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </svg>

          {hovered && hovered.code !== selected && (
            <div className="pointer-events-none absolute top-2 left-2 rounded-lg border border-border bg-[#0b1a3a]/95 px-3 py-2 text-xs shadow-lg">
              <p className="font-semibold text-white">{hovered.name}</p>
              {"companies" in hovered ? (
                <p className="text-muted">
                  {hovered.companies.length} empresa(s) · {formatBRLCompact(hovered.pipeline)} · clique para ver
                </p>
              ) : (
                <p className="text-muted">Sem empresas monitoradas</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Painel lateral */}
      <aside className="card-3d reveal rounded-2xl p-5" style={{ ["--i" as string]: 2 }}>
        {current ? (
          <div key={current.code} className="toast-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
                  <MapPin className="h-3.5 w-3.5" /> Município
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">{current.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-white" aria-label="Fechar município">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Empresas" value={current.companies.length} />
              <Stat label="Oportunidades" value={current.opportunities} />
              <Stat label="Alta prioridade" value={current.highPriority} accent />
              <Stat label="Pipeline (fictício)" value={formatBRLCompact(current.pipeline)} />
            </div>

            <p className="mt-5 mb-2 text-xs font-medium text-muted">Empresas no município</p>
            <ul className="space-y-2">
              {current.companies.map((c, i) => (
                <li key={c.id} className="reveal" style={{ ["--i" as string]: i }}>
                  <Link
                    href={`/empresas/${c.id}`}
                    className="lift flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 hover:border-accent/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{c.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <PriorityBadge priority={c.priority} />
                      </div>
                    </div>
                    {c.iac !== null && <IacScore score={c.iac} className="[&>div]:w-14" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <CardTitle>Municípios em destaque</CardTitle>
            <p className="mt-1 text-sm text-slate-300">Clique em um ponto do mapa ou na lista para ver as empresas.</p>
            <ul className="mt-4 space-y-2">
              {points.map((p, i) => (
                <li key={p.code} className="reveal" style={{ ["--i" as string]: i + 3 }}>
                  <button
                    onClick={() => setSelected(p.code)}
                    onMouseEnter={() => setHover(p.code)}
                    onMouseLeave={() => setHover(null)}
                    className="lift flex w-full items-center gap-3 rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 text-left hover:border-accent/30"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: COLOR[p.topPriority ?? "none"], boxShadow: `0 0 10px ${COLOR[p.topPriority ?? "none"]}` }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{p.name}</span>
                      <span className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {p.companies.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" /> {p.highPriority} alta
                        </span>
                      </span>
                    </span>
                    <span className="font-display text-sm font-bold text-emerald-300 tabular-nums">
                      {formatBRLCompact(p.pipeline)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </span>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-black/20 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={cn("font-display mt-1 text-xl font-bold tabular-nums", accent ? "text-emerald-300" : "text-white")}>{value}</p>
    </div>
  );
}
