import {
  SIGNAL_TYPE_LABEL,
  type Company,
  type Opportunity,
  type SignalWithRefs,
  type Interaction,
} from "@/domain/entities";
import { IAC_CRITERIA_LABEL, IAC_WEIGHTS } from "@/domain/rules/iac";

export const BASE_SYSTEM = `Você é o assistente de Inteligência Comercial do TruckVision IA, usado pela equipe de vendas de caminhões novos (Volvo Trucks) no Maranhão.
Regras:
- Use somente as evidências fornecidas. Nunca invente fatos, números, contratos ou nomes.
- Quando citar um sinal, referencie-o pelo identificador entre colchetes, ex.: [S3].
- Separe claramente FATO (está nas evidências), HIPÓTESE (inferência sua) e RECOMENDAÇÃO.
- Se as evidências forem insuficientes, diga isso.
- Português do Brasil, direto e prático, em Markdown simples.`;

export function formatSignals(signals: SignalWithRefs[]): string {
  if (!signals.length) return "(nenhum sinal registrado)";
  return signals
    .map(
      (s, i) =>
        `[S${i + 1}] ${s.signal_date ?? "sem data"} | ${SIGNAL_TYPE_LABEL[s.signal_type]} | relevância ${s.relevance}` +
        ` | fonte: ${s.source?.source_name ?? "não informada"} (confiabilidade ${s.source?.reliability_score ?? "?"})` +
        `${s.company ? ` | empresa: ${s.company.company_name} (${s.company.city ?? "?"})` : ""}\n` +
        `    ${s.title}${s.summary ? ` — ${s.summary}` : ""}`,
    )
    .join("\n");
}

export function formatCompany(company: Company, opportunity: Opportunity | null): string {
  const lines = [
    `Empresa: ${company.company_name}`,
    `Segmento: ${company.segment ?? "não informado"} | Cidade: ${company.city ?? "?"}/${company.state ?? "MA"}`,
  ];
  if (company.cnpj) lines.push(`CNPJ: ${company.cnpj}`);
  if (opportunity) {
    lines.push(`IAC: ${opportunity.iac_score}/100 (prioridade ${opportunity.priority}, status ${opportunity.status})`);
    const b = opportunity.iac_breakdown;
    if (b) {
      lines.push(
        "Composição do IAC: " +
          (Object.keys(IAC_WEIGHTS) as (keyof typeof IAC_WEIGHTS)[])
            .map((k) => `${IAC_CRITERIA_LABEL[k]} ${b[k]}/${IAC_WEIGHTS[k]}`)
            .join("; "),
      );
    }
  }
  return lines.join("\n");
}

export function formatInteractions(interactions: Interaction[]): string {
  if (!interactions.length) return "(nenhuma interação registrada)";
  return interactions
    .map((i) => `- ${i.interaction_date.slice(0, 10)}: ${i.notes ?? ""}${i.result ? ` → resultado: ${i.result}` : ""}`)
    .join("\n");
}

export const ANALYSIS_INSTRUCTIONS = {
  justification: `Responda: "Por que essa empresa merece atenção comercial agora?"
Estrutura:
## Por que agora
(2–4 frases)
## Sinais detectados
(lista com citação [S#])
## Leitura do IAC
(explique cada critério pontuado e o peso usado; diga o que falta para subir de faixa)
## Hipótese de abordagem
(hipótese comercial a investigar, ex.: ampliação de frota para atender novo contrato; marque como HIPÓTESE)`,
  briefing: `Gere um BRIEFING PRÉ-VISITA para o vendedor.
Estrutura:
## Resumo da empresa
## Histórico de relacionamento
## Evidências (com [S#])
## Possíveis dores e necessidades de transporte
(marque como HIPÓTESE)
## Perguntas sugeridas para a visita
(6–8 perguntas abertas sobre operação, frota atual, contratos, prazos, financiamento)
## Próximo passo recomendado`,
} as const;

export const CLASSIFY_SIGNAL_SYSTEM = `Você classifica sinais de mercado para venda de caminhões novos no Maranhão.
Responda APENAS com JSON válido, sem texto antes ou depois:
{"relevance":"alta|media|baixa","relevance_score":0-100,"summary":"resumo executivo em até 2 frases","evidence":["trecho literal 1","trecho literal 2"]}
Critério: alta = indica necessidade provável de caminhões em até 12 meses (novo contrato de transporte, expansão de operação, investimento com logística rodoviária); média = sinal indireto; baixa = pouco relacionado a transporte.
Os trechos em "evidence" devem ser copiados do texto fornecido.`;

export const EXTRACT_SIGNAL_SYSTEM = `Você analisa notícias e publicações para identificar sinais de compra de caminhões novos por empresas no Maranhão.
Responda APENAS com JSON válido, sem texto antes ou depois:
{"is_signal":true|false,"company_name":"nome da empresa citada ou null","city":"município do MA ou null","signal_type":"contract|investment|expansion|logistics|industry|fleet","relevance":"alta|media|baixa","relevance_score":0-100,"summary":"até 2 frases","evidence":["trecho literal"]}
Marque is_signal=false se não houver empresa identificável ou se não houver relação com transporte, logística, construção, agro, mineração ou indústria.`;
