"use client";

import { AlarmClock, CalendarDays, Check, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IacScore, PriorityBadge } from "@/components/domain";
import type { ActionDue, SellerAction } from "@/application/use-cases/seller-day";
import { cn, formatBRLCompact } from "@/lib/utils";

const DUE_LABEL: Record<ActionDue, string> = {
  atrasado: "Atrasado",
  hoje: "Hoje",
  amanha: "Amanhã",
  semana: "Esta semana",
};
const DUE_STYLE: Record<ActionDue, string> = {
  atrasado: "border-red-400/40 bg-red-500/15 text-red-300",
  hoje: "border-accent/40 bg-primary/20 text-accent",
  amanha: "border-border bg-white/5 text-slate-300",
  semana: "border-border bg-white/5 text-muted",
};

const STORAGE_KEY = "tv-seller-done";

/** Lista de ações com "concluir" guardado só neste navegador (conveniência da demonstração). */
export function SellerActions({ actions }: { actions: SellerAction[] }) {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch {
      // sem armazenamento local: começa vazio
    }
  }, []);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignora
    }
  };

  const pending = actions.filter((a) => !done.includes(a.id));
  const completed = actions.filter((a) => done.includes(a.id));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>
          <strong className="text-white">{completed.length}</strong> de {actions.length} ações concluídas
        </span>
        <div className="track-3d h-2 w-32 rounded-full">
          <div
            className="bar-glow h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 text-emerald-400 transition-all duration-500"
            style={{ width: `${actions.length ? (completed.length / actions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {[...pending, ...completed].map((a, i) => {
          const isDone = done.includes(a.id);
          return (
            <li
              key={a.id}
              className={cn(
                "card-3d reveal lift rounded-2xl p-4 transition-opacity",
                a.due === "atrasado" && !isDone && "border-red-400/30",
                a.priority === "alta" && !isDone && "card-glow",
                isDone && "opacity-50",
              )}
              style={{ ["--i" as string]: i + 2 }}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggle(a.id)}
                  aria-label={isDone ? "Reabrir ação" : "Marcar ação como concluída"}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all",
                    isDone
                      ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_12px_rgb(52_211_153/0.6)]"
                      : "border-border bg-black/30 hover:border-accent",
                  )}
                >
                  {isDone && <Check className="h-4 w-4" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", DUE_STYLE[a.due])}>
                      <AlarmClock className="h-3 w-3" />
                      {DUE_LABEL[a.due]}
                      {a.overdueDays > 0 && ` · ${a.overdueDays} dias`}
                    </span>
                    <PriorityBadge priority={a.priority} />
                  </div>
                  <p className={cn("mt-2 text-base font-semibold text-white", isDone && "line-through")}>{a.action}</p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    <Link href={`/empresas/${a.companyId}`} className="font-medium text-accent hover:underline">
                      {a.companyName}
                    </Link>
                    {a.city && <span className="text-muted"> · {a.city}</span>}
                  </p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                    <span>Por quê: {a.reason}</span>
                  </p>
                </div>

                <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                  <IacScore score={a.iac} className="[&>div]:w-16" />
                  <span className="font-display text-sm font-bold text-emerald-300 tabular-nums">{formatBRLCompact(a.value)}</span>
                  <Link
                    href={`/empresas/${a.companyId}`}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-accent hover:underline"
                  >
                    Abrir <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!actions.length && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <CalendarDays className="h-4 w-4" /> Nenhuma ação pendente.
        </p>
      )}
    </div>
  );
}
