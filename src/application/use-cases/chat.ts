import type { TruckVisionRepository } from "@/domain/repositories";
import { STATUS_LABEL } from "@/domain/entities";
import type { AIProvider } from "@/infrastructure/ai";
import { BASE_SYSTEM, formatSignals } from "../services/prompts";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** IA 04 — Chat de Inteligência Comercial, ancorado nos dados da base. */
export async function chatUseCase(
  repo: TruckVisionRepository,
  ai: AIProvider | null,
  history: ChatTurn[],
  question: string,
) {
  const [opportunities, signals] = await Promise.all([
    repo.listOpportunities(),
    repo.listSignals({ sinceDays: 180, limit: 200 }),
  ]);

  const ranking = opportunities
    .filter((o) => o.status !== "closed")
    .slice(0, 50)
    .map(
      (o, i) =>
        `${i + 1}. ${o.company.company_name} (${o.company.city ?? "?"}, ${o.company.segment ?? "segmento ?"}) — IAC ${o.iac_score}, ${o.priority}, etapa ${STATUS_LABEL[o.status]}`,
    )
    .join("\n");

  if (!ai) {
    return {
      answer:
        "IA não configurada (defina ANTHROPIC_API_KEY no .env.local). Enquanto isso, este é o ranking atual:\n\n" +
        (ranking || "Nenhuma oportunidade registrada."),
      model: "regras",
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const transcript = history
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Usuário" : "Assistente"}: ${t.content}`)
    .join("\n\n");

  const { text, model } = await ai.generate({
    system: `${BASE_SYSTEM}\nVocê responde perguntas sobre a base do TruckVision IA. Data de hoje: ${today}. Se a pergunta exigir dados que não estão abaixo, diga que não há registro na base.`,
    prompt: [
      "### Ranking de oportunidades abertas",
      ranking || "(vazio)",
      "",
      "### Sinais dos últimos 180 dias",
      formatSignals(signals),
      transcript ? `\n### Conversa até aqui\n${transcript}` : "",
      "",
      `### Pergunta\n${question}`,
    ].join("\n"),
  });
  return { answer: text, model };
}
