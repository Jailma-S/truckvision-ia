import type { IACBreakdown, Priority, Signal, Source } from "@/domain/entities";

/**
 * IAC — Índice de Antecipação Comercial (0–100).
 * Pesos do PRD v1.0. Ajuste aqui; tudo o mais lê destas constantes.
 */
export const IAC_WEIGHTS = {
  contract: 25,
  expansion: 30,
  investment: 20,
  reliable_source: 15,
  recent: 10,
} as const;

export const IAC_CRITERIA_LABEL: Record<keyof typeof IAC_WEIGHTS, string> = {
  contract: "Novo contrato",
  expansion: "Expansão operacional",
  investment: "Investimento divulgado",
  reliable_source: "Fonte confiável",
  recent: "Informação recente",
};

/** Sinais mais antigos que isso não contam para o IAC. */
export const SIGNAL_WINDOW_DAYS = 180;
const RELIABLE_THRESHOLD = 70;
const PARTIAL_RELIABLE_THRESHOLD = 50;

function daysAgo(date: string | null, now: Date): number {
  if (!date) return Infinity;
  return (now.getTime() - new Date(date).getTime()) / 86_400_000;
}

export function calculateIAC(
  signals: Signal[],
  sources: Pick<Source, "id" | "reliability_score">[],
  now: Date = new Date(),
): { score: number; breakdown: IACBreakdown } {
  const reliability = new Map(sources.map((s) => [s.id, s.reliability_score]));
  const valid = signals.filter(
    (s) => s.relevance !== "baixa" && daysAgo(s.signal_date ?? s.created_at, now) <= SIGNAL_WINDOW_DAYS,
  );

  const ids = (pred: (s: Signal) => boolean) => valid.filter(pred).map((s) => s.id);

  const contractIds = ids((s) => s.signal_type === "contract");
  // frota e logística também indicam expansão operacional
  const expansionIds = ids((s) => ["expansion", "fleet", "logistics"].includes(s.signal_type));
  const investmentIds = ids((s) => ["investment", "industry"].includes(s.signal_type));

  const reliabilityOf = (s: Signal) => (s.source_id ? (reliability.get(s.source_id) ?? 0) : 0);
  const bestReliability = Math.max(0, ...valid.map(reliabilityOf));
  const reliableIds = ids((s) => reliabilityOf(s) >= PARTIAL_RELIABLE_THRESHOLD);

  const freshest = Math.min(...valid.map((s) => daysAgo(s.signal_date ?? s.created_at, now)));
  const recentIds = ids((s) => daysAgo(s.signal_date ?? s.created_at, now) <= 90);

  const breakdown: IACBreakdown = {
    contract: contractIds.length ? IAC_WEIGHTS.contract : 0,
    expansion: expansionIds.length ? IAC_WEIGHTS.expansion : 0,
    investment: investmentIds.length ? IAC_WEIGHTS.investment : 0,
    reliable_source:
      bestReliability >= RELIABLE_THRESHOLD
        ? IAC_WEIGHTS.reliable_source
        : bestReliability >= PARTIAL_RELIABLE_THRESHOLD
          ? Math.round(IAC_WEIGHTS.reliable_source / 2)
          : 0,
    recent: freshest <= 30 ? IAC_WEIGHTS.recent : freshest <= 90 ? Math.round(IAC_WEIGHTS.recent / 2) : 0,
    evidence: {
      contract: contractIds,
      expansion: expansionIds,
      investment: investmentIds,
      reliable_source: reliableIds,
      recent: recentIds,
    },
  };

  const score = Math.min(
    100,
    breakdown.contract + breakdown.expansion + breakdown.investment + breakdown.reliable_source + breakdown.recent,
  );
  return { score, breakdown };
}

export function classifyPriority(score: number): Priority {
  if (score >= 80) return "alta";
  if (score >= 50) return "media";
  return "exploratoria";
}
