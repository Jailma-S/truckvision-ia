import Link from "next/link";
import { getRepository } from "@/application/container";
import { IacScore, PriorityBadge } from "@/components/domain";
import { Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { STATUS_LABEL, type Priority } from "@/domain/entities";
import { CompanyForm } from "@/features/forms";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; segment?: string; priority?: Priority; q?: string }>;
}) {
  const params = await searchParams;
  const repo = await getRepository();
  const [all, companies] = await Promise.all([
    repo.listCompanies(),
    repo.listCompanies({ city: params.city, segment: params.segment, priority: params.priority, search: params.q }),
  ]);
  const cities = [...new Set(all.map((c) => c.city).filter(Boolean))].sort() as string[];
  const segments = [...new Set(all.map((c) => c.segment).filter(Boolean))].sort() as string[];

  return (
    <>
      <PageHeader title="Empresas" description={`${companies.length} de ${all.length} empresas`} />

      <Card className="mb-4 p-4">
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input name="q" placeholder="Buscar por nome" defaultValue={params.q} aria-label="Buscar por nome" />
          <Select name="city" defaultValue={params.city ?? ""} aria-label="Município">
            <option value="">Todos os municípios</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select name="segment" defaultValue={params.segment ?? ""} aria-label="Segmento">
            <option value="">Todos os segmentos</option>
            {segments.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select name="priority" defaultValue={params.priority ?? ""} aria-label="Potencial">
            <option value="">Todo potencial</option>
            <option value="alta">Alta prioridade</option>
            <option value="media">Prioridade média</option>
            <option value="exploratoria">Exploratório</option>
          </Select>
          <div className="flex gap-2">
            <Button className="flex-1">Filtrar</Button>
            <Link href="/empresas" className="inline-flex h-9 items-center px-2 text-sm text-muted hover:text-foreground">
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {companies.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-white/[0.03] text-left text-[11px] tracking-[0.08em] text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Município</th>
                  <th className="px-4 py-3 font-medium">Segmento</th>
                  <th className="px-4 py-3 font-medium">Potencial</th>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 font-medium">IAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-primary/[0.07]">
                    <td className="px-4 py-3">
                      <Link href={`/empresas/${c.id}`} className="font-medium text-white hover:text-accent">
                        {c.company_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{c.city ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{c.segment ?? "—"}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={c.opportunity?.priority} />
                    </td>
                    <td className="px-4 py-3 text-muted">{c.opportunity ? STATUS_LABEL[c.opportunity.status] : "—"}</td>
                    <td className="px-4 py-3">{c.opportunity ? <IacScore score={c.opportunity.iac_score} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState>Nenhuma empresa encontrada com esses filtros.</EmptyState>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 text-sm font-semibold">Cadastrar empresa (lead)</h2>
        <CompanyForm />
      </Card>
    </>
  );
}
