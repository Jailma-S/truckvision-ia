import { CircleDollarSign, Building2, MapPinned } from "lucide-react";
import { getRepository } from "@/application/container";
import { getTerritoryUseCase } from "@/application/use-cases/territory";
import { KpiCard } from "@/components/domain";
import { PageHeader } from "@/components/ui";
import { TerritoryMap } from "@/features/territory-map";
import { formatBRLCompact } from "@/lib/utils";

export default async function MapPage() {
  const { points, unmatched, totals } = await getTerritoryUseCase(await getRepository());

  return (
    <>
      <div className="reveal">
        <PageHeader
          title="Mapa Territorial"
          description="Onde estão as oportunidades no Maranhão — base para a gestão territorial dos vendedores."
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard index={1} icon={MapPinned} label="Municípios com empresas" value={totals.municipalities} />
        <KpiCard index={2} icon={Building2} label="Empresas no mapa" value={totals.companies - unmatched.length} />
        <KpiCard
          index={3}
          icon={CircleDollarSign}
          label="Pipeline potencial (fictício)"
          value={formatBRLCompact(totals.pipeline)}
          highlight
        />
      </div>

      <TerritoryMap points={points} />

      {unmatched.length > 0 && (
        <p className="mt-4 text-xs text-muted">
          Sem município reconhecido (fora do mapa): {unmatched.join(", ")}. Confira o campo “Município” no cadastro.
        </p>
      )}
      <p className="mt-2 text-[11px] text-muted">Malha municipal: IBGE.</p>
    </>
  );
}
