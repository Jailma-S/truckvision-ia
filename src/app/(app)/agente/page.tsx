import { Bot, CheckCircle2, Clock, Filter, ScanSearch } from "lucide-react";
import { getRepository } from "@/application/container";
import { getAgentPanelUseCase, type SourceHealth } from "@/application/use-cases/agent-panel";
import { KpiCard } from "@/components/domain";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

const HEALTH: Record<SourceHealth, { label: string; dot: string; text: string }> = {
  ok: { label: "Operando", dot: "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]", text: "text-emerald-300" },
  lento: { label: "Lento", dot: "bg-amber-400 shadow-[0_0_8px_rgb(251_191_36)]", text: "text-amber-300" },
  falha: { label: "Sem resposta", dot: "bg-red-400 shadow-[0_0_8px_rgb(248_113_113)]", text: "text-red-300" },
};

const LOG_STYLE = {
  info: "text-slate-400",
  alta: "text-emerald-300",
  media: "text-sky-300",
  warn: "text-amber-300",
} as const;

export default async function AgentPage() {
  const { sources, funnel, totals, log, feedsConfigured } = await getAgentPanelUseCase(await getRepository());
  const maxFunnel = Math.max(...funnel.map((f) => f.value));

  return (
    <>
      <div className="reveal">
        <PageHeader title="Agente de IA" description="O agente que monitora, coleta, analisa e classifica sinais públicos todos os dias.">
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Métricas de varredura fictícias
          </span>
        </PageHeader>
      </div>

      {/* Status */}
      <section className="card-3d card-glow reveal relative mb-6 overflow-hidden rounded-2xl p-5 sm:p-6">
        <div aria-hidden className="orb pointer-events-none absolute -top-24 -left-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="tile-3d relative flex h-16 w-16 items-center justify-center rounded-2xl">
            <Bot className="h-8 w-8 text-white" />
            <span className="live-dot absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0b1730] bg-emerald-400" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-emerald-300 uppercase">Agente ativo</p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Monitoramento diário do Maranhão</h2>
            <p className="mt-1 text-sm text-slate-300">
              Última varredura hoje às <strong className="text-white">06:00</strong> · próxima amanhã às{" "}
              <strong className="text-white">06:00</strong> (horário de Brasília)
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="font-display text-3xl font-bold text-white tabular-nums">{totals.read}</p>
              <p className="text-xs text-muted">itens lidos</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-emerald-300 tabular-nums">{totals.used}</p>
              <p className="text-xs text-muted">sinais aproveitados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline do agente */}
      <Card className="mb-6" style={{ ["--i" as string]: 1 }}>
        <CardTitle>Como o agente trabalha</CardTitle>
        <ol className="mt-5 grid gap-3 sm:grid-cols-5">
          {funnel.map((f, i) => (
            <li key={f.label} className="reveal relative" style={{ ["--i" as string]: 2 + i }}>
              <div className="rounded-xl border border-border bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
                <p className="text-[11px] font-semibold tracking-wide text-accent uppercase">
                  {i + 1}. {f.label}
                </p>
                <p className="font-display mt-1 text-2xl font-bold text-white tabular-nums">{f.value}</p>
                <p className="text-xs text-muted">{f.hint}</p>
                <div className="track-3d mt-2 h-1.5 rounded-full">
                  <div
                    className="bar-glow fill-anim h-full rounded-full bg-[#3b82f6] text-[#3b82f6]"
                    style={{ width: `${(f.value / maxFunnel) * 100}%`, ["--i" as string]: 3 + i }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={3} icon={ScanSearch} label="Fontes monitoradas" value={sources.length} />
        <KpiCard index={4} icon={CheckCircle2} label="Aproveitamento" value={`${totals.precision}%`} hint="sinais úteis / itens lidos" highlight />
        <KpiCard index={5} icon={Filter} label="Descartados" value={totals.discarded} hint="ruído filtrado pela IA" />
        <KpiCard index={6} icon={Clock} label="Tempo da varredura" value="3 min" hint="todas as fontes" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Fontes */}
        <Card className="overflow-hidden p-0" style={{ ["--i" as string]: 7 }}>
          <div className="p-5 pb-3">
            <CardTitle>Fontes monitoradas</CardTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-y border-border bg-white/[0.03] text-left text-[11px] tracking-[0.08em] text-muted uppercase">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Fonte</th>
                  <th className="px-3 py-2.5 font-medium">Confiab.</th>
                  <th className="px-3 py-2.5 font-medium">Lidos</th>
                  <th className="px-3 py-2.5 font-medium">Úteis</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((s, i) => (
                  <tr key={s.id} className="reveal hover:bg-primary/[0.06]" style={{ ["--i" as string]: 8 + i }}>
                    <td className="px-5 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-3 py-3 text-slate-300 tabular-nums">{s.reliability}</td>
                    <td className="px-3 py-3 text-slate-300 tabular-nums">{s.read}</td>
                    <td className="px-3 py-3 font-semibold text-emerald-300 tabular-nums">{s.used}</td>
                    <td className="px-5 py-3">
                      <span className={cn("flex items-center gap-2 text-xs font-medium", HEALTH[s.health].text)}>
                        <span className={cn("h-2 w-2 rounded-full", HEALTH[s.health].dot)} />
                        {HEALTH[s.health].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Log */}
        <Card className="flex flex-col" style={{ ["--i" as string]: 8 }}>
          <div className="mb-3 flex items-center justify-between">
            <CardTitle>Atividade da última varredura</CardTitle>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
              <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" /> ao vivo
            </span>
          </div>
          <div className="flex-1 overflow-hidden rounded-xl border border-border bg-black/50 p-4 font-mono text-[12px] leading-relaxed shadow-[inset_0_2px_10px_rgb(0_0_0/0.6)]">
            {log.map((l, i) => (
              <p key={i} className="reveal" style={{ ["--i" as string]: 6 + i * 2 }}>
                <span className="text-slate-500">{l.time}</span> <span className={LOG_STYLE[l.level]}>{l.text}</span>
              </p>
            ))}
            <p className="reveal mt-1 text-accent" style={{ ["--i" as string]: 8 + log.length * 2 }}>
              <span className="animate-pulse">▍</span>
            </p>
          </div>
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted">
        Situação real: {feedsConfigured} de {sources.length} fontes com feed RSS configurado. Os números de leitura,
        aproveitamento e o log acima são fictícios; os sinais classificados no log são os mais recentes da base.
      </p>
    </>
  );
}
