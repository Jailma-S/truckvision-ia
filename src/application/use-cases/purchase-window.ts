import { SIGNAL_TYPE_LABEL, type Priority, type SignalType } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";
import { opportunityValue } from "@/domain/rules/revenue";

/**
 * PREMISSAS FICTÍCIAS — estimativa de quando a empresa vai precisar dos caminhões.
 * Para uso real, calibrar com o histórico de vendas (tempo entre sinal e pedido).
 */
export const WINDOW_ASSUMPTIONS = {
  isHypothesis: true,
  /** dias entre o sinal e a necessidade dos caminhões, por tipo de sinal [mín, máx] */
  needAfterSignal: {
    contract: [60, 120],
    fleet: [45, 100],
    logistics: [90, 150],
    expansion: [120, 200],
    investment: [150, 260],
    industry: [150, 260],
  } satisfies Record<SignalType, [number, number]>,
  /** a abordagem deve começar X dias antes da necessidade e terminar Y dias antes */
  approachStartBefore: 120,
  approachEndBefore: 45,
};

export type WindowStatus = "agora" | "em_breve" | "futuro" | "perdendo";

export interface PurchaseWindow {
  opportunityId: string;
  companyId: string;
  companyName: string;
  city: string | null;
  priority: Priority;
  iac: number;
  value: number;
  trigger: string;
  signalDate: string;
  approachStart: string;
  approachEnd: string;
  needDate: string;
  status: WindowStatus;
  /** dias até o início (negativo = já começou) */
  daysToStart: number;
  daysToEnd: number;
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export async function getPurchaseWindowsUseCase(repo: TruckVisionRepository) {
  const [opportunities, signals] = await Promise.all([repo.listOpportunities(), repo.listSignals()]);
  const now = Date.now();
  const a = WINDOW_ASSUMPTIONS;

  const windows: PurchaseWindow[] = [];
  for (const o of opportunities) {
    if (o.status === "closed") continue;
    // o sinal mais "urgente" da empresa define a janela
    const candidates = signals
      .filter((s) => s.company_id === o.company_id && s.relevance !== "baixa")
      .map((s) => {
        const [min, max] = a.needAfterSignal[s.signal_type];
        const offset = min + (hash(s.id) % (max - min + 1));
        const base = new Date(s.signal_date ?? s.created_at).getTime();
        return { s, need: base + offset * DAY, base };
      })
      .sort((x, y) => x.need - y.need);
    const pick = candidates[0];
    if (!pick) continue;

    const start = pick.need - a.approachStartBefore * DAY;
    const end = pick.need - a.approachEndBefore * DAY;
    const daysToStart = Math.round((start - now) / DAY);
    const daysToEnd = Math.round((end - now) / DAY);
    const status: WindowStatus =
      daysToEnd < 0 ? "perdendo" : daysToStart <= 0 ? "agora" : daysToStart <= 30 ? "em_breve" : "futuro";

    windows.push({
      opportunityId: o.id,
      companyId: o.company_id,
      companyName: o.company.company_name,
      city: o.company.city,
      priority: o.priority,
      iac: o.iac_score,
      value: opportunityValue(o).potential,
      trigger: `${SIGNAL_TYPE_LABEL[pick.s.signal_type]}: ${pick.s.title}`,
      signalDate: iso(pick.base),
      approachStart: iso(start),
      approachEnd: iso(end),
      needDate: iso(pick.need),
      status,
      daysToStart,
      daysToEnd,
    });
  }

  windows.sort((x, y) => x.approachStart.localeCompare(y.approachStart));
  const by = (s: WindowStatus) => windows.filter((w) => w.status === s);

  return {
    windows,
    today: iso(now),
    summary: {
      now: by("agora").length,
      soon: by("em_breve").length,
      losing: by("perdendo").length,
      pipelineNow: by("agora").reduce((sum, w) => sum + w.value, 0),
    },
  };
}
