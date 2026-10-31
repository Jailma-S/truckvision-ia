/**
 * Carrega no Supabase as mesmas empresas e sinais FICTÍCIOS do modo demonstração
 * e calcula o IAC de cada empresa com a regra do app.
 *
 *   npm run seed:demo           carrega (pula empresas que já existem)
 *   npm run seed:demo -- --clean  apaga tudo que termina em "(demo)"
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local
 * e as migrations + seed.sql já aplicados.
 */
import { createClient } from "@supabase/supabase-js";
import { calculateIACUseCase } from "@/application/use-cases/calculate-iac";
import type { OpportunityStatus } from "@/domain/entities";
import { demoCompanies, demoSignals, demoSources } from "@/infrastructure/demo/demo-data";
import { SupabaseRepository } from "@/infrastructure/supabase/supabase-repository";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const repo = new SupabaseRepository(db);

async function clean() {
  const { data, error } = await db.from("companies").delete().like("company_name", "%(demo)").select("id");
  if (error) throw error;
  console.log(`Removidas ${data.length} empresas fictícias (sinais, oportunidades e análises saem em cascata).`);
}

async function seed() {
  const sources = await repo.listSources();
  if (!sources.length) throw new Error("Tabela sources vazia: rode supabase/seed.sql antes.");
  const sourceId = new Map(
    demoSources.map((d) => [d.id, sources.find((s) => s.source_name === d.source_name)?.id ?? null]),
  );

  const statuses: OpportunityStatus[] = ["investigating", "identified", "contacted", "identified", "identified"];
  let created = 0;

  for (const demo of demoCompanies) {
    if (await repo.findCompanyByName(demo.company_name)) {
      console.log(`= ${demo.company_name} já existe, pulando`);
      continue;
    }
    const company = await repo.createCompany({
      company_name: demo.company_name,
      segment: demo.segment,
      city: demo.city,
      state: demo.state,
      notes: demo.notes,
    });

    const signals = demoSignals.filter((s) => s.company_id === demo.id);
    for (const s of signals) {
      await repo.createSignal({
        company_id: company.id,
        source_id: s.source_id ? (sourceId.get(s.source_id) ?? null) : null,
        signal_type: s.signal_type,
        title: s.title,
        content: s.content,
        url: null,
        signal_date: s.signal_date,
        summary: s.summary,
        evidence: s.evidence,
        relevance: s.relevance,
        relevance_score: s.relevance_score,
        created_by: "manual",
      });
    }

    const opportunity = await calculateIACUseCase(repo, company.id);
    if (opportunity) {
      await repo.updateOpportunityStatus(opportunity.id, statuses[created % statuses.length]);
    }
    created++;
    console.log(`+ ${company.company_name}: ${signals.length} sinais, IAC ${opportunity?.iac_score ?? "—"}`);
  }
  console.log(`\nConcluído: ${created} empresas fictícias criadas.`);
}

(process.argv.includes("--clean") ? clean() : seed()).catch((err) => {
  console.error(err);
  process.exit(1);
});
