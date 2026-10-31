import type { TruckVisionRepository } from "@/domain/repositories";
import { REVENUE_ASSUMPTIONS } from "@/domain/rules/revenue";

/**
 * VISION AFTERMARKET — DADOS FICTÍCIOS para demonstração.
 * Frotas, idades, contratos e receitas por caminhão são simulados.
 * Margens: referências de mercado da orientação do Grupo (não são dados da Tracbel).
 */
export const AFTERMARKET_ASSUMPTIONS = {
  isHypothesis: true,
  /** receita anual por caminhão em cada linha (R$) */
  revenuePerTruck: { maintenance: 18_000, parts: 22_000, reviews: 9_000 },
  /** margem bruta por linha — referência de mercado (serviços 55–70%, peças 28–38%) */
  margin: { maintenance: 0.6, parts: 0.33, reviews: 0.6 },
  /** margem na venda do caminhão — referência de mercado para equipamentos (6–12%) */
  equipmentMargin: 0.09,
  /** horizonte de relacionamento para comparar com a venda */
  years: 5,
  /** referência de mercado: contratos de serviço em > 35% das máquinas novas */
  coverageTarget: 0.35,
};

export type OfferKind = "contrato" | "revisao" | "pecas" | "telemetria";

export interface FleetAccount {
  companyId: string;
  companyName: string;
  city: string | null;
  segment: string | null;
  fleet: number;
  soldByTracbel: number;
  avgAge: number;
  withContract: number;
  coverage: number;
  annualRevenue: number;
  annualMargin: number;
  offer: { kind: OfferKind; title: string; why: string };
}

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function recommend(a: Pick<FleetAccount, "avgAge" | "soldByTracbel" | "withContract" | "fleet">) {
  if (a.soldByTracbel > a.withContract)
    return {
      kind: "contrato" as const,
      title: "Contrato de manutenção preventiva",
      why: `${a.soldByTracbel - a.withContract} caminhão(ões) vendido(s) pela Tracbel ainda sem contrato`,
    };
  if (a.avgAge >= 6)
    return {
      kind: "pecas" as const,
      title: "Plano de peças de desgaste + revisão geral",
      why: `frota com idade média de ${a.avgAge} anos: freios, embreagem e suspensão`,
    };
  if (a.fleet >= 30)
    return {
      kind: "telemetria" as const,
      title: "Telemetria + manutenção por desempenho",
      why: `frota grande (${a.fleet} caminhões): reduzir parada não programada`,
    };
  return {
    kind: "revisao" as const,
    title: "Revisões programadas por quilometragem",
    why: "manter garantia e disponibilidade da frota",
  };
}

export async function getAftermarketUseCase(repo: TruckVisionRepository) {
  const companies = await repo.listCompanies();
  const a = AFTERMARKET_ASSUMPTIONS;
  const perTruckRevenue = a.revenuePerTruck.maintenance + a.revenuePerTruck.parts + a.revenuePerTruck.reviews;
  const perTruckMargin =
    a.revenuePerTruck.maintenance * a.margin.maintenance +
    a.revenuePerTruck.parts * a.margin.parts +
    a.revenuePerTruck.reviews * a.margin.reviews;

  const accounts: FleetAccount[] = companies.map((c) => {
    const h = hash(c.id);
    const fleet = 8 + (h % 48);
    const soldByTracbel = h % 5 === 0 ? 0 : 1 + (h % 7);
    const avgAge = 2 + (h % 8);
    const withContract = Math.min(soldByTracbel, h % 3);
    const base = { fleet, soldByTracbel, avgAge, withContract };
    return {
      companyId: c.id,
      companyName: c.company_name,
      city: c.city,
      segment: c.segment,
      ...base,
      coverage: soldByTracbel ? withContract / soldByTracbel : 0,
      annualRevenue: fleet * perTruckRevenue,
      annualMargin: fleet * perTruckMargin,
      offer: recommend(base),
    };
  });
  accounts.sort((x, y) => y.annualMargin - x.annualMargin);

  const sold = accounts.reduce((s, x) => s + x.soldByTracbel, 0);
  const contracts = accounts.reduce((s, x) => s + x.withContract, 0);
  const fleet = accounts.reduce((s, x) => s + x.fleet, 0);

  // um caminhão: margem da venda × margem de pós-venda no horizonte
  const saleMargin = REVENUE_ASSUMPTIONS.averageTicket * a.equipmentMargin;
  const afterMargin = perTruckMargin * a.years;

  return {
    accounts,
    totals: {
      fleet,
      sold,
      contracts,
      coverage: sold ? contracts / sold : 0,
      annualRevenue: accounts.reduce((s, x) => s + x.annualRevenue, 0),
      annualMargin: accounts.reduce((s, x) => s + x.annualMargin, 0),
      uncoveredSold: sold - contracts,
    },
    perTruck: { revenue: perTruckRevenue, margin: perTruckMargin, saleMargin, afterMargin, multiple: afterMargin / saleMargin },
    mix: [
      { label: "Manutenção preventiva", revenue: fleet * a.revenuePerTruck.maintenance, margin: a.margin.maintenance },
      { label: "Peças de desgaste", revenue: fleet * a.revenuePerTruck.parts, margin: a.margin.parts },
      { label: "Revisões programadas", revenue: fleet * a.revenuePerTruck.reviews, margin: a.margin.reviews },
    ],
  };
}
