import { getRepository } from "@/application/container";
import { getAlertsUseCase } from "@/application/use-cases/alerts";
import { PageHeader } from "@/components/ui";
import { AlertList } from "@/features/alerts";

export default async function AlertsPage() {
  const alerts = await getAlertsUseCase(await getRepository());
  return (
    <>
      <div className="reveal">
        <PageHeader
          title="Central de Alertas"
          description="O que mudou e pede ação: sinais novos de alta relevância, prioridades sem contato e oportunidades paradas."
        />
      </div>
      <AlertList alerts={alerts} />
    </>
  );
}
