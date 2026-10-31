"use client";

import { ArrowLeft, ArrowRight, ChevronRight, Clock, GripVertical, PartyPopper, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BoardCard } from "@/application/use-cases/pipeline-board";
import { IacScore, PriorityBadge } from "@/components/domain";
import { CountUp } from "@/components/motion";
import { Input, Select } from "@/components/ui";
import { OPPORTUNITY_STATUSES, STATUS_LABEL, type OpportunityStatus, type Priority } from "@/domain/entities";
import { cn, formatBRLCompact } from "@/lib/utils";
import { moveOpportunityAction } from "./actions";

const STAGE: Record<OpportunityStatus, { color: string; hint: string }> = {
  identified: { color: "#94a3b8", hint: "sinal detectado" },
  investigating: { color: "#38bdf8", hint: "qualificando" },
  contacted: { color: "#6ea8ff", hint: "em conversa" },
  validated: { color: "#34d399", hint: "necessidade confirmada" },
  closed: { color: "#64748b", hint: "concluída" },
};

const ORDER = OPPORTUNITY_STATUSES;
const OPEN = ORDER.filter((s) => s !== "closed");

interface Burst {
  key: number;
  status: OpportunityStatus;
  company: string;
}

export function Kanban({ initial }: { initial: BoardCard[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<OpportunityStatus | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [city, setCity] = useState("");
  const [burst, setBurst] = useState<Burst | null>(null);

  // novos dados do servidor (após salvar) substituem o estado local
  useEffect(() => setCards(initial), [initial]);
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 3500);
    return () => clearTimeout(t);
  }, [burst]);

  const cities = useMemo(() => [...new Set(initial.map((c) => c.city).filter(Boolean))].sort() as string[], [initial]);
  const visible = cards.filter(
    (c) =>
      (!query || c.companyName.toLowerCase().includes(query.toLowerCase())) &&
      (!priority || c.priority === priority) &&
      (!city || c.city === city),
  );

  async function move(id: string, status: OpportunityStatus) {
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status, daysInStage: 0 } : c)));
    if (status === "validated") setBurst({ key: Date.now(), status, company: card.companyName });
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    try {
      await moveOpportunityAction(fd);
    } finally {
      router.refresh();
    }
  }

  // funil: quantas oportunidades chegaram pelo menos até cada etapa
  const openCards = visible.filter((c) => c.status !== "closed");
  const reached = (s: OpportunityStatus) =>
    openCards.filter((c) => ORDER.indexOf(c.status) >= ORDER.indexOf(s)).length;

  return (
    <div>
      {/* Funil por etapa */}
      <div data-tour="pipeline" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {OPEN.map((s, i) => {
          const items = visible.filter((c) => c.status === s);
          const total = items.reduce((sum, c) => sum + c.value, 0);
          const pct = openCards.length ? Math.round((reached(s) / openCards.length) * 100) : 0;
          return (
            <div key={s} className="reveal relative" style={{ ["--i" as string]: i + 1 }}>
              <div
                className="card-3d lift relative h-full overflow-hidden rounded-2xl p-4"
                style={{ boxShadow: `inset 0 2px 0 ${STAGE[s].color}` }}
              >
                <div aria-hidden className="pointer-events-none absolute -top-10 -right-8 h-24 w-24 rounded-full blur-2xl" style={{ background: `${STAGE[s].color}33` }} />
                <p className="relative flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: STAGE[s].color }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: STAGE[s].color, boxShadow: `0 0 8px ${STAGE[s].color}` }} />
                  {i + 1}. {STATUS_LABEL[s]}
                </p>
                <p className="font-display relative mt-2 text-3xl font-bold text-white tabular-nums">
                  <CountUp value={items.length} />
                </p>
                <p className="relative text-sm font-semibold text-emerald-300 tabular-nums">{formatBRLCompact(total)}</p>
                <div className="track-3d relative mt-3 h-1.5 rounded-full">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: STAGE[s].color, boxShadow: `0 0 8px ${STAGE[s].color}` }} />
                </div>
                <p className="relative mt-1 text-[11px] text-muted">{pct}% das oportunidades chegaram aqui</p>
              </div>
              {i < OPEN.length - 1 && (
                <ChevronRight className="absolute top-1/2 -right-3 z-10 hidden h-5 w-5 -translate-y-1/2 text-accent lg:block" aria-hidden />
              )}
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="card-3d reveal mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-3" style={{ ["--i" as string]: 5 }}>
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar empresa" aria-label="Buscar empresa" className="pl-9" />
        </div>
        <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "")} aria-label="Prioridade" className="w-auto">
          <option value="">Toda prioridade</option>
          <option value="alta">Alta prioridade</option>
          <option value="media">Prioridade média</option>
          <option value="exploratoria">Exploratório</option>
        </Select>
        <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Município" className="w-auto">
          <option value="">Todos os municípios</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <p className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          <GripVertical className="h-3.5 w-3.5" /> Arraste os cartões entre as colunas ou use “Avançar”
        </p>
      </div>

      {/* Quadro */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div data-tour="kanban" className="grid min-w-[1180px] grid-cols-5 gap-4">
          {ORDER.map((status, col) => {
            const items = visible.filter((c) => c.status === status).sort((a, b) => b.iac - a.iac);
            const total = items.reduce((sum, c) => sum + c.value, 0);
            const isOver = over === status && dragId !== null;
            return (
              <section
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(status);
                }}
                onDragLeave={() => setOver((o) => (o === status ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  setOver(null);
                  setDragId(null);
                  if (id) void move(id, status);
                }}
                className={cn(
                  "relative rounded-2xl border bg-black/20 p-3 shadow-[inset_0_2px_8px_rgb(0_0_0/0.45)] transition-all",
                  isOver ? "border-accent/70 bg-primary/10 shadow-[0_0_30px_-8px_rgb(0_87_255/0.8)]" : "border-border",
                )}
              >
                <header className="mb-3 px-1">
                  <h2 className="flex items-center justify-between text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: STAGE[status].color }}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: STAGE[status].color, boxShadow: `0 0 8px ${STAGE[status].color}` }} />
                      {STATUS_LABEL[status]}
                    </span>
                    <span className="tile-3d rounded-full px-2 py-0.5 text-white tabular-nums">{items.length}</span>
                  </h2>
                  <p className="mt-1 flex justify-between text-[11px] text-muted">
                    <span>{STAGE[status].hint}</span>
                    <span className="font-semibold text-emerald-300 tabular-nums">{formatBRLCompact(total)}</span>
                  </p>
                </header>

                <div className="space-y-3">
                  {items.map((c, i) => {
                    const idx = ORDER.indexOf(c.status);
                    const next = ORDER[idx + 1];
                    const prev = ORDER[idx - 1];
                    return (
                      <article
                        key={c.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", c.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(c.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOver(null);
                        }}
                        className={cn(
                          "card-3d reveal lift group cursor-grab rounded-xl p-3 active:cursor-grabbing",
                          c.priority === "alta" && "card-glow",
                          dragId === c.id && "opacity-40",
                        )}
                        style={{ ["--i" as string]: 6 + col * 2 + i }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/empresas/${c.companyId}`} className="min-w-0 text-sm font-semibold text-white hover:text-accent">
                            {c.companyName}
                          </Link>
                          <GripVertical className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-slate-400" aria-hidden />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {c.city} · {c.segment}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <PriorityBadge priority={c.priority} />
                          <IacScore score={c.iac} className="[&>div]:w-14" />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-display font-bold text-emerald-300 tabular-nums">{formatBRLCompact(c.value)}</span>
                          <span className="flex items-center gap-1 text-muted">
                            <Clock className="h-3 w-3" /> {c.daysInStage}d na etapa
                          </span>
                        </div>

                        {c.reason && (
                          <p className="mt-2 line-clamp-2 flex gap-1.5 text-[11px] text-slate-400">
                            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" /> {c.reason}
                          </p>
                        )}
                        {c.nextAction && (
                          <p className="mt-2 rounded-lg border border-accent/20 bg-primary/10 px-2 py-1.5 text-[11px] text-slate-200">
                            <span className="font-semibold text-accent">Próximo passo:</span> {c.nextAction}
                          </p>
                        )}

                        <div className="mt-3 flex gap-1.5">
                          {prev && (
                            <button
                              onClick={() => move(c.id, prev)}
                              aria-label={`Voltar para ${STATUS_LABEL[prev]}`}
                              title={`Voltar para ${STATUS_LABEL[prev]}`}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted hover:border-accent/40 hover:text-white"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {next && (
                            <button
                              onClick={() => move(c.id, next)}
                              className="btn-3d flex h-8 flex-1 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-white"
                            >
                              {next === "closed" ? "Encerrar" : `Avançar para ${STATUS_LABEL[next]}`}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {!items.length && (
                    <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
                      Arraste um cartão para cá
                    </p>
                  )}
                </div>

                {/* celebração ao validar */}
                {burst?.status === status && (
                  <div key={burst.key} aria-hidden className="pointer-events-none absolute inset-x-0 top-10 flex justify-center">
                    {Array.from({ length: 26 }, (_, k) => (
                      <span
                        key={k}
                        className="confetti absolute h-2 w-1.5 rounded-sm"
                        style={{
                          background: ["#34d399", "#6ea8ff", "#fbbf24", "#ffffff", "#0ea5e9"][k % 5],
                          ["--dx" as string]: `${Math.cos((k / 26) * Math.PI * 2) * (60 + (k % 4) * 25)}px`,
                          ["--dy" as string]: `${Math.sin((k / 26) * Math.PI * 2) * (50 + (k % 3) * 25) - 30}px`,
                          ["--r" as string]: `${(k * 47) % 360}deg`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {burst && (
        <div role="status" className="toast-in fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-[#0b1a3a]/95 p-4 shadow-[0_0_40px_-10px_rgb(52_211_153/0.7)] backdrop-blur">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700">
            <PartyPopper className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Oportunidade validada!</p>
            <p className="text-xs text-slate-300">{burst.company} confirmou a necessidade de caminhões.</p>
          </div>
        </div>
      )}
    </div>
  );
}
