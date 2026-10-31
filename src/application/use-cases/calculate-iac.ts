import type { TruckVisionRepository } from "@/domain/repositories";
import { calculateIAC, classifyPriority } from "@/domain/rules/iac";
import { PRIORITY_LABEL } from "@/domain/entities";

/**
 * CalculateIACUseCase + CreateOpportunityUseCase:
 * recalcula o IAC da empresa e cria/atualiza a oportunidade aberta.
 */
export async function calculateIACUseCase(repo: TruckVisionRepository, companyId: string) {
  const [company, signals, sources] = await Promise.all([
    repo.getCompany(companyId),
    repo.listSignals({ companyId }),
    repo.listSources(),
  ]);
  if (!company || !signals.length) return null;

  const { score, breakdown } = calculateIAC(signals, sources);
  const existing = await repo.getOpenOpportunity(companyId);
  if (score === 0 && !existing) return null;

  const priority = classifyPriority(score);
  return repo.upsertOpenOpportunity({
    company_id: companyId,
    title: existing?.title ?? `Potencial de renovação/ampliação de frota — ${company.company_name}`,
    description: `${PRIORITY_LABEL[priority]} — IAC ${score}/100 com base em ${signals.length} sinal(is).`,
    iac_score: score,
    iac_breakdown: breakdown,
    priority,
  });
}
