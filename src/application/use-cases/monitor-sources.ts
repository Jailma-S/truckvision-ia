import { SIGNAL_TYPES, type Relevance, type SignalType } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import type { AIProvider } from "@/infrastructure/ai";
import { fetchFeed } from "@/infrastructure/crawlers/rss";
import { parseJsonObject } from "../services/json";
import { EXTRACT_SIGNAL_SYSTEM } from "../services/prompts";
import { calculateIACUseCase } from "./calculate-iac";

interface Extraction {
  is_signal: boolean;
  company_name: string | null;
  city: string | null;
  signal_type: SignalType;
  relevance: Relevance;
  relevance_score: number;
  summary: string;
  evidence: string[];
}

export interface MonitorReport {
  sources: number;
  items: number;
  signals: number;
  companiesCreated: number;
  errors: string[];
}

/**
 * IA 08 — Agente de monitoramento: Monitorar → Coletar → Analisar → Classificar → Criar oportunidade.
 * Só cria empresa nova a partir de sinal de relevância ALTA, para não poluir a base.
 */
export async function monitorSourcesUseCase(repo: TruckVisionRepository, ai: AIProvider | null): Promise<MonitorReport> {
  const report: MonitorReport = { sources: 0, items: 0, signals: 0, companiesCreated: 0, errors: [] };
  if (!ai) {
    report.errors.push("IA não configurada: o agente precisa de um provedor para classificar as notícias.");
    return report;
  }

  const sources = (await repo.listSources()).filter((s) => s.active && s.feed_url);
  const touched = new Set<string>();

  for (const source of sources) {
    report.sources++;
    let items;
    try {
      items = await fetchFeed(source.feed_url!);
    } catch (err) {
      report.errors.push(`${source.source_name}: ${(err as Error).message}`);
      continue;
    }

    for (const item of items) {
      report.items++;
      try {
        const { text } = await ai.generate({
          system: EXTRACT_SIGNAL_SYSTEM,
          prompt: `Fonte: ${source.source_name}\nTítulo: ${item.title}\nData: ${item.pubDate ?? "?"}\nTexto: ${item.description.slice(0, 4000)}`,
          size: "short",
        });
        const ex = parseJsonObject<Extraction>(text);
        if (!ex?.is_signal || !ex.company_name || ex.relevance === "baixa") continue;
        if (!SIGNAL_TYPES.includes(ex.signal_type)) continue;

        let company = await repo.findCompanyByName(ex.company_name);
        if (!company) {
          if (ex.relevance !== "alta") continue;
          company = await repo.createCompany({
            company_name: ex.company_name,
            city: ex.city,
            state: "MA",
            notes: `Criada pelo agente de monitoramento a partir de: ${item.link}`,
          });
          report.companiesCreated++;
        }
        if (item.link && (await repo.signalExists(company.id, item.link))) continue;

        await repo.createSignal({
          company_id: company.id,
          source_id: source.id,
          signal_type: ex.signal_type,
          title: item.title,
          content: item.description,
          url: item.link || null,
          signal_date: item.pubDate,
          summary: ex.summary,
          evidence: ex.evidence,
          relevance: ex.relevance,
          relevance_score: ex.relevance_score,
          created_by: "agent",
        });
        report.signals++;
        touched.add(company.id);
      } catch (err) {
        report.errors.push(`${item.link || item.title}: ${(err as Error).message}`);
      }
    }
  }

  for (const companyId of touched) await calculateIACUseCase(repo, companyId);
  return report;
}
