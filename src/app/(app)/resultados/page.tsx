import { CalendarClock, CircleDollarSign, Clock, TrendingUp, Truck } from "lucide-react";
import { BarChart, LineChart } from "@/components/charts";
import { KpiCard } from "@/components/domain";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { REVENUE_ASSUMPTIONS } from "@/domain/rules/revenue";
import { getDemoResults, RESULT_ASSUMPTIONS } from "@/infrastructure/demo/demo-results";
import { formatBRLCompact } from "@/lib/utils";

export default function ResultsPage() {
  const { months, totals } = getDemoResults();
  const a = RESULT_ASSUMPTIONS;

  const funnel = [
    { label: "Sinais detectados", value: totals.signals },
    { label: "Oportunidades geradas", value: totals.opportunities },
    { label: "Contatos realizados", value: totals.contacts },
    { label: "Caminhões vendidos", value: totals.trucks },
  ];

  return (
    <>
      <div className="reveal">
        <PageHeader
          title="Resultados & ROI"
          description="O que o TruckVision IA gerou nos últimos 6 meses — a prova de valor do projeto."
        >
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Dados fictícios de demonstração
          </span>
        </PageHeader>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard index={1} icon={CircleDollarSign} label="Receita atribuída" value={formatBRLCompact(totals.revenue)} hint="6 meses" highlight />
        <KpiCard index={2} icon={TrendingUp} label="ROI do projeto" value={`${totals.roi}%`} hint={totals.payback ? `retorno a partir de ${totals.payback}` : "ainda sem retorno"} highlight />
        <KpiCard index={3} icon={Truck} label="Caminhões vendidos" value={totals.trucks} hint="atribuídos ao radar" />
        <KpiCard index={4} icon={Clock} label="Horas economizadas" value={totals.hoursSaved} hint="prospecção manual evitada" />
        <KpiCard index={5} icon={CalendarClock} label="Antecipação média" value={`${totals.leadDays} dias`} hint="antes do pedido formal" highlight />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card style={{ ["--i" as string]: 6 }}>
          <CardTitle>Receita atribuída por mês</CardTitle>
          <p className="mt-1 mb-3 text-xs text-muted">Vendas de caminhões cuja oportunidade nasceu de um sinal do TruckVision.</p>
          <BarChart
            label="Receita atribuída por mês"
            data={months.map((m) => ({ label: m.label, value: m.revenue, display: formatBRLCompact(m.revenue) }))}
            axis="brl"
          />
        </Card>

        <Card style={{ ["--i" as string]: 7 }}>
          <CardTitle>ROI acumulado</CardTitle>
          <p className="mt-1 mb-3 text-xs text-muted">Margem bruta atribuída menos o custo do projeto, sobre o custo acumulado.</p>
          <LineChart
            label="ROI acumulado por mês"
            data={months.map((m) => ({ label: m.label, value: m.roi, display: `${m.roi}%` }))}
            axis="percent"
            zeroLabel="ponto de equilíbrio"
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card style={{ ["--i" as string]: 8 }}>
          <CardTitle>Funil de conversão (6 meses)</CardTitle>
          <div className="mt-5 space-y-4">
            {funnel.map((f, i) => {
              const prev = funnel[i - 1];
              return (
                <div key={f.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-300">{f.label}</span>
                    <span className="flex items-baseline gap-3">
                      {prev && (
                        <span className="text-xs text-muted">{Math.round((f.value / prev.value) * 100)}% da etapa anterior</span>
                      )}
                      <span className="font-display text-lg font-bold text-white tabular-nums">{f.value}</span>
                    </span>
                  </div>
                  <div className="track-3d h-3 rounded-full">
                    <div
                      className="bar-glow fill-anim h-full rounded-full bg-[#3b82f6] text-[#3b82f6]"
                      style={{ width: `${Math.max(3, (f.value / funnel[0].value) * 100)}%`, ["--i" as string]: 9 + i }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ ["--i" as string]: 9 }}>
          <CardTitle>Premissas desta simulação</CardTitle>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
            <li>
              <strong className="text-white">Ticket médio:</strong> {formatBRLCompact(REVENUE_ASSUMPTIONS.averageTicket)} por caminhão
            </li>
            <li>
              <strong className="text-white">Margem bruta:</strong> {Math.round(a.grossMargin * 100)}% — referência de mercado
              para equipamentos (6–12%), não dado da Tracbel
            </li>
            <li>
              <strong className="text-white">Custo do projeto:</strong> {formatBRLCompact(a.setupCost)} de implantação +{" "}
              {formatBRLCompact(a.monthlyCost)}/mês de plataforma e IA
            </li>
            <li>
              <strong className="text-white">Margem atribuída:</strong> {formatBRLCompact(totals.margin)} · custo acumulado{" "}
              {formatBRLCompact(totals.cost)}
            </li>
          </ul>
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-relaxed text-amber-100/90">
            Todos os números desta tela são fictícios. Para uso real, substitua pelas vendas atribuídas, custos e horas
            apurados — análises financeiras são de apoio e decisões materiais devem passar pelo CFO.
          </p>
        </Card>
      </div>
    </>
  );
}
