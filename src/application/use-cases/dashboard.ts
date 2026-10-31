import type { TruckVisionRepository } from "@/domain/repositories";
import { OPPORTUNITY_STATUSES } from "@/domain/entities";
import { opportunityValue } from "@/domain/rules/revenue";

const DAY = 86_400_000;

export async function getDashboardUseCase(repo: TruckVisionRepository) {
  const [companies, opportunities, signals, recentSignals] = await Promise.all([
    repo.listCompanies(),
    repo.listOpportunities(),
    repo.listSignals(),
    repo.listSignals({ sinceDays: 30 }),
  ]);

  const active = opportunities.filter((o) => o.status !== "closed");
  const avgIac = active.length ? Math.round(active.reduce((sum, o) => sum + o.iac_score, 0) / active.length) : 0;
  const funnel = OPPORTUNITY_STATUSES.map((status) => ({
    status,
    count: opportunities.filter((o) => o.status === status).length,
  }));
  const qualified = opportunities.filter((o) => ["contacted", "validated"].includes(o.status)).length;

  // Impacto em receita (premissas fictícias em domain/rules/revenue.ts)
  const values = active.map((o) => ({ o, ...opportunityValue(o) }));
  const firstSignal = new Map<string, number>();
  for (const s of signals) {
    if (!s.company_id) continue;
    const t = new Date(s.signal_date ?? s.created_at).getTime();
    firstSignal.set(s.company_id, Math.min(firstSignal.get(s.company_id) ?? t, t));
  }
  const leadDays = active
    .map((o) => firstSignal.get(o.company_id))
    .filter((t): t is number => t !== undefined)
    .map((t) => (Date.now() - t) / DAY);

  return {
    kpis: {
      companies: companies.length,
      activeOpportunities: active.length,
      signals: signals.length,
      signalsLast30: recentSignals.length,
      avgIac,
      validated: opportunities.filter((o) => o.status === "validated").length,
      qualificationRate: opportunities.length ? Math.round((qualified / opportunities.length) * 100) : 0,
      highPriority: active.filter((o) => o.priority === "alta").length,
    },
    impact: {
      pipeline: values.reduce((sum, v) => sum + v.potential, 0),
      weighted: values.reduce((sum, v) => sum + v.weighted, 0),
      trucks: values.reduce((sum, v) => sum + v.units, 0),
      highPriorityPipeline: values.filter((v) => v.o.priority === "alta").reduce((sum, v) => sum + v.potential, 0),
      avgLeadDays: leadDays.length ? Math.round(leadDays.reduce((a, b) => a + b, 0) / leadDays.length) : 0,
      byStage: OPPORTUNITY_STATUSES.filter((s) => s !== "closed").map((status) => ({
        status,
        value: values.filter((v) => v.o.status === status).reduce((sum, v) => sum + v.potential, 0),
      })),
    },
    active,
    ranking: active.slice(0, 8),
    recentSignals: signals.slice(0, 12),
    funnel,
  };
}
