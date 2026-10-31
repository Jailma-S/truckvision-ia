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
        <div data-tour="kanban" className="grid min-w-[1100px] grid-cols-5 gap-4">
          {OPPORTUNITY_STATUSES.map((status, col) => {
            const items = opportunities.filter((o) => o.status === status);
            return (
              <section
                key={status}
                className="rounded-2xl border border-border bg-black/20 p-3 shadow-[inset_0_2px_8px_rgb(0_0_0/0.45)]"
              >
                <h2 className="mb-3 flex items-center justify-between px-1 text-[11px] font-semibold tracking-[0.1em] text-slate-300 uppercase">
                  {STATUS_LABEL[status]}
                  <span className="tile-3d rounded-full px-2 py-0.5 text-white tabular-nums">{items.length}</span>
                </h2>
                <div className="space-y-3">
                  {items.map((o, i) => (
                    <article
                      key={o.id}
                      className={`card-3d reveal lift rounded-xl p-3 ${o.priority === "alta" ? "card-glow" : ""}`}
                      style={{ ["--i" as string]: col * 2 + i }}
                    >
                      <Link href={`/empresas/${o.company_id}`} className="text-sm font-medium text-white hover:text-accent">
                        {o.company.company_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {o.company.city} · atualizado {formatDate(o.updated_at)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <PriorityBadge priority={o.priority} />
                        <IacScore score={o.iac_score} index={col * 2 + i} />
                      </div>
                      <form action={moveOpportunityAction} className="mt-3 flex gap-1">
                        <input type="hidden" name="id" value={o.id} />
                        <select
                          name="status"
                          defaultValue={o.status}
                          aria-label="Etapa"
                          className="field-3d h-8 flex-1 rounded-md border border-border px-2 text-xs text-foreground [&>option]:bg-card"
                        >
                          {OPPORTUNITY_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        <button className="btn-3d h-8 rounded-md px-2.5 text-xs font-medium text-white">
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
