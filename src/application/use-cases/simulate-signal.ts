import { SIGNAL_TYPE_LABEL, type Priority, type SignalType } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import { calculateIAC } from "@/domain/rules/iac";
import { opportunityValue } from "@/domain/rules/revenue";
import { calculateIACUseCase } from "./calculate-iac";

/** Manchetes fictícias usadas na simulação ao vivo. */
const HEADLINES: Record<"contract" | "expansion" | "investment", string[]> = {
  contract: [
    "vence licitação de transporte de cargas por 24 meses",
    "assina contrato de escoamento de grãos com trading",
    "é homologada em pregão de transporte de insumos",
  ],
  expansion: [
    "anuncia nova base operacional no corredor da BR-135",
    "abre filial em Imperatriz para atender novo cliente",
    "amplia operação com segundo turno de distribuição",
  ],
  investment: [
    "divulga investimento em ampliação de pátio logístico",
    "obtém licença para novo armazém de grande porte",
    "anuncia aporte para expansão da operação no Maranhão",
  ],
};

export interface SimulationResult {
  companyId: string;
  companyName: string;
  signalType: string;
  headline: string;
  iacBefore: number;
  iacAfter: number;
  priorityBefore: Priority;
  priorityAfter: Priority;
  pipelineDelta: number;
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * Cria um sinal fictício para a oportunidade com mais espaço para crescer e recalcula o IAC.
 * Escolhe o critério do IAC que ainda falta, para que a mudança apareça na tela.
 */
export async function simulateSignalUseCase(repo: TruckVisionRepository): Promise<SimulationResult> {
  const [opportunities, sources] = await Promise.all([repo.listOpportunities(), repo.listSources()]);
  const candidates = opportunities
    .filter((o) => o.status !== "closed" && o.iac_score < 100)
    .sort((a, b) => a.iac_score - b.iac_score);
  if (!candidates.length) throw new Error("Todas as oportunidades já estão com IAC 100. Use “Restaurar demo”.");

  // sorteia entre as de menor IAC, para variar a demonstração
  const target = pick(candidates.slice(0, 4));
  const b = target.iac_breakdown;
  const missing = (["contract", "expansion", "investment"] as const).filter((k) => !b || b[k] === 0);
  const type: SignalType = missing.length ? pick([...missing]) : "contract";
  const headline = `${target.company.company_name.replace(" (demo)", "")} ${pick(HEADLINES[type as keyof typeof HEADLINES])}`;
  const source = [...sources].sort((x, y) => y.reliability_score - x.reliability_score)[0];

  await repo.createSignal({
    company_id: target.company_id,
    source_id: source?.id ?? null,
    signal_type: type,
    title: headline,
    content: "Sinal fictício gerado pela simulação de demonstração.",
    url: null,
    signal_date: new Date().toISOString().slice(0, 10),
    summary: "Sinal fictício gerado pela simulação de demonstração.",
    evidence: [headline],
    relevance: "alta",
    relevance_score: 90,
    created_by: "simulation",
  });

  const updated = await calculateIACUseCase(repo, target.company_id);
  const after = updated ?? target;
  return {
    companyId: target.company_id,
    companyName: target.company.company_name,
    signalType: SIGNAL_TYPE_LABEL[type],
    headline,
    iacBefore: target.iac_score,
    iacAfter: after.iac_score,
    priorityBefore: target.priority,
    priorityAfter: after.priority,
    pipelineDelta: opportunityValue(after).potential - opportunityValue(target).potential,
  };
}

/** Apaga os sinais de simulação e recalcula o IAC das empresas afetadas. */
export async function resetSimulationUseCase(repo: TruckVisionRepository) {
  const companyIds = await repo.deleteSimulatedSignals();
  const sources = await repo.listSources();
  for (const companyId of companyIds) {
    const signals = await repo.listSignals({ companyId });
    if (signals.length) {
      await calculateIACUseCase(repo, companyId);
    } else {
      // sem sinais restantes: zera a oportunidade criada pela simulação
      const { breakdown } = calculateIAC([], sources);
      const open = await repo.getOpenOpportunity(companyId);
      if (open) {
        await repo.upsertOpenOpportunity({
          company_id: companyId,
          title: open.title ?? "",
          description: open.description,
          iac_score: 0,
          iac_breakdown: breakdown,
          priority: "exploratoria",
        });
      }
    }
  }
  return companyIds.length;
}
