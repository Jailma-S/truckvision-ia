import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Company,
  IAAnalysis,
  Interaction,
  Opportunity,
  OpportunityStatus,
  OpportunityWithCompany,
  Signal,
  SignalWithRefs,
  Source,
} from "@/domain/entities";
import type {
  CompanyFilter,
  NewAnalysis,
  NewCompany,
  NewSignal,
  OpportunityUpsert,
  TruckVisionRepository,
} from "@/domain/repositories";

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export class SupabaseRepository implements TruckVisionRepository {
  readonly mode = "supabase" as const;

  constructor(private readonly db: SupabaseClient) {}

  async listCompanies(filter: CompanyFilter = {}) {
    let query = this.db.from("companies").select("*, opportunities(*)").order("company_name");
    if (filter.city) query = query.eq("city", filter.city);
    if (filter.segment) query = query.eq("segment", filter.segment);
    if (filter.search) query = query.ilike("company_name", `%${filter.search}%`);
    const rows = check(await query) as (Company & { opportunities: Opportunity[] })[];
    return rows
      .map(({ opportunities, ...c }) => ({
        ...c,
        opportunity: opportunities.find((o) => o.status !== "closed") ?? null,
      }))
      .filter((c) => !filter.priority || c.opportunity?.priority === filter.priority)
      .sort((a, b) => (b.opportunity?.iac_score ?? -1) - (a.opportunity?.iac_score ?? -1));
  }

  async getCompany(id: string) {
    return check(await this.db.from("companies").select("*").eq("id", id).maybeSingle()) as Company | null;
  }

  async findCompanyByName(name: string) {
    const rows = check(
      await this.db.from("companies").select("*").ilike("company_name", name.trim()).limit(1),
    ) as Company[];
    return rows[0] ?? null;
  }

  async createCompany(input: NewCompany) {
    return check(await this.db.from("companies").insert(input).select().single()) as Company;
  }

  async listSources() {
    return check(await this.db.from("sources").select("*").order("source_name")) as Source[];
  }

  async listSignals(opts: { companyId?: string; sinceDays?: number; limit?: number } = {}) {
    let query = this.db
      .from("market_signals")
      .select("*, company:companies(id, company_name, city), source:sources(id, source_name, reliability_score)")
      .order("signal_date", { ascending: false, nullsFirst: false })
      .limit(opts.limit ?? 500);
    if (opts.companyId) query = query.eq("company_id", opts.companyId);
    if (opts.sinceDays) {
      const since = new Date(Date.now() - opts.sinceDays * 86_400_000).toISOString().slice(0, 10);
      query = query.gte("signal_date", since);
    }
    return check(await query) as SignalWithRefs[];
  }

  async signalExists(companyId: string, url: string) {
    const { count } = await this.db
      .from("market_signals")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("url", url);
    return (count ?? 0) > 0;
  }

  async createSignal(input: NewSignal) {
    return check(await this.db.from("market_signals").insert(input).select().single()) as Signal;
  }

  async deleteSimulatedSignals() {
    const rows = check(
      await this.db.from("market_signals").delete().eq("created_by", "simulation").select("company_id"),
    ) as { company_id: string }[];
    return [...new Set(rows.map((r) => r.company_id))];
  }

  async listOpportunities() {
    return check(
      await this.db.from("opportunities").select("*, company:companies(*)").order("iac_score", { ascending: false }),
    ) as OpportunityWithCompany[];
  }

  async getOpenOpportunity(companyId: string) {
    return check(
      await this.db.from("opportunities").select("*").eq("company_id", companyId).neq("status", "closed").maybeSingle(),
    ) as Opportunity | null;
  }

  async upsertOpenOpportunity(input: OpportunityUpsert) {
    const existing = await this.getOpenOpportunity(input.company_id);
    if (existing) {
      return check(
        await this.db.from("opportunities").update(input).eq("id", existing.id).select().single(),
      ) as Opportunity;
    }
    return check(await this.db.from("opportunities").insert(input).select().single()) as Opportunity;
  }

  async updateOpportunityStatus(id: string, status: OpportunityStatus) {
    check(await this.db.from("opportunities").update({ status }).eq("id", id));
  }

  async listAnalyses(companyId: string) {
    return check(
      await this.db
        .from("ia_analyses")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
    ) as IAAnalysis[];
  }

  async createAnalysis(input: NewAnalysis) {
    return check(await this.db.from("ia_analyses").insert(input).select().single()) as IAAnalysis;
  }

  async listInteractions(companyId: string) {
    return check(
      await this.db
        .from("interactions")
        .select("*")
        .eq("company_id", companyId)
        .order("interaction_date", { ascending: false }),
    ) as Interaction[];
  }

  async createInteraction(input: Pick<Interaction, "company_id" | "opportunity_id" | "notes" | "result">) {
    return check(await this.db.from("interactions").insert(input).select().single()) as Interaction;
  }
}
