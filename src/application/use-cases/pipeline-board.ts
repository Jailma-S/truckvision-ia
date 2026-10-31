import {
  OPPORTUNITY_STATUSES,
  SIGNAL_TYPE_LABEL,
  type OpportunityStatus,
  type Priority,
} from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import { opportunityValue } from "@/domain/rules/revenue";
import { NEXT_STEP } from "./seller-day";

export interface BoardCard {
  id: string;
  companyId: string;
  companyName: string;
  city: string | null;
  segment: string | null;
  priority: Priority;
  iac: number;
  status: OpportunityStatus;
  value: number;
  units: number;
  reason: string | null;
  nextAction: string | null;
  daysInStage: number;
}

const DAY = 86_400_000;

/** Quadro de oportunidades: cartões enriquecidos e resumo por etapa (valores fictícios). */
export async function getPipelineBoardUseCase(repo: TruckVisionRepository) {
  const [opportunities, signals] = await Promise.all([repo.listOpportunities(), repo.listSignals()]);

  const cards: BoardCard[] = opportunities.map((o) => {
    const latest = signals.find((s) => s.company_id === o.company_id);
    const { potential, units } = opportunityValue({ ...o, status: o.status });
    return {
      id: o.id,
      companyId: o.company_id,
      companyName: o.company.company_name,
      city: o.company.city,
      segment: o.company.segment,
      priority: o.priority,
      iac: o.iac_score,
      status: o.status,
      value: potential,
      units,
      reason: latest ? `${SIGNAL_TYPE_LABEL[latest.signal_type]}: ${latest.title}` : null,
      nextAction: o.status === "closed" ? null : NEXT_STEP[o.status],
      daysInStage: Math.max(0, Math.floor((Date.now() - new Date(o.updated_at).getTime()) / DAY)),
    };
  });

  return { cards, stages: OPPORTUNITY_STATUSES };
}
