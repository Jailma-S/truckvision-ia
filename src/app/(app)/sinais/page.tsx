import Link from "next/link";
import { getRepository } from "@/application/container";
import { SignalTimeline } from "@/components/domain";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { SIGNAL_TYPES, SIGNAL_TYPE_LABEL, type SignalType } from "@/domain/entities";
import { SignalForm } from "@/features/forms";
import { cn } from "@/lib/utils";

const PERIODS = [
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
  { days: 0, label: "Tudo" },
];

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: SignalType; days?: string }>;
}) {
  const params = await searchParams;
  const days = Number(params.days ?? 90);
  const repo = await getRepository();
  const [signals, companies, sources] = await Promise.all([
    repo.listSignals({ sinceDays: days || undefined }),
    repo.listCompanies(),
    repo.listSources(),
  ]);
  const filtered = params.type ? signals.filter((s) => s.signal_type === params.type) : signals;
  const href = (p: { type?: string; days?: number }) => {
    const q = new URLSearchParams();
    const type = "type" in p ? p.type : params.type;
    if (type) q.set("type", type);
    q.set("days", String(p.days ?? days));
    return `/sinais?${q}`;
  };
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium",
      active ? "border-primary bg-primary text-white" : "border-border bg-white text-muted hover:text-foreground",
    );

  return (
    <>
      <PageHeader
        title="Inteligência de Mercado"
        description="Sinais públicos de crescimento empresarial, classificados por IA."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <Link key={p.days} href={href({ days: p.days })} className={chip(days === p.days)}>
                {p.label}
              </Link>
            ))}
            <span className="mx-1 w-px bg-border" />
            <Link href={href({ type: undefined })} className={chip(!params.type)}>
              Todos
            </Link>
            {SIGNAL_TYPES.map((t) => (
              <Link key={t} href={href({ type: t })} className={chip(params.type === t)}>
                {SIGNAL_TYPE_LABEL[t]}
              </Link>
            ))}
          </div>
          {filtered.length ? <SignalTimeline signals={filtered} /> : <EmptyState>Nenhum sinal no período.</EmptyState>}
        </Card>
        <Card className="h-fit">
          <CardTitle className="mb-4">Registrar sinal</CardTitle>
          <SignalForm companies={companies} sources={sources} />
        </Card>
      </div>
    </>
  );
}
