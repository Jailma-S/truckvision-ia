import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/application/container";
import { IacScore, Markdown, PriorityBadge, SignalTimeline } from "@/components/domain";
import { Badge, Card, CardTitle, EmptyState } from "@/components/ui";
import { STATUS_LABEL, type AnalysisType } from "@/domain/entities";
import { IAC_CRITERIA_LABEL, IAC_WEIGHTS } from "@/domain/rules/iac";
import { GenerateAnalysisButton, InteractionForm, SignalForm } from "@/features/forms";
import { formatDate } from "@/lib/utils";

const ANALYSIS_LABEL: Record<AnalysisType, string> = {
  summary: "Resumo",
  justification: "Justificativa da oportunidade",
  iac_explanation: "Explicação do IAC",
  approach: "Hipótese de abordagem",
  briefing: "Briefing pré-visita",
};

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getRepository();
  const company = await repo.getCompany(id);
  if (!company) notFound();

  const [opportunity, signals, analyses, interactions, sources] = await Promise.all([
    repo.getOpenOpportunity(id),
    repo.listSignals({ companyId: id }),
    repo.listAnalyses(id),
    repo.listInteractions(id),
    repo.listSources(),
  ]);
  const breakdown = opportunity?.iac_breakdown;
  const criteria = Object.keys(IAC_WEIGHTS) as (keyof typeof IAC_WEIGHTS)[];

  return (
    <>
      <Link href="/empresas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Empresas
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{company.company_name}</h1>
          <p className="mt-1 text-sm text-muted">
            {[company.segment, company.city && `${company.city}/${company.state ?? "MA"}`, company.cnpj]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={opportunity?.priority} />
            {opportunity && <Badge className="bg-slate-100 text-slate-700">{STATUS_LABEL[opportunity.status]}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <GenerateAnalysisButton companyId={id} kind="justification" label="Por que essa empresa?" variant="secondary" />
          <GenerateAnalysisButton companyId={id} kind="briefing" label="Gerar briefing pré-visita" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>IAC — Índice de Antecipação Comercial</CardTitle>
              <IacScore score={opportunity?.iac_score ?? 0} />
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {criteria.map((k) => {
                const points = breakdown?.[k] ?? 0;
                return (
                  <div key={k} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted">{IAC_CRITERIA_LABEL[k]}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {points}
                      <span className="text-xs font-normal text-muted">/{IAC_WEIGHTS[k]}</span>
                    </p>
                    <p className="text-[11px] text-muted">{breakdown?.evidence[k]?.length ?? 0} evidência(s)</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Faixas: Alta prioridade 80–100 · Média 50–79 · Exploratório 0–49. Sinais de relevância baixa ou com mais de
              180 dias não pontuam.
            </p>
          </Card>

          <Card>
            <CardTitle className="mb-4">Análises da IA</CardTitle>
            {analyses.length ? (
              <div className="space-y-5">
                {analyses.map((a) => (
                  <article key={a.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <Badge className="bg-primary/10 text-primary">{ANALYSIS_LABEL[a.analysis_type]}</Badge>
                      <span>{formatDate(a.created_at)}</span>
                      <span>· {a.model_name}</span>
                    </div>
                    <Markdown text={a.content ?? ""} />
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>Gere a justificativa ou o briefing pré-visita para ver a análise aqui.</EmptyState>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-4">Sinais de mercado ({signals.length})</CardTitle>
            {signals.length ? (
              <SignalTimeline signals={signals} showCompany={false} />
            ) : (
              <EmptyState>Nenhum sinal ainda.</EmptyState>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">Registrar sinal</CardTitle>
            <SignalForm companies={[]} sources={sources} companyId={id} />
          </Card>
          <Card>
            <CardTitle className="mb-3">Ação comercial</CardTitle>
            <InteractionForm companyId={id} />
            <ul className="mt-4 space-y-3">
              {interactions.map((i) => (
                <li key={i.id} className="border-l-2 border-secondary pl-3 text-sm">
                  <p className="text-xs text-muted">
                    {formatDate(i.interaction_date)}
                    {i.result && <> · <strong className="text-foreground">{i.result}</strong></>}
                  </p>
                  <p>{i.notes}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
