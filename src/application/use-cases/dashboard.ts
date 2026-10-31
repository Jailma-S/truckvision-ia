import type { TruckVisionRepository } from "@/domain/repositories";
import { OPPORTUNITY_STATUSES } from "@/domain/entities";

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
    ranking: active.slice(0, 8),
    recentSignals: signals.slice(0, 6),
    funnel,
  };
}
