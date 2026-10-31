import { CircleDollarSign, ClipboardCheck, Gauge, Truck, Wrench, Package, Satellite, CalendarCog } from "lucide-react";
import Link from "next/link";
import { getRepository } from "@/application/container";
import { AFTERMARKET_ASSUMPTIONS, getAftermarketUseCase, type OfferKind } from "@/application/use-cases/aftermarket";
import { AftermarketHero } from "@/components/aftermarket-hero";
import { KpiCard } from "@/components/domain";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { cn, formatBRLCompact } from "@/lib/utils";

const OFFER_ICON: Record<OfferKind, typeof Wrench> = {
  contrato: ClipboardCheck,
  pecas: Package,
  telemetria: Satellite,
  revisao: CalendarCog,
};

export default async function AftermarketPage() {
  const { accounts, totals, perTruck, mix } = await getAftermarketUseCase(await getRepository());
  const a = AFTERMARKET_ASSUMPTIONS;
  const maxMix = Math.max(...mix.map((m) => m.revenue));
  const coveragePct = Math.round(totals.coverage * 100);
  const target = Math.round(a.coverageTarget * 100);

  return (
    <>
      <div className="reveal">
        <PageHeader
          title="Vision Aftermarket"
          description="Oportunidades de pós-venda na frota dos clientes: manutenção, peças e revisões — a receita que continua depois da venda."
        >
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
            Frotas e valores fictícios · margens de referência
          </span>
        </PageHeader>
      </div>

      <AftermarketHero
        saleMargin={perTruck.saleMargin}
        afterMargin={perTruck.afterMargin}
        multiple={perTruck.multiple}
        years={a.years}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard index={2} icon={Truck} label="Caminhões na base" value={totals.fleet} hint="frota estimada dos clientes" />
        <KpiCard index={3} icon={CircleDollarSign} label="Receita recorrente / ano" value={formatBRLCompact(totals.annualRevenue)} hint="potencial de pós-venda" highlight />
        <KpiCard index={4} icon={Gauge} label="Margem recorrente / ano" value={formatBRLCompact(totals.annualMargin)} hint="margens de referência" highlight />
        <KpiCard index={5} icon={ClipboardCheck} label="Cobertura de contratos" value={`${coveragePct}%`} hint={`referência de mercado: > ${target}%`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Contas e ofertas */}
        <Card className="overflow-hidden p-0" style={{ ["--i" as string]: 6 }}>
          <div className="p-5 pb-3">
            <CardTitle>Oferta recomendada por cliente</CardTitle>
            <p className="mt-1 text-xs text-muted">Ordenado pela margem recorrente potencial.</p>
          </div>
          <ul className="divide-y divide-border">
            {accounts.map((acc, i) => {
              const Icon = OFFER_ICON[acc.offer.kind];
              return (
                <li key={acc.companyId} className="reveal px-5 py-4 transition-colors hover:bg-primary/[0.06]" style={{ ["--i" as string]: 7 + i }}>
                  <div className="flex flex-wrap items-start gap-4">
                    <span className="tile-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/empresas/${acc.companyId}`} className="text-sm font-semibold text-white hover:text-accent">
                        {acc.companyName}
                      </Link>
                      <p className="text-[11px] text-muted">
                        {acc.city} · {acc.segment}
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-emerald-200">{acc.offer.title}</p>
                      <p className="text-xs text-slate-400">{acc.offer.why}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                        <span>
                          Frota <strong className="text-white tabular-nums">{acc.fleet}</strong>
                        </span>
                        <span>
                          Idade média <strong className="text-white tabular-nums">{acc.avgAge} anos</strong>
                        </span>
                        <span>
                          Vendidos pela Tracbel <strong className="text-white tabular-nums">{acc.soldByTracbel}</strong>
                        </span>
                        <span>
                          Com contrato{" "}
                          <strong className={cn("tabular-nums", acc.withContract < acc.soldByTracbel ? "text-amber-300" : "text-white")}>
                            {acc.withContract}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-emerald-300 tabular-nums">{formatBRLCompact(acc.annualMargin)}</p>
                      <p className="text-[11px] text-muted">margem / ano</p>
                      <p className="mt-1 text-xs text-slate-300 tabular-nums">{formatBRLCompact(acc.annualRevenue)} receita</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          {/* Mix por linha */}
          <Card style={{ ["--i" as string]: 7 }}>
            <CardTitle>Receita potencial por linha (ano)</CardTitle>
            <div className="mt-4 space-y-4">
              {mix.map((m, i) => (
                <div key={m.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-slate-300">{m.label}</span>
                    <span className="font-semibold text-white tabular-nums">{formatBRLCompact(m.revenue)}</span>
                  </div>
                  <div className="track-3d h-2.5 rounded-full">
                    <div
                      className="bar-glow fill-anim h-full rounded-full bg-[#3b82f6] text-[#3b82f6]"
                      style={{ width: `${(m.revenue / maxMix) * 100}%`, ["--i" as string]: 8 + i }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">margem de referência {Math.round(m.margin * 100)}%</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Cobertura */}
          <Card style={{ ["--i" as string]: 8 }}>
            <CardTitle>Caminhões vendidos sem contrato</CardTitle>
            <p className="font-display metric-glow mt-3 text-5xl font-bold text-amber-300 tabular-nums">{totals.uncoveredSold}</p>
            <p className="mt-1 text-sm text-slate-300">
              de {totals.sold} caminhões vendidos pela Tracbel nesta carteira ainda não têm contrato de manutenção — é a
              oportunidade mais rápida de pós-venda.
            </p>
            <div className="track-3d mt-4 h-3 rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            <p className="mt-1 flex justify-between text-[11px] text-muted">
              <span>cobertura atual {coveragePct}%</span>
              <span>referência &gt; {target}%</span>
            </p>
          </Card>

          <Card style={{ ["--i" as string]: 9 }}>
            <CardTitle>Premissas (fictícias)</CardTitle>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
              <li>
                Receita por caminhão/ano: manutenção {formatBRLCompact(a.revenuePerTruck.maintenance)}, peças{" "}
                {formatBRLCompact(a.revenuePerTruck.parts)}, revisões {formatBRLCompact(a.revenuePerTruck.reviews)}
              </li>
              <li>
                Margens de referência de mercado: serviços {Math.round(a.margin.maintenance * 100)}%, peças{" "}
                {Math.round(a.margin.parts * 100)}%, equipamento {Math.round(a.equipmentMargin * 100)}%
              </li>
              <li>Frota, idade e contratos de cada cliente são simulados.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
