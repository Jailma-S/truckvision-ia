import type {
  Company,
  IAAnalysis,
  Interaction,
  Opportunity,
  OpportunityStatus,
  Signal,
  SignalWithRefs,
} from "@/domain/entities";
import type {
  CompanyFilter,
  NewAnalysis,
  NewCompany,
  NewSignal,
  OpportunityUpsert,
  TruckVisionRepository,
} from "@/domain/repositories";
import { calculateIAC, classifyPriority } from "@/domain/rules/iac";
import { demoCompanies, demoSignals, demoSources } from "./demo-data";

interface DemoStore {
  companies: Company[];
  signals: Signal[];
  opportunities: Opportunity[];
  analyses: IAAnalysis[];
  interactions: Interaction[];
}

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function seed(): DemoStore {
  const store: DemoStore = {
    companies: structuredClone(demoCompanies),
    signals: structuredClone(demoSignals),
    opportunities: [],
    analyses: [],
    interactions: [],
  };
  const statuses: OpportunityStatus[] = ["investigating", "identified", "contacted", "identified", "identified"];
  for (const company of store.companies) {
    const signals = store.signals.filter((s) => s.company_id === company.id);
    if (!signals.length) continue;
    const { score, breakdown } = calculateIAC(signals, demoSources);
    store.opportunities.push({
      id: id(),
      company_id: company.id,
      title: `Potencial de renovação/ampliação de frota — ${company.company_name}`,
      description: null,
      status: statuses[store.opportunities.length % statuses.length],
      iac_score: score,
      iac_breakdown: breakdown,
      priority: classifyPriority(score),
      estimated_units: null,
      created_at: signals[signals.length - 1].created_at,
      updated_at: now(),
    });
  }
  return store;
}

// Sobrevive ao hot reload do Next em dev.
const g = globalThis as unknown as { __truckvisionDemo?: DemoStore };
const store = () => (g.__truckvisionDemo ??= seed());

export class DemoRepository implements TruckVisionRepository {
  readonly mode = "demo" as const;

  async listCompanies(filter: CompanyFilter = {}) {
    const { companies, opportunities } = store();
    return companies
      .map((c) => ({
        ...c,
        opportunity: opportunities.find((o) => o.company_id === c.id && o.status !== "closed") ?? null,
      }))
      .filter((c) => !filter.city || c.city === filter.city)
      .filter((c) => !filter.segment || c.segment === filter.segment)
      .filter((c) => !filter.priority || c.opportunity?.priority === filter.priority)
      .filter((c) => !filter.search || c.company_name.toLowerCase().includes(filter.search.toLowerCase()))
      .sort((a, b) => (b.opportunity?.iac_score ?? -1) - (a.opportunity?.iac_score ?? -1));
  }

  async getCompany(companyId: string) {
    return store().companies.find((c) => c.id === companyId) ?? null;
  }

  async findCompanyByName(name: string) {
    const q = name.trim().toLowerCase();
    return store().companies.find((c) => c.company_name.toLowerCase() === q) ?? null;
  }

  async createCompany(input: NewCompany) {
    const company: Company = {
      id: id(),
      cnpj: null,
      segment: null,
      city: null,
      state: "MA",
      website: null,
      notes: null,
      ...input,
      created_at: now(),
    };
    store().companies.push(company);
    return company;
  }

  async listSources() {
    return demoSources;
  }

  async listSignals(opts: { companyId?: string; sinceDays?: number; limit?: number } = {}): Promise<SignalWithRefs[]> {
    const { signals, companies } = store();
    const since = opts.sinceDays ? Date.now() - opts.sinceDays * 86_400_000 : 0;
    return signals
      .filter((s) => !opts.companyId || s.company_id === opts.companyId)
      .filter((s) => new Date(s.signal_date ?? s.created_at).getTime() >= since)
      .sort((a, b) => (b.signal_date ?? b.created_at).localeCompare(a.signal_date ?? a.created_at))
      .slice(0, opts.limit ?? 500)
      .map((s) => {
        const company = companies.find((c) => c.id === s.company_id);
        const source = demoSources.find((src) => src.id === s.source_id);
        return {
          ...s,
          company: company ? { id: company.id, company_name: company.company_name, city: company.city } : null,
          source: source
            ? { id: source.id, source_name: source.source_name, reliability_score: source.reliability_score }
            : null,
        };
      });
  }

  async signalExists(companyId: string, url: string) {
    return store().signals.some((s) => s.company_id === companyId && s.url === url);
  }

  async createSignal(input: NewSignal) {
    const signal: Signal = { ...input, id: id(), created_at: now() };
    store().signals.push(signal);
    return signal;
  }

  async listOpportunities() {
    const { opportunities, companies } = store();
    return opportunities
      .map((o) => ({ ...o, company: companies.find((c) => c.id === o.company_id)! }))
      .sort((a, b) => b.iac_score - a.iac_score);
  }

  async getOpenOpportunity(companyId: string) {
    return store().opportunities.find((o) => o.company_id === companyId && o.status !== "closed") ?? null;
  }

  async upsertOpenOpportunity(input: OpportunityUpsert) {
    const existing = await this.getOpenOpportunity(input.company_id);
    if (existing) {
      Object.assign(existing, input, { updated_at: now() });
      return existing;
    }
    const opportunity: Opportunity = {
      ...input,
      id: id(),
      status: "identified",
      estimated_units: null,
      created_at: now(),
      updated_at: now(),
    };
    store().opportunities.push(opportunity);
    return opportunity;
  }

  async updateOpportunityStatus(opportunityId: string, status: OpportunityStatus) {
    const o = store().opportunities.find((x) => x.id === opportunityId);
    if (o) Object.assign(o, { status, updated_at: now() });
  }

  async listAnalyses(companyId: string) {
    return store()
      .analyses.filter((a) => a.company_id === companyId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createAnalysis(input: NewAnalysis) {
    const analysis: IAAnalysis = { ...input, id: id(), created_at: now() };
    store().analyses.push(analysis);
    return analysis;
  }

  async listInteractions(companyId: string) {
    return store()
      .interactions.filter((i) => i.company_id === companyId)
      .sort((a, b) => b.interaction_date.localeCompare(a.interaction_date));
  }

  async createInteraction(input: Pick<Interaction, "company_id" | "opportunity_id" | "notes" | "result">) {
    const interaction: Interaction = { ...input, id: id(), interaction_date: now(), created_at: now() };
    store().interactions.push(interaction);
    return interaction;
  }
}
