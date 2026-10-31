import Link from "next/link";
import { getRepository } from "@/application/container";
import { IacScore, PriorityBadge } from "@/components/domain";
import { PageHeader } from "@/components/ui";
import { OPPORTUNITY_STATUSES, STATUS_LABEL } from "@/domain/entities";
import { moveOpportunityAction } from "@/features/actions";
import { formatDate } from "@/lib/utils";

export default async function OpportunitiesPage() {
  const opportunities = await (await getRepository()).listOpportunities();

  return (
    <>
      <PageHeader
        title="Oportunidades"
        description="Ordenadas por IAC. Mova a oportunidade de etapa conforme o avanço da abordagem."
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="grid min-w-[1100px] grid-cols-5 gap-4">
          {OPPORTUNITY_STATUSES.map((status) => {
            const items = opportunities.filter((o) => o.status === status);
            return (
              <section key={status} className="rounded-xl bg-slate-100/70 p-3">
                <h2 className="mb-3 flex items-center justify-between px-1 text-xs font-semibold tracking-wide text-muted uppercase">
                  {STATUS_LABEL[status]}
                  <span className="rounded-full bg-white px-2 py-0.5 text-foreground">{items.length}</span>
                </h2>
                <div className="space-y-3">
                  {items.map((o) => (
                    <article key={o.id} className="rounded-lg border border-border bg-white p-3 shadow-sm">
                      <Link href={`/empresas/${o.company_id}`} className="text-sm font-medium hover:text-primary">
                        {o.company.company_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {o.company.city} · atualizado {formatDate(o.updated_at)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <PriorityBadge priority={o.priority} />
                        <IacScore score={o.iac_score} />
                      </div>
                      <form action={moveOpportunityAction} className="mt-3 flex gap-1">
                        <input type="hidden" name="id" value={o.id} />
                        <select
                          name="status"
                          defaultValue={o.status}
                          aria-label="Etapa"
                          className="h-8 flex-1 rounded-md border border-border bg-white px-2 text-xs"
                        >
                          {OPPORTUNITY_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        <button className="h-8 rounded-md bg-slate-800 px-2 text-xs font-medium text-white hover:bg-slate-700">
                          Mover
                        </button>
                      </form>
                    </article>
                  ))}
                  {!items.length && <p className="px-1 text-xs text-muted">Vazio</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
