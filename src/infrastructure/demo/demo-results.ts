/**
 * RESULTADOS FICTÍCIOS — apenas para demonstração da tela de Resultados & ROI.
 * Substituir pelo histórico real (vendas atribuídas, custos do projeto, horas apuradas).
 */
import { REVENUE_ASSUMPTIONS } from "@/domain/rules/revenue";

export const RESULT_ASSUMPTIONS = {
  isHypothesis: true,
  /** margem bruta por caminhão — referência de mercado para equipamentos (6–12%), não dado da Tracbel */
  grossMargin: 0.09,
  /** implantação (uma vez) e custo mensal de plataforma + IA */
  setupCost: 120_000,
  monthlyCost: 18_000,
};

const MONTHS = [
  { signals: 38, opportunities: 9, contacts: 4, trucks: 0, hoursSaved: 40, leadDays: 31 },
  { signals: 52, opportunities: 12, contacts: 7, trucks: 2, hoursSaved: 62, leadDays: 38 },
  { signals: 61, opportunities: 14, contacts: 9, trucks: 3, hoursSaved: 78, leadDays: 44 },
  { signals: 74, opportunities: 17, contacts: 11, trucks: 4, hoursSaved: 95, leadDays: 49 },
  { signals: 88, opportunities: 21, contacts: 14, trucks: 6, hoursSaved: 112, leadDays: 55 },
  { signals: 97, opportunities: 24, contacts: 16, trucks: 8, hoursSaved: 124, leadDays: 58 },
];

export function getDemoResults(now = new Date()) {
  const a = RESULT_ASSUMPTIONS;
  let cumMargin = 0;
  let cumCost = a.setupCost;
  const months = MONTHS.map((m, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (MONTHS.length - 1 - i), 1);
    const revenue = m.trucks * REVENUE_ASSUMPTIONS.averageTicket;
    cumMargin += revenue * a.grossMargin;
    cumCost += a.monthlyCost;
    return {
      ...m,
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      revenue,
      /** retorno acumulado sobre o custo acumulado, em % */
      roi: Math.round(((cumMargin - cumCost) / cumCost) * 100),
    };
  });

  const sum = (k: "signals" | "opportunities" | "contacts" | "trucks" | "hoursSaved" | "revenue") =>
    months.reduce((s, m) => s + m[k], 0);
  const paybackIndex = months.findIndex((m) => m.roi >= 0);

  return {
    months,
    totals: {
      signals: sum("signals"),
      opportunities: sum("opportunities"),
      contacts: sum("contacts"),
      trucks: sum("trucks"),
      revenue: sum("revenue"),
      hoursSaved: sum("hoursSaved"),
      roi: months[months.length - 1].roi,
      margin: cumMargin,
      cost: cumCost,
      leadDays: months[months.length - 1].leadDays,
      payback: paybackIndex >= 0 ? months[paybackIndex].label : null,
    },
  };
}
