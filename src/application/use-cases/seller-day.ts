import { SIGNAL_TYPE_LABEL, type OpportunityStatus, type Priority } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import { opportunityValue } from "@/domain/rules/revenue";

export type ActionDue = "atrasado" | "hoje" | "amanha" | "semana";

export interface SellerAction {
  id: string;
  opportunityId: string;
  companyId: string;
  companyName: string;
  city: string | null;
  priority: Priority;
  iac: number;
  status: OpportunityStatus;
  action: string;
  reason: string;
  due: ActionDue;
  overdueDays: number;
  value: number;
}

/** Próximo passo recomendado por etapa do funil. */
export const NEXT_STEP: Record<Exclude<OpportunityStatus, "closed">, string> = {
  identified: "Validar o sinal e qualificar a empresa",
  investigating: "Fazer o primeiro contato com o decisor da frota",
  contacted: "Agendar visita levando o briefing pré-visita",
  validated: "Enviar proposta com simulação de financiamento",
};

const PRIORITY_RANK: Record<Priority, number> = { alta: 0, media: 1, exploratoria: 2 };
const DUE_RANK: Record<ActionDue, number> = { atrasado: 0, hoje: 1, amanha: 2, semana: 3 };

/** Hash estável para gerar prazos fictícios coerentes entre recarregamentos. */
function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Agenda do vendedor: uma ação por oportunidade aberta, ordenada por urgência.
 * Os PRAZOS são fictícios (demonstração); ações e motivos vêm dos dados do banco.
 */
export async function getSellerDayUseCase(repo: TruckVisionRepository) {
  const [opportunities, signals] = await Promise.all([repo.listOpportunities(), repo.listSignals()]);

  const actions: SellerAction[] = opportunities
    .filter((o) => o.status !== "closed")
    .map((o) => {
      const latest = signals.find((s) => s.company_id === o.company_id);
      const h = hash(o.id);
      // fictício: quem já teve contato e não avançou fica com follow-up atrasado
      const overdue = o.status === "contacted" || (o.status === "investigating" && h % 2 === 0);
      const due: ActionDue = overdue
        ? "atrasado"
        : o.priority === "alta"
          ? "hoje"
          : o.priority === "media"
            ? "amanha"
            : "semana";
      return {
        id: `${o.id}:${o.status}`,
        opportunityId: o.id,
        companyId: o.company_id,
        companyName: o.company.company_name,
        city: o.company.city,
        priority: o.priority,
        iac: o.iac_score,
        status: o.status,
        action: NEXT_STEP[o.status as Exclude<OpportunityStatus, "closed">],
        reason: latest ? `${SIGNAL_TYPE_LABEL[latest.signal_type]}: ${latest.title}` : "Sem sinal registrado",
        due,
        overdueDays: overdue ? 2 + (h % 4) : 0,
        value: opportunityValue(o).potential,
      };
    })
    .sort(
      (a, b) =>
        DUE_RANK[a.due] - DUE_RANK[b.due] || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.iac - a.iac,
    );

  return {
    actions,
    summary: {
      today: actions.filter((a) => a.due === "hoje" || a.due === "atrasado").length,
      overdue: actions.filter((a) => a.due === "atrasado").length,
      highPriority: actions.filter((a) => a.priority === "alta").length,
      pipeline: actions.reduce((s, a) => s + a.value, 0),
    },
  };
}
