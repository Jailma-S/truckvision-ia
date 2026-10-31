import { Building2, CheckCircle2, Gauge, Radar, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getRepository } from "@/application/container";
import { getDashboardUseCase } from "@/application/use-cases/dashboard";
import { IacScore, KpiCard, PriorityBadge, SignalTimeline } from "@/components/domain";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { STATUS_LABEL } from "@/domain/entities";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { kpis, ranking, recentSignals, funnel } = await getDashboardUseCase(await getRepository());
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <>
      <PageHeader title="Dashboard Executivo" description="Enxergue hoje as oportunidades de amanhã." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={Building2} label="Empresas monitoradas" value={kpis.companies} />
        <KpiCard
          icon={Target}
          label="Oportunidades ativas"
          value={kpis.activeOpportunities}
          hint={`${kpis.highPriority} de alta prioridade`}
          highlight
        />
        <KpiCard icon={Radar} label="Sinais encontrados" value={kpis.signals} hint={`${kpis.signalsLast30} nos últimos 30 dias`} />
        <KpiCard icon={Gauge} label="IAC médio" value={kpis.avgIac} hint="oportunidades ativas" highlight />
        <KpiCard icon={TrendingUp} label="Taxa de qualificação" value={`${kpis.qualificationRate}%`} hint="contato + validada" />
        <KpiCard icon={CheckCircle2} label="Validadas" value={kpis.validated} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="relative overflow-hidden xl:col-span-2">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/3 h-48 w-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative mb-4 flex items-center justify-between">
            <CardTitle>Ranking comercial (IAC)</CardTitle>
            <Link href="/oportunidades" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          {ranking.length ? (
            <div className="relative space-y-1.5">
              {ranking.map((o, i) => (
                <Link
                  key={o.id}
                  href={`/empresas/${o.company_id}`}
                  className={cn(
                    "lift flex flex-wrap items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 sm:flex-nowrap",
                    i < 3 ? "bg-white/[0.035] hover:border-accent/25" : "hover:bg-white/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
                      i < 3 ? "tile-3d text-white" : "border border-border text-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 basis-[calc(100%-2.75rem)] sm:basis-auto">
                    <p className="truncate text-sm font-medium text-white">{o.company.company_name}</p>
                    <p className="truncate text-xs text-muted">
                      {o.company.city} · {o.company.segment} · {STATUS_LABEL[o.status]}
                    </p>
                  </div>
                  <div className="ml-10 flex items-center gap-3 sm:ml-0">
                    <PriorityBadge priority={o.priority} />
                    <IacScore score={o.iac_score} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>Nenhuma oportunidade ainda. Registre sinais de mercado para gerar o ranking.</EmptyState>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-5">Funil de oportunidades</CardTitle>
          <div className="space-y-4">
            {funnel.map((f, i) => (
              <div key={f.status}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-slate-300">{STATUS_LABEL[f.status]}</span>
                  <span className="font-semibold text-white tabular-nums">{f.count}</span>
                </div>
                <div className="track-3d h-3 rounded-full">
                  <div
                    className="bar-glow h-full rounded-full bg-gradient-to-r from-primary to-secondary text-primary"
                    style={{ width: `${Math.max(f.count ? 6 : 0, (f.count / maxFunnel) * 100)}%`, opacity: 1 - i * 0.12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-5 flex items-center justify-between">
          <CardTitle>Sinais mais recentes</CardTitle>
          <Link href="/sinais" className="text-xs font-medium text-accent hover:underline">
            Inteligência de Mercado
          </Link>
        </div>
        {recentSignals.length ? <SignalTimeline signals={recentSignals} /> : <EmptyState>Nenhum sinal registrado.</EmptyState>}
      </Card>
    </>
  );
}
