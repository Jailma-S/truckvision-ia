import { AlarmClock, CalendarClock, CircleDollarSign, Hourglass } from "lucide-react";
import { getRepository } from "@/application/container";
import { getPurchaseWindowsUseCase, WINDOW_ASSUMPTIONS } from "@/application/use-cases/purchase-window";
import { KpiCard } from "@/components/domain";
import { PageHeader } from "@/components/ui";
import { SIGNAL_TYPE_LABEL, type SignalType } from "@/domain/entities";
import { PurchaseTimeline } from "@/features/purchase-timeline";
import { formatBRLCompact } from "@/lib/utils";

export default async function PurchaseWindowPage() {
  const { windows, today, summary } = await getPurchaseWindowsUseCase(await getRepository());
  const a = WINDOW_ASSUMPTIONS;

  return (
    <>
      <div className="reveal">
        <PageHeader
          title="Janela de Compra"
          description="Quando cada empresa vai precisar de caminhões — e o momento certo de chegar antes da concorrência."
        >
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Prazos estimados com premissas fictícias
          </span>
        </PageHeader>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={1} icon={AlarmClock} label="Na janela agora" value={summary.now} hint="abordar esta semana" highlight />
        <KpiCard index={2} icon={CalendarClock} label="Abrem em 30 dias" value={summary.soon} hint="preparar abordagem" />
        <KpiCard index={3} icon={Hourglass} label="Janela passando" value={summary.losing} hint="risco de perder para concorrente" />
        <KpiCard index={4} icon={CircleDollarSign} label="Pipeline na janela" value={formatBRLCompact(summary.pipelineNow)} hint="valores fictícios" />
      </div>

      <PurchaseTimeline windows={windows} today={today} />

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Como a janela é estimada: a partir do sinal mais urgente de cada empresa, a necessidade de caminhões é projetada
        em{" "}
        {(Object.keys(a.needAfterSignal) as SignalType[])
          .map((k) => `${SIGNAL_TYPE_LABEL[k].toLowerCase()} ${a.needAfterSignal[k][0]}–${a.needAfterSignal[k][1]} dias`)
          .join(" · ")}
        . A abordagem ideal vai de {a.approachStartBefore} a {a.approachEndBefore} dias antes dessa data. Premissas
        fictícias — calibrar com o histórico real de vendas.
      </p>
    </>
  );
}
