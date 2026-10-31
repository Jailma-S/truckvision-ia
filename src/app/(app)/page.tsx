import Link from "next/link";
import { getRepository } from "@/application/container";
import { getDashboardUseCase } from "@/application/use-cases/dashboard";
import { IacScore, KpiCard, PriorityBadge, SignalTimeline } from "@/components/domain";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { STATUS_LABEL } from "@/domain/entities";

export default async function DashboardPage() {
  const { kpis, ranking, recentSignals, funnel } = await getDashboardUseCase(await getRepository());
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <>
      <PageHeader title="Dashboard Executivo" description="Enxergue hoje as oportunidades de amanhã." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Empresas monitoradas" value={kpis.companies} />
        <KpiCard label="Oportunidades ativas" value={kpis.activeOpportunities} hint={`${kpis.highPriority} de alta prioridade`} />
        <KpiCard label="Sinais encontrados" value={kpis.signals} hint={`${kpis.signalsLast30} nos últimos 30 dias`} />
        <KpiCard label="IAC médio" value={kpis.avgIac} hint="oportunidades ativas" />
        <KpiCard label="Taxa de qualificação" value={`${kpis.qualificationRate}%`} hint="contato + validada" />
        <KpiCard label="Validadas" value={kpis.validated} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Ranking comercial (IAC)</CardTitle>
            <Link href="/oportunidades" className="text-xs font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          {ranking.length ? (
            <div className="divide-y divide-border">
              {ranking.map((o, i) => (
                <Link
                  key={o.id}
                  href={`/empresas/${o.company_id}`}
                  className="flex flex-wrap items-center gap-3 py-3 hover:bg-slate-50 sm:flex-nowrap"
                >
                  <span className="w-5 text-sm font-semibold text-muted tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1 basis-[calc(100%-2rem)] sm:basis-auto">
                    <p className="truncate text-sm font-medium">{o.company.company_name}</p>
                    <p className="text-xs text-muted">
                      {o.company.city} · {o.company.segment} · {STATUS_LABEL[o.status]}
                    </p>
                  </div>
                  <div className="ml-8 flex items-center gap-3 sm:ml-0">
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
          <CardTitle className="mb-4">Funil de oportunidades</CardTitle>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.status}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted">{STATUS_LABEL[f.status]}</span>
                  <span className="font-semibold tabular-nums">{f.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-secondary" style={{ width: `${(f.count / maxFunnel) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Sinais mais recentes</CardTitle>
          <Link href="/sinais" className="text-xs font-medium text-primary hover:underline">
            Inteligência de Mercado
          </Link>
        </div>
        {recentSignals.length ? <SignalTimeline signals={recentSignals} /> : <EmptyState>Nenhum sinal registrado.</EmptyState>}
      </Card>
    </>
  );
}
