import type { Opportunity, OpportunityStatus, Priority } from "@/domain/entities";

/**
 * PREMISSAS FICTÍCIAS — apenas para demonstração.
 * Substitua pelos números reais da área comercial (ticket médio, frota por oportunidade, conversão por etapa).
 */
export const REVENUE_ASSUMPTIONS = {
  isHypothesis: true,
  /** R$ por caminhão novo */
  averageTicket: 780_000,
  /** caminhões esperados por oportunidade quando não há estimativa própria */
  unitsByPriority: { alta: 5, media: 3, exploratoria: 1 } satisfies Record<Priority, number>,
  /** chance de fechamento por etapa do funil */
  winRateByStatus: {
    identified: 0.1,
    investigating: 0.2,
    contacted: 0.35,
    validated: 0.6,
    closed: 0,
  } satisfies Record<OpportunityStatus, number>,
} as const;

export function opportunityUnits(o: Pick<Opportunity, "estimated_units" | "priority">) {
  return o.estimated_units ?? REVENUE_ASSUMPTIONS.unitsByPriority[o.priority];
}

/** Valor potencial (R$) e valor ponderado pela chance de fechamento da etapa. */
export function opportunityValue(o: Pick<Opportunity, "estimated_units" | "priority" | "status">) {
  const units = opportunityUnits(o);
  const potential = units * REVENUE_ASSUMPTIONS.averageTicket;
  return { units, potential, weighted: potential * REVENUE_ASSUMPTIONS.winRateByStatus[o.status] };
}
