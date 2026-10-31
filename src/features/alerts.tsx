"use client";

import { BellRing, CheckCheck, Hourglass, Radar, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Alert, AlertKind } from "@/application/use-cases/alerts";
import { Button } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";

const SEEN_KEY = "tv-alerts-seen";
export const ALERTS_EVENT = "tv-alerts-seen";

export function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    // sem armazenamento local
  }
  window.dispatchEvent(new Event(ALERTS_EVENT));
}

/** Quantos alertas este navegador ainda não viu (para o contador do menu). */
export function useUnseenCount(alertIds: string[]) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => {
      const seen = new Set(readSeen());
      setCount(alertIds.filter((id) => !seen.has(id)).length);
    };
    update();
    window.addEventListener(ALERTS_EVENT, update);
    return () => window.removeEventListener(ALERTS_EVENT, update);
  }, [alertIds]);
  return count;
}

const KIND: Record<AlertKind, { icon: typeof Radar; label: string; style: string }> = {
  new_signal: { icon: Radar, label: "Novo sinal", style: "tile-3d text-white" },
  uncontacted: { icon: Target, label: "Ação", style: "bg-gradient-to-br from-emerald-400 to-emerald-700 text-white" },
  stalled: { icon: Hourglass, label: "Atenção", style: "bg-gradient-to-br from-amber-400 to-amber-700 text-white" },
};

const FILTERS: { key: AlertKind | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "new_signal", label: "Novos sinais" },
  { key: "uncontacted", label: "Sem contato" },
  { key: "stalled", label: "Parados" },
];

export function AlertList({ alerts }: { alerts: Alert[] }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<AlertKind | "all">("all");

  useEffect(() => {
    setSeen(new Set(readSeen()));
  }, []);

  const markAll = () => {
    const ids = [...new Set([...readSeen(), ...alerts.map((a) => a.id)])];
    writeSeen(ids);
    setSeen(new Set(ids));
  };
  const open = (id: string) => {
    if (seen.has(id)) return;
    const ids = [...readSeen(), id];
    writeSeen(ids);
    setSeen(new Set(ids));
  };

  const visible = alerts.filter((a) => filter === "all" || a.kind === filter);
  const unseen = alerts.filter((a) => !seen.has(a.id)).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? alerts.length : alerts.filter((a) => a.kind === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  filter === f.key
                    ? "btn-3d border-transparent text-white"
                    : "border-border bg-white/[0.03] text-slate-300 hover:border-accent/30 hover:text-white",
                )}
              >
                {f.label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <Button variant="secondary" onClick={markAll} disabled={!unseen}>
          <CheckCheck className="h-4 w-4" /> Marcar todos como lidos
        </Button>
      </div>

      <ul className="space-y-3">
        {visible.map((a, i) => {
          const k = KIND[a.kind];
          const isNew = !seen.has(a.id);
          return (
            <li key={a.id} className="reveal" style={{ ["--i" as string]: i }}>
              <Link
                href={`/empresas/${a.companyId}`}
                onClick={() => open(a.id)}
                className={cn(
                  "card-3d lift flex items-start gap-4 rounded-2xl p-4",
                  isNew ? "border-accent/30" : "opacity-70",
                )}
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg", k.style)}>
                  <k.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{a.title}</span>
                    {isNew && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-[0_0_10px_rgb(0_87_255/0.8)]">
                        Novo
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-300">{a.detail}</span>
                  <span className="mt-1 block text-xs text-muted">
                    <span className="font-medium text-accent">{a.companyName}</span> · {formatDate(a.date)} · {k.label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {!visible.length && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <BellRing className="h-4 w-4" /> Nenhum alerta neste filtro.
        </p>
      )}
    </div>
  );
}
