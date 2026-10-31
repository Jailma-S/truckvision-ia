import { Building2, CheckCircle2, CircleDollarSign, Clock, Gauge, Radar, Target, TrendingUp, Truck } from "lucide-react";
import type { Metadata } from "next";
import { getRepository } from "@/application/container";
import { getDashboardUseCase } from "@/application/use-cases/dashboard";
import { getPurchaseWindowsUseCase } from "@/application/use-cases/purchase-window";
import { getTerritoryUseCase } from "@/application/use-cases/territory";
import { BarChart, LineChart } from "@/components/charts";
import { KpiCard } from "@/components/domain";
import { ImpactPanel } from "@/components/impact-panel";
import { LeadTimeHero } from "@/components/lead-time-hero";
import { OpportunityRadar } from "@/components/opportunity-radar";
import { Card, CardTitle } from "@/components/ui";
import { PurchaseTimeline } from "@/features/purchase-timeline";
import { TerritoryMap } from "@/features/territory-map";
import { TvMode } from "@/features/tv-mode";
import { getDemoResults } from "@/infrastructure/demo/demo-results";
import { formatBRLCompact } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "TruckVision IA · Modo TV" };

export default async function TvPage() {
  const repo = await getRepository();
  const [dash, territory, windows] = await Promise.all([
    getDashboardUseCase(repo),
    getTerritoryUseCase(repo),
    getPurchaseWindowsUseCase(repo),
  ]);
  const results = getDemoResults();
  const { kpis } = dash;

  const slides = [
    {
      title: "Radar de Oportunidades",
      subtitle: "Empresas com sinais de compra de caminhões",
      content: (
        <>
          <OpportunityRadar opportunities={dash.active} signals={dash.recentSignals} signalsLast30={kpis.signalsLast30} />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard index={1} icon={Building2} label="Empresas monitoradas" value={kpis.companies} />
            <KpiCard index={2} icon={Target} label="Oportunidades ativas" value={kpis.activeOpportunities} highlight />
            <KpiCard index={3} icon={Radar} label="Sinais encontrados" value={kpis.signals} />
            <KpiCard index={4} icon={Gauge} label="IAC médio" value={kpis.avgIac} highlight />
            <KpiCard index={5} icon={TrendingUp} label="Taxa de qualificação" value={`${kpis.qualificationRate}%`} />
            <KpiCard index={6} icon={CheckCircle2} label="Validadas" value={kpis.validated} />
          </div>
        </>
      ),
    },
    {
      title: "Dias à frente da concorrência",
      subtitle: "Antecipação média entre o sinal detectado e o pedido formal",
      content: (
        // centralizado na vertical para ocupar o telão
        <div className="flex min-h-[70vh] items-center">
          <div className="w-full">
            <LeadTimeHero lead={dash.lead} index={0} />
          </div>
        </div>
      ),
    },
    {
      title: "Impacto em Receita",
      subtitle: "Quanto vale o que o radar está enxergando (valores fictícios)",
      content: <ImpactPanel impact={dash.impact} />,
    },
    {
      title: "Mapa Territorial",
      subtitle: "Oportunidades por município do Maranhão",
      content: <TerritoryMap points={territory.points} />,
    },
    {
      title: "Janela de Compra",
      subtitle: "Quando agir em cada empresa (prazos estimados, fictícios)",
      content: (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard index={1} icon={Target} label="Na janela agora" value={windows.summary.now} highlight />
            <KpiCard index={2} icon={Clock} label="Abrem em 30 dias" value={windows.summary.soon} />
            <KpiCard index={3} icon={Clock} label="Janela passando" value={windows.summary.losing} />
            <KpiCard index={4} icon={CircleDollarSign} label="Pipeline na janela" value={formatBRLCompact(windows.summary.pipelineNow)} />
          </div>
          <PurchaseTimeline windows={windows.windows} today={windows.today} />
        </>
      ),
    },
    {
      title: "Resultados & ROI",
      subtitle: "Últimos 6 meses (dados fictícios de demonstração)",
      content: (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard index={1} icon={CircleDollarSign} label="Receita atribuída" value={formatBRLCompact(results.totals.revenue)} highlight />
            <KpiCard index={2} icon={TrendingUp} label="ROI do projeto" value={`${results.totals.roi}%`} highlight />
            <KpiCard index={3} icon={Truck} label="Caminhões vendidos" value={results.totals.trucks} />
            <KpiCard index={4} icon={Clock} label="Horas economizadas" value={results.totals.hoursSaved} />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card style={{ ["--i" as string]: 5 }}>
              <CardTitle className="mb-3">Receita atribuída por mês</CardTitle>
              <BarChart
                label="Receita atribuída por mês"
                axis="brl"
                data={results.months.map((m) => ({ label: m.label, value: m.revenue, display: formatBRLCompact(m.revenue) }))}
              />
            </Card>
            <Card style={{ ["--i" as string]: 6 }}>
              <CardTitle className="mb-3">ROI acumulado</CardTitle>
              <LineChart
                label="ROI acumulado por mês"
                axis="percent"
                zeroLabel="ponto de equilíbrio"
                data={results.months.map((m) => ({ label: m.label, value: m.roi, display: `${m.roi}%` }))}
              />
            </Card>
          </div>
        </>
      ),
    },
  ];

  return <TvMode slides={slides} />;
}
