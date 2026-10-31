"use client";

import { ArrowRight, BellRing, Loader2, RotateCcw, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PriorityBadge } from "@/components/domain";
import { CountUp } from "@/components/motion";
import { Button } from "@/components/ui";
import type { SimulationResult } from "@/application/use-cases/simulate-signal";
import { formatBRLCompact } from "@/lib/utils";
import { resetSimulationAction, simulateSignalAction } from "./actions";

export function SimulateSignal() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // a notificação some sozinha
  useEffect(() => {
    if (!result && !message) return;
    const timer = setTimeout(() => {
      setResult(null);
      setMessage(null);
    }, result ? 12_000 : 5_000);
    return () => clearTimeout(timer);
  }, [result, message]);

  const simulate = () =>
    start(async () => {
      const { result, error } = await simulateSignalAction();
      setMessage(error ?? null);
      setResult(result ?? null);
      router.refresh();
    });

  const reset = () =>
    start(async () => {
      const { ok, error } = await resetSimulationAction();
      setResult(null);
      setMessage(error ?? ok ?? null);
      router.refresh();
    });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={simulate} disabled={pending} data-tour="simulate" className="relative">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Simular novo sinal
          <span className="live-dot absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
        </Button>
        <Button variant="ghost" onClick={reset} disabled={pending} title="Remove os sinais simulados">
          <RotateCcw className="h-4 w-4" /> Restaurar demo
        </Button>
      </div>

      {(result || message) && (
        <div
          role="status"
          className="toast-in fixed right-4 bottom-4 z-50 w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-accent/30 bg-[#0b1a3a]/95 p-4 shadow-[0_0_0_1px_rgb(110_168_255/0.15),0_30px_60px_-20px_rgb(0_0_0/0.8),0_0_40px_-10px_rgb(0_87_255/0.6)] backdrop-blur"
        >
          <button
            onClick={() => {
              setResult(null);
              setMessage(null);
            }}
            className="absolute top-3 right-3 text-muted hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {result ? (
            <>
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-emerald-300 uppercase">
                <span className="tile-3d flex h-6 w-6 items-center justify-center rounded-md">
                  <BellRing className="h-3.5 w-3.5 text-white" />
                </span>
                Novo sinal detectado · {result.signalType}
              </div>
              <p className="mt-2 pr-5 text-sm font-medium text-white">{result.headline}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-black/25 p-3">
                  <p className="text-[11px] text-muted">IAC</p>
                  <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-white tabular-nums">
                    <span className="text-base text-muted line-through">{result.iacBefore}</span>
                    <ArrowRight className="h-4 w-4 text-accent" />
                    <span className="[text-shadow:0_0_20px_rgb(110_168_255/0.6)]">
                      <CountUp value={result.iacAfter} />
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] p-3">
                  <p className="text-[11px] text-emerald-200">Pipeline</p>
                  <p className="font-display mt-1 text-2xl font-bold text-emerald-300 tabular-nums">
                    {result.pipelineDelta > 0 ? "+" : ""}
                    {result.pipelineDelta ? <CountUp value={formatBRLCompact(result.pipelineDelta)} /> : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <PriorityBadge priority={result.priorityBefore} />
                  {result.priorityAfter !== result.priorityBefore && (
                    <>
                      <ArrowRight className="h-3 w-3" />
                      <PriorityBadge priority={result.priorityAfter} />
                    </>
                  )}
                </div>
                <Link href={`/empresas/${result.companyId}`} className="text-xs font-medium text-accent hover:underline">
                  Ver empresa →
                </Link>
              </div>
              <p className="mt-3 text-[10px] text-muted">Sinal fictício de demonstração.</p>
            </>
          ) : (
            <p className="pr-5 text-sm text-slate-200">{message}</p>
          )}
        </div>
      )}
    </>
  );
}
