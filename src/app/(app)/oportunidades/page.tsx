import { getRepository } from "@/application/container";
import { getPipelineBoardUseCase } from "@/application/use-cases/pipeline-board";
import { PageHeader } from "@/components/ui";
import { Kanban } from "@/features/kanban";

export default async function OpportunitiesPage() {
  const { cards } = await getPipelineBoardUseCase(await getRepository());

  return (
    <>
      <div className="reveal">
        <PageHeader
          title="Oportunidades"
          description="O funil comercial do radar: arraste cada oportunidade conforme a abordagem avança."
        >
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Valores em R$ fictícios
          </span>
        </PageHeader>
      </div>
      <Kanban initial={cards} />
    </>
  );
}
