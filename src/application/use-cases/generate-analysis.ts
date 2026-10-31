import { SIGNAL_TYPE_LABEL } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import { IAC_CRITERIA_LABEL, IAC_WEIGHTS } from "@/domain/rules/iac";
import type { AIProvider } from "@/infrastructure/ai";
import {
  ANALYSIS_INSTRUCTIONS,
  BASE_SYSTEM,
  formatCompany,
  formatInteractions,
  formatSignals,
} from "../services/prompts";

export type AnalysisKind = keyof typeof ANALYSIS_INSTRUCTIONS;

/**
 * GenerateBriefingUseCase e justificativa da oportunidade
 * (IA 02 justificativa, IA 03 explicação do IAC, IA 05 hipótese de abordagem, IA 06 briefing).
 */
export async function generateAnalysisUseCase(
  repo: TruckVisionRepository,
  ai: AIProvider | null,
  companyId: string,
  kind: AnalysisKind,
) {
  const [company, opportunity, signals, interactions] = await Promise.all([
    repo.getCompany(companyId),
    repo.getOpenOpportunity(companyId),
    repo.listSignals({ companyId }),
    repo.listInteractions(companyId),
  ]);
  if (!company) throw new Error("Empresa não encontrada.");

  let content: string;
  let model: string;

  if (ai) {
    const result = await ai.generate({
      system: BASE_SYSTEM,
      prompt: [
        ANALYSIS_INSTRUCTIONS[kind],
        "",
        "### Dados da empresa",
        formatCompany(company, opportunity),
        "",
        "### Sinais de mercado",
        formatSignals(signals),
        "",
        "### Interações comerciais",
        formatInteractions(interactions),
      ].join("\n"),
    });
    content = result.text;
    model = result.model;
  } else {
    content = ruleBasedAnalysis(kind, company.company_name, opportunity, signals);
    model = "regras (IA não configurada)";
  }

  return repo.createAnalysis({
    company_id: companyId,
    opportunity_id: opportunity?.id ?? null,
    analysis_type: kind,
    content,
    model_name: model,
  });
}

function ruleBasedAnalysis(
  kind: AnalysisKind,
  companyName: string,
  opportunity: Awaited<ReturnType<TruckVisionRepository["getOpenOpportunity"]>>,
  signals: Awaited<ReturnType<TruckVisionRepository["listSignals"]>>,
): string {
  const evidence = signals.length
    ? signals
        .map((s, i) => `- [S${i + 1}] ${s.signal_date ?? ""} — ${SIGNAL_TYPE_LABEL[s.signal_type]}: ${s.title}`)
        .join("\n")
    : "- Nenhum sinal registrado.";
  const b = opportunity?.iac_breakdown;
  const iac = b
    ? (Object.keys(IAC_WEIGHTS) as (keyof typeof IAC_WEIGHTS)[])
        .map((k) => `- ${IAC_CRITERIA_LABEL[k]}: ${b[k]}/${IAC_WEIGHTS[k]}`)
        .join("\n")
    : "- IAC ainda não calculado.";

  const header = `> Texto gerado por regras — configure um provedor de IA (ANTHROPIC_API_KEY) para análises completas.\n\n`;
  if (kind === "briefing") {
    return `${header}## Resumo da empresa\n${companyName} — IAC ${opportunity?.iac_score ?? 0}/100.\n\n## Evidências\n${evidence}\n\n## Perguntas sugeridas para a visita\n- Como está a operação hoje e quais contratos começam nos próximos meses?\n- Qual o tamanho e a idade média da frota atual?\n- Há planos de ampliar ou renovar a frota? Em que prazo?\n- Como costuma financiar a frota (Finame, CDC, leasing)?\n- Quem participa da decisão de compra?\n- Quais as maiores dores com manutenção e disponibilidade hoje?`;
  }
  return `${header}## Sinais detectados\n${evidence}\n\n## Leitura do IAC\n${iac}\n\n## Hipótese de abordagem\nHIPÓTESE: verificar se os sinais acima geram necessidade de ampliação ou renovação de frota nos próximos 12 meses.`;
}
