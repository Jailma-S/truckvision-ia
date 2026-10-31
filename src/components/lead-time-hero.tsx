import { Flag, Radar, Timer, Trophy } from "lucide-react";
import { CountUp } from "./motion";

export interface LeadTime {
  avgDays: number;
  maxDays: number;
  maxCompany: string | null;
  minDays: number;
  companies: number;
}

/**
 * Destaque da antecipação média: quantos dias a equipe sabe da oportunidade
 * antes do pedido formal — a vantagem sobre a concorrência.
 */
export function LeadTimeHero({ lead, index = 1 }: { lead: LeadTime; index?: number }) {
  const weeks = Math.round(lead.avgDays / 7);

  return (
    <section
      data-tour="lead"
      className="card-3d card-glow reveal relative mt-6 overflow-hidden rounded-2xl p-5 sm:p-7"
      style={{ ["--i" as string]: index }}
    >
      <div aria-hidden className="orb pointer-events-none absolute -top-28 -left-16 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div aria-hidden className="orb-slow pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        {/* Número principal */}
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">
            <Timer className="h-4 w-4" /> Vantagem de tempo
          </p>
          <p className="font-display mt-2 flex items-baseline gap-3 leading-none">
            <span className="bg-gradient-to-br from-white via-emerald-200 to-emerald-400 bg-clip-text text-7xl font-extrabold tracking-tighter text-transparent tabular-nums [filter:drop-shadow(0_0_28px_rgb(52_211_153/0.45))] sm:text-8xl">
              <CountUp value={lead.avgDays} duration={1800} />
            </span>
            <span className="text-3xl font-bold text-white sm:text-4xl">dias</span>
          </p>
          <p className="mt-3 text-lg font-semibold text-white">de antecipação média</p>
          <p className="mt-1 max-w-md text-sm text-slate-300">
            É quanto tempo, em média, a equipe sabe da oportunidade{" "}
            <strong className="text-white">antes do pedido formal do cliente</strong> — e antes da concorrência.
          </p>
        </div>

        {/* Linha do tempo da vantagem */}
        <div>
          <div className="relative pt-12">
            {/* rótulo da vantagem */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-xs font-bold whitespace-nowrap text-emerald-200 shadow-[0_0_20px_-4px_rgb(52_211_153/0.7)]">
              ← <CountUp value={lead.avgDays} duration={1800} /> dias de vantagem →
            </div>

            <div className="track-3d relative h-4 rounded-full">
              <div
                className="bar-glow fill-anim h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-[#6ea8ff] text-emerald-400"
                style={{ ["--i" as string]: index + 3 }}
              />
              {/* marcador: sinal detectado */}
              <span className="absolute top-1/2 left-0 flex h-9 w-9 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_20px_rgb(52_211_153/0.9)]">
                <Radar className="h-4 w-4 text-white" />
              </span>
              {/* marcador: pedido formal */}
              <span className="absolute top-1/2 right-0 flex h-9 w-9 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-[0_0_20px_rgb(245_158_11/0.8)]">
                <Flag className="h-4 w-4 text-white" />
              </span>
            </div>

            {/* rótulos no fluxo normal: sempre abaixo da barra, em qualquer largura */}
            <div className="mt-7 flex justify-between gap-6">
              <div className="max-w-[48%]">
                <p className="text-sm font-semibold text-emerald-300">TruckVision detecta o sinal</p>
                <p className="text-xs text-muted">contrato, expansão, investimento</p>
              </div>
              <div className="max-w-[48%] text-right">
                <p className="text-sm font-semibold text-amber-300">Pedido formal do cliente</p>
                <p className="text-xs text-muted">quando a concorrência costuma chegar</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat icon={Trophy} label="Maior antecipação" value={`${lead.maxDays} dias`} hint={lead.maxCompany?.replace(" (demo)", "")} />
            <Stat icon={Timer} label="Em semanas" value={`≈ ${weeks}`} hint="semanas à frente" />
            <Stat icon={Radar} label="Oportunidades" value={String(lead.companies)} hint="com antecipação medida" />
          </div>
        </div>
      </div>

      <p className="relative mt-5 text-[11px] text-muted">
        Antecipação = dias entre o primeiro sinal detectado e hoje, nas oportunidades ativas (ainda sem pedido formal).
      </p>
    </section>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Timer; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-black/20 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
      <p className="flex items-center gap-1 text-[11px] text-muted">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="font-display mt-1 text-xl font-bold text-white tabular-nums">
        <CountUp value={value} />
      </p>
      {hint && <p className="truncate text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
