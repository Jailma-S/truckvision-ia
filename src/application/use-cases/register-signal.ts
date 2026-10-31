import { z } from "zod";
import { SIGNAL_TYPES, type Relevance } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import type { AIProvider } from "@/infrastructure/ai";
import { parseJsonObject } from "../services/json";
import { CLASSIFY_SIGNAL_SYSTEM } from "../services/prompts";
import { calculateIACUseCase } from "./calculate-iac";

export const signalSchema = z.object({
  company_id: z.string().min(1, "Selecione a empresa"),
  source_id: z.string().optional(),
  signal_type: z.enum(SIGNAL_TYPES),
  title: z.string().trim().min(5, "Título muito curto"),
  content: z.string().trim().optional(),
  url: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  signal_date: z.string().optional(),
});

interface Classification {
  relevance: Relevance;
  relevance_score: number;
  summary: string;
  evidence: string[];
}

/** IA 01 (resumo) + IA 07 (classificador de relevância). */
export async function classifySignal(ai: AIProvider | null, title: string, content: string): Promise<Classification> {
  if (ai) {
    try {
      const { text } = await ai.generate({
        system: CLASSIFY_SIGNAL_SYSTEM,
        prompt: `Título: ${title}\n\nTexto:\n${content || "(sem texto além do título)"}`,
        size: "short",
      });
      const parsed = parseJsonObject<Classification>(text);
      if (parsed && ["alta", "media", "baixa"].includes(parsed.relevance)) return parsed;
    } catch (err) {
      console.error("[classifySignal] falha na IA, usando regra", err);
    }
  }
  // Sem IA: relevância média por padrão; o analista ajusta se necessário.
  return { relevance: "media", relevance_score: 50, summary: content.slice(0, 280) || title, evidence: [title] };
}

export async function registerSignalUseCase(
  repo: TruckVisionRepository,
  ai: AIProvider | null,
  input: z.infer<typeof signalSchema>,
) {
  const data = signalSchema.parse(input);
  if (data.url && (await repo.signalExists(data.company_id, data.url))) {
    throw new Error("Este sinal (mesma URL) já está registrado para a empresa.");
  }
  const classification = await classifySignal(ai, data.title, data.content ?? "");
  const signal = await repo.createSignal({
    company_id: data.company_id,
    source_id: data.source_id || null,
    signal_type: data.signal_type,
    title: data.title,
    content: data.content || null,
    url: data.url || null,
    signal_date: data.signal_date || new Date().toISOString().slice(0, 10),
    ...classification,
    created_by: "manual",
  });
  const opportunity = await calculateIACUseCase(repo, data.company_id);
  return { signal, opportunity };
}
