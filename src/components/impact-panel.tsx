import { CalendarClock, CircleDollarSign, Scale, Truck } from "lucide-react";
import { STATUS_LABEL, type OpportunityStatus } from "@/domain/entities";
import { REVENUE_ASSUMPTIONS } from "@/domain/rules/revenue";
import { formatBRLCompact } from "@/lib/utils";
import { CountUp, Tilt } from "./motion";
import { CardTitle } from "./ui";

interface Impact {
  pipeline: number;
  weighted: number;
  trucks: number;
  highPriorityPipeline: number;
  avgLeadDays: number;
  byStage: { status: OpportunityStatus; value: number }[];
}

export function ImpactPanel({ impact }: { impact: Impact }) {
  const maxStage = Math.max(1, ...impact.byStage.map((s) => s.value));
  const a = REVENUE_ASSUMPTIONS;

  return (
    <section data-tour="impact" className="card-3d card-glow reveal relative mt-6 overflow-hidden rounded-2xl p-5 sm:p-6" style={{ ["--i" as string]: 1 }}>
      <div aria-hidden className="orb pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Impacto em receita</CardTitle>
          <p className="mt-1 text-sm text-slate-300">Quanto vale o que o radar está enxergando agora.</p>
        </div>
        {a.isHypothesis && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-200">
            Valores fictícios · premissas de demonstração
          </span>
        )}
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Número principal */}
        <Tilt max={4}>
          <div className="shine h-full rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/[0.12] via-primary/[0.10] to-transparent p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_20px_50px_-20px_rgb(16_185_129/0.45)]">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
              <CircleDollarSign className="h-4 w-4" aria-hidden /> Pipeline potencial
            </div>
            <p className="font-display mt-2 text-4xl font-bold tracking-tight text-white tabular-nums [text-shadow:0_0_30px_rgb(52_211_153/0.35)] sm:text-5xl">
              <CountUp value={formatBRLCompact(impact.pipeline)} duration={1600} />
            </p>
            <p className="mt-2 text-sm text-slate-300">
              <strong className="text-white">
                <CountUp value={formatBRLCompact(impact.highPriorityPipeline)} duration={1600} />
              </strong>{" "}
              em oportunidades de alta prioridade
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              <Metric icon={Scale} label="Receita ponderada" value={formatBRLCompact(impact.weighted)} />
              <Metric icon={Truck} label="Caminhões potenciais" value={String(impact.trucks)} />
              <Metric icon={CalendarClock} label="Antecipação média" value={`${impact.avgLeadDays} dias`} />
            </div>
          </div>
        </Tilt>

        {/* Funil em R$ */}
        <div className="rounded-2xl border border-border bg-black/20 p-5 shadow-[inset_0_2px_8px_rgb(0_0_0/0.4)]">
          <p className="text-xs font-medium text-muted">Pipeline por etapa</p>
          <div className="mt-4 space-y-3.5">
            {impact.byStage.map((s, i) => (
              <div key={s.status}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{STATUS_LABEL[s.status]}</span>
                  <span className="font-semibold text-white tabular-nums">{formatBRLCompact(s.value)}</span>
                </div>
                <div className="track-3d h-2.5 rounded-full">
                  <div
                    className="bar-glow fill-anim h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 text-emerald-400"
                    style={{ width: `${(s.value / maxStage) * 100}%`, ["--i" as string]: 3 + i }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Premissas: ticket médio {formatBRLCompact(a.averageTicket)} por caminhão · {a.unitsByPriority.alta}/
            {a.unitsByPriority.media}/{a.unitsByPriority.exploratoria} caminhões por oportunidade (alta/média/exploratória) ·
            ponderação pela chance de fechamento da etapa. Antecipação = dias desde o primeiro sinal detectado.
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] text-muted">
        <Icon className="h-3 w-3" aria-hidden /> {label}
      </p>
      <p className="font-display mt-1 text-lg font-bold text-white tabular-nums sm:text-xl">
        <CountUp value={value} />
      </p>
    </div>
  );
}
