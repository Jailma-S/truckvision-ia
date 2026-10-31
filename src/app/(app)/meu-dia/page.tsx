import { AlarmClock, CircleDollarSign, ListChecks, Target } from "lucide-react";
import Link from "next/link";
import { getRepository } from "@/application/container";
import { getSellerDayUseCase } from "@/application/use-cases/seller-day";
import { getTerritoryUseCase } from "@/application/use-cases/territory";
import { KpiCard } from "@/components/domain";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { SellerActions } from "@/features/seller-day";
import { formatBRLCompact } from "@/lib/utils";

function greeting() {
  const hour = Number(
    new Date().toLocaleString("pt-BR", { hour: "2-digit", hour12: false, timeZone: "America/Fortaleza" }),
  );
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

export default async function SellerDayPage() {
  const repo = await getRepository();
  const [{ actions, summary }, { points }] = await Promise.all([getSellerDayUseCase(repo), getTerritoryUseCase(repo)]);
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Fortaleza",
  });

  return (
    <>
      <div className="reveal">
        <PageHeader title={`${greeting()}! Este é o seu dia.`} description={`${today} · carteira de demonstração: Maranhão`} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={1} icon={ListChecks} label="Ações para hoje" value={summary.today} highlight />
        <KpiCard index={2} icon={AlarmClock} label="Follow-ups atrasados" value={summary.overdue} />
        <KpiCard index={3} icon={Target} label="Alta prioridade" value={summary.highPriority} />
        <KpiCard index={4} icon={CircleDollarSign} label="Pipeline da carteira" value={formatBRLCompact(summary.pipeline)} hint="valores fictícios" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Próximas melhores ações</h2>
          <SellerActions actions={actions} />
          <p className="mt-3 text-[11px] text-muted">
            Prazos e atrasos são fictícios (demonstração). As ações seguem a etapa de cada oportunidade e o motivo vem do
            sinal mais recente.
          </p>
        </section>

        <aside className="space-y-6">
          <Card style={{ ["--i" as string]: 3 }}>
            <div className="mb-3 flex items-center justify-between">
              <CardTitle>Seu território</CardTitle>
              <Link href="/mapa" className="text-xs font-medium text-accent hover:underline">
                Abrir mapa
              </Link>
            </div>
            <ul className="space-y-2">
              {points.slice(0, 6).map((p) => (
                <li key={p.code} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.03] px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{p.name}</span>
                    <span className="text-xs text-muted">
                      {p.companies.length} empresa(s) · {p.highPriority} alta
                    </span>
                  </span>
                  <span className="font-display text-sm font-bold text-emerald-300 tabular-nums">{formatBRLCompact(p.pipeline)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card style={{ ["--i" as string]: 4 }}>
            <CardTitle>Dica do dia</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Antes de cada visita, gere o <strong className="text-white">briefing pré-visita</strong> na página da empresa:
              ele traz as evidências e as perguntas certas para a conversa.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
