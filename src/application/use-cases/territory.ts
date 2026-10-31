import type { Priority } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import { opportunityValue } from "@/domain/rules/revenue";
import { MA_MUNICIPALITIES } from "@/infrastructure/geo/maranhao-geo";

export interface TerritoryCompany {
  id: string;
  name: string;
  segment: string | null;
  iac: number | null;
  priority: Priority | null;
}

export interface TerritoryPoint {
  code: string;
  name: string;
  x: number;
  y: number;
  companies: TerritoryCompany[];
  opportunities: number;
  highPriority: number;
  /** maior prioridade entre as oportunidades do município */
  topPriority: Priority | null;
  pipeline: number;
  signals30: number;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const RANK: Record<Priority, number> = { alta: 3, media: 2, exploratoria: 1 };

/** Agrupa empresas e oportunidades pelo município (nome conferido com a malha do IBGE). */
export async function getTerritoryUseCase(repo: TruckVisionRepository) {
  const [companies, recent] = await Promise.all([repo.listCompanies(), repo.listSignals({ sinceDays: 30 })]);
  const byName = new Map(MA_MUNICIPALITIES.map((m) => [normalize(m.name), m]));
  const points = new Map<string, TerritoryPoint>();
  const unmatched: string[] = [];

  for (const c of companies) {
    const muni = c.city ? byName.get(normalize(c.city)) : undefined;
    if (!muni) {
      unmatched.push(c.company_name);
      continue;
    }
    const point = points.get(muni.code) ?? {
      code: muni.code,
      name: muni.name,
      x: muni.x,
      y: muni.y,
      companies: [],
      opportunities: 0,
      highPriority: 0,
      topPriority: null,
      pipeline: 0,
      signals30: 0,
    };
    const o = c.opportunity;
    point.companies.push({
      id: c.id,
      name: c.company_name,
      segment: c.segment,
      iac: o?.iac_score ?? null,
      priority: o?.priority ?? null,
    });
    if (o) {
      point.opportunities++;
      if (o.priority === "alta") point.highPriority++;
      if (!point.topPriority || RANK[o.priority] > RANK[point.topPriority]) point.topPriority = o.priority;
      point.pipeline += opportunityValue(o).potential;
    }
    point.signals30 += recent.filter((s) => s.company_id === c.id).length;
    points.set(muni.code, point);
  }

  const list = [...points.values()]
    .map((p) => ({ ...p, companies: p.companies.sort((a, b) => (b.iac ?? -1) - (a.iac ?? -1)) }))
    .sort((a, b) => b.pipeline - a.pipeline || b.companies.length - a.companies.length);

  return {
    points: list,
    unmatched,
    totals: {
      municipalities: list.length,
      companies: companies.length,
      pipeline: list.reduce((sum, p) => sum + p.pipeline, 0),
    },
  };
}
