import type { TruckVisionRepository } from "@/domain/repositories";

/**
 * Painel do Agente de Monitoramento (IA 08).
 * Fontes, confiabilidade e sinais vêm da base; os NÚMEROS DE VARREDURA são fictícios
 * enquanto as fontes não tiverem feed RSS configurado.
 */

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export type SourceHealth = "ok" | "lento" | "falha";

export async function getAgentPanelUseCase(repo: TruckVisionRepository) {
  const [sources, signals] = await Promise.all([repo.listSources(), repo.listSignals({ limit: 8 })]);

  const sourceStats = sources
    .filter((s) => s.active)
    .map((s) => {
      const h = hash(s.id);
      const read = 12 + (h % 40) + Math.round(s.reliability_score / 3);
      const used = Math.max(1, Math.round(read * (0.04 + (s.reliability_score / 100) * 0.08)));
      const health: SourceHealth = h % 9 === 0 ? "falha" : h % 4 === 0 ? "lento" : "ok";
      return {
        id: s.id,
        name: s.source_name,
        url: s.source_url,
        reliability: s.reliability_score,
        hasFeed: Boolean(s.feed_url),
        read,
        used,
        discarded: read - used,
        health,
        latencyMs: health === "lento" ? 4200 + (h % 2000) : 300 + (h % 900),
      };
    })
    .sort((a, b) => b.reliability - a.reliability);

  const read = sourceStats.reduce((s, x) => s + x.read, 0);
  const used = sourceStats.reduce((s, x) => s + x.used, 0);
  const high = Math.max(1, Math.round(used * 0.35));
  const medium = used - high;

  // log da última varredura (fictício), com os sinais reais mais recentes como "classificados"
  const pad = (n: number) => String(n).padStart(2, "0");
  let second = 2;
  const at = () => {
    second += 7 + (second % 11);
    return `06:${pad(Math.floor(second / 60))}:${pad(second % 60)}`;
  };
  const log: { time: string; level: "info" | "alta" | "media" | "warn"; text: string }[] = [
    { time: "06:00:02", level: "info", text: `Varredura iniciada — ${sourceStats.length} fontes ativas` },
    ...sourceStats.slice(0, 4).map((s) => ({
      time: at(),
      level: (s.health === "falha" ? "warn" : "info") as "warn" | "info",
      text: s.health === "falha" ? `${s.name}: sem resposta, nova tentativa agendada` : `${s.name}: ${s.read} itens lidos`,
    })),
    ...signals.slice(0, 5).map((s) => ({
      time: at(),
      level: (s.relevance === "alta" ? "alta" : "media") as "alta" | "media",
      text: `Classificado ${s.relevance.toUpperCase()}: “${s.title}”${s.company ? ` → ${s.company.company_name}` : ""}`,
    })),
    { time: at(), level: "info", text: "IAC recalculado e ranking atualizado" },
    { time: at(), level: "info", text: `Varredura concluída — ${read} itens lidos, ${used} sinais aproveitados` },
  ];

  return {
    sources: sourceStats,
    funnel: [
      { label: "Monitorar", value: sourceStats.length, hint: "fontes" },
      { label: "Coletar", value: read, hint: "itens lidos" },
      { label: "Analisar", value: read, hint: "lidos pela IA" },
      { label: "Classificar", value: used, hint: `${high} alta · ${medium} média` },
      { label: "Criar oportunidade", value: Math.max(1, Math.round(high * 0.6)), hint: "novas ou atualizadas" },
    ],
    totals: { read, used, discarded: read - used, precision: read ? Math.round((used / read) * 100) : 0 },
    log,
    feedsConfigured: sourceStats.filter((s) => s.hasFeed).length,
  };
}
