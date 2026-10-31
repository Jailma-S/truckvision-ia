"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PurchaseWindow, WindowStatus } from "@/application/use-cases/purchase-window";
import { PriorityBadge } from "@/components/domain";
import { cn, formatBRLCompact, formatDate } from "@/lib/utils";

const STATUS: Record<WindowStatus, { label: string; bar: string; chip: string }> = {
  agora: {
    label: "Na janela agora",
    bar: "from-emerald-500 to-emerald-300 shadow-[0_0_16px_rgb(52_211_153/0.65)]",
    chip: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
  },
  em_breve: {
    label: "Abre em até 30 dias",
    bar: "from-[#2f7bff] to-[#6ea8ff] shadow-[0_0_14px_rgb(0_87_255/0.6)]",
    chip: "border-accent/40 bg-primary/20 text-accent",
  },
  futuro: {
    label: "Futuro",
    bar: "from-slate-500 to-slate-400",
    chip: "border-border bg-white/5 text-slate-300",
  },
  perdendo: {
    label: "Janela passando",
    bar: "from-red-500 to-amber-400 shadow-[0_0_14px_rgb(239_68_68/0.55)]",
    chip: "border-red-400/40 bg-red-500/15 text-red-300",
  },
};

const FILTERS: (WindowStatus | "todas")[] = ["todas", "agora", "em_breve", "perdendo", "futuro"];

export function PurchaseTimeline({ windows, today }: { windows: PurchaseWindow[]; today: string }) {
  const [filter, setFilter] = useState<WindowStatus | "todas">("todas");
  const [hover, setHover] = useState<string | null>(null);

  // eixo: do início do mês passado até 9 meses à frente
  const { start, end, months } = useMemo(() => {
    const t = new Date(`${today}T12:00:00`);
    const s = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const e = new Date(t.getFullYear(), t.getMonth() + 9, 1);
    const ms: { label: string; at: number }[] = [];
    for (let d = new Date(s); d < e; d.setMonth(d.getMonth() + 1)) {
      const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      ms.push({ label: `${month}/${String(d.getFullYear()).slice(2)}`, at: d.getTime() });
    }
    return { start: s.getTime(), end: e.getTime(), months: ms };
  }, [today]);

  const pct = (date: string) => {
    const t = new Date(`${date}T12:00:00`).getTime();
    return Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100));
  };
  const todayPct = pct(today);
  const visible = windows.filter((w) => filter === "todas" || w.status === filter);

  return (
    <section data-tour="window" className="card-3d card-glow reveal relative overflow-hidden rounded-2xl" style={{ ["--i" as string]: 5 }}>
      <div aria-hidden className="orb pointer-events-none absolute -top-24 right-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f === "todas" ? windows.length : windows.filter((w) => w.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  filter === f
                    ? "btn-3d border-transparent text-white"
                    : "border-border bg-white/[0.03] text-slate-300 hover:border-accent/30 hover:text-white",
                )}
              >
                {f === "todas" ? "Todas" : STATUS[f].label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-6 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" /> janela de abordagem
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rotate-45 border-2 border-white bg-[#0b1730]" /> caminhões necessários
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto overflow-y-hidden px-5 pb-9">
        <div className="min-w-[880px]">
          {/* cabeçalho de meses */}
          <div className="grid grid-cols-[240px_1fr] items-end">
            <div />
            <div className="relative h-7 border-b border-border">
              {months.map((m) => (
                <span
                  key={m.at}
                  className="absolute bottom-1.5 -translate-x-1/2 text-[11px] text-muted"
                  style={{ left: `${((m.at - start) / (end - start)) * 100}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* grade de meses + linha de hoje */}
            <div className="pointer-events-none absolute inset-y-0 right-0 left-[240px]">
              {months.map((m) => (
                <span
                  key={m.at}
                  className="absolute inset-y-0 border-l border-white/[0.05]"
                  style={{ left: `${((m.at - start) / (end - start)) * 100}%` }}
                />
              ))}
              <span
                className="absolute inset-y-0 w-0.5 bg-accent shadow-[0_0_12px_2px_rgb(110_168_255/0.7)]"
                style={{ left: `${todayPct}%` }}
              >
                {/* selo abaixo das linhas, para não cobrir o nome do mês */}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-[#050b1a]">
                  HOJE
                </span>
              </span>
            </div>

            <ul className="relative">
              {visible.map((w, i) => {
                const s = STATUS[w.status];
                const left = pct(w.approachStart);
                const width = Math.max(1.5, pct(w.approachEnd) - left);
                const isHover = hover === w.opportunityId;
                return (
                  <li
                    key={w.opportunityId}
                    className="reveal grid grid-cols-[240px_1fr] items-center border-b border-white/[0.04]"
                    style={{ ["--i" as string]: 6 + i }}
                    onMouseEnter={() => setHover(w.opportunityId)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <Link href={`/empresas/${w.companyId}`} className="group min-w-0 py-3 pr-4">
                      <p className="truncate text-sm font-medium text-white group-hover:text-accent">{w.companyName}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                        <span className="truncate">{w.city}</span> · IAC {w.iac}
                      </p>
                    </Link>
                    <div className="relative h-12">
                      {/* janela de abordagem */}
                      <div
                        className={cn(
                          "fill-anim absolute top-1/2 h-3.5 -translate-y-1/2 rounded-full bg-gradient-to-r transition-all",
                          s.bar,
                          isHover && "h-5",
                        )}
                        style={{ left: `${left}%`, width: `${width}%`, ["--i" as string]: 6 + i }}
                      />
                      {/* data em que os caminhões são necessários */}
                      <span
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-[#0b1730] shadow-[0_0_10px_rgb(255_255_255/0.5)]"
                        style={{ left: `${pct(w.needDate)}%` }}
                        aria-hidden
                      />
                      {isHover && (
                        <div
                          className={cn(
                            "toast-in absolute z-20 w-80 -translate-x-1/2 rounded-xl border border-border bg-[#0b1a3a] p-3 text-xs shadow-2xl",
                            // nas últimas linhas abre para cima, para não ser cortado pela rolagem
                            i >= visible.length - 2 && visible.length > 2 ? "bottom-full mb-1" : "top-full mt-1",
                          )}
                          style={{ left: `${Math.min(80, Math.max(20, left + width / 2))}%` }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", s.chip)}>{s.label}</span>
                            <PriorityBadge priority={w.priority} />
                          </div>
                          <p className="mt-2 text-slate-200">{w.trigger}</p>
                          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted">
                            <dt>Abordar entre</dt>
                            <dd className="text-right text-white">
                              {formatDate(w.approachStart)} e {formatDate(w.approachEnd)}
                            </dd>
                            <dt>Caminhões necessários</dt>
                            <dd className="text-right text-white">{formatDate(w.needDate)}</dd>
                            <dt>Pipeline (fictício)</dt>
                            <dd className="text-right font-semibold text-emerald-300">{formatBRLCompact(w.value)}</dd>
                          </dl>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {!visible.length && <p className="py-6 text-sm text-muted">Nenhuma empresa neste filtro.</p>}
        </div>
      </div>
    </section>
  );
}
