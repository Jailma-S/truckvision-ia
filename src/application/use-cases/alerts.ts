import { SIGNAL_TYPE_LABEL, STATUS_LABEL } from "@/domain/entities";
import type { TruckVisionRepository } from "@/domain/repositories";

export type AlertKind = "new_signal" | "uncontacted" | "stalled";

export interface Alert {
  /** estável: permite marcar como lido no navegador */
  id: string;
  kind: AlertKind;
  title: string;
  detail: string;
  companyId: string;
  companyName: string;
  date: string;
}

const DAY = 86_400_000;
const NEW_SIGNAL_DAYS = 14;
const STALLED_DAYS = 14;

/** Alertas derivados da base: sinais novos, alta prioridade sem contato e oportunidades paradas. */
export async function getAlertsUseCase(repo: TruckVisionRepository): Promise<Alert[]> {
  const [opportunities, signals] = await Promise.all([
    repo.listOpportunities(),
    repo.listSignals({ sinceDays: NEW_SIGNAL_DAYS }),
  ]);
  const alerts: Alert[] = [];

  for (const s of signals) {
    if (s.relevance !== "alta" || !s.company) continue;
    alerts.push({
      id: `signal:${s.id}`,
      kind: "new_signal",
      title: `Novo sinal de ${SIGNAL_TYPE_LABEL[s.signal_type].toLowerCase()}`,
      detail: s.title,
      companyId: s.company.id,
      companyName: s.company.company_name,
      date: s.signal_date ?? s.created_at,
    });
  }

  for (const o of opportunities) {
    if (o.status === "closed") continue;
    if (o.priority === "alta" && (o.status === "identified" || o.status === "investigating")) {
      alerts.push({
        id: `uncontacted:${o.id}:${o.iac_score}`,
        kind: "uncontacted",
        title: "Alta prioridade ainda sem contato",
        detail: `IAC ${o.iac_score} · etapa ${STATUS_LABEL[o.status]}. Antecipe-se à concorrência.`,
        companyId: o.company_id,
        companyName: o.company.company_name,
        date: o.updated_at,
      });
    }
    const idle = Math.floor((Date.now() - new Date(o.updated_at).getTime()) / DAY);
    if (idle >= STALLED_DAYS) {
      alerts.push({
        id: `stalled:${o.id}:${o.updated_at}`,
        kind: "stalled",
        title: `Oportunidade parada há ${idle} dias`,
        detail: `Sem movimentação na etapa ${STATUS_LABEL[o.status]}.`,
        companyId: o.company_id,
        companyName: o.company.company_name,
        date: o.updated_at,
      });
    }
  }

  return alerts.sort((a, b) => b.date.localeCompare(a.date));
}
