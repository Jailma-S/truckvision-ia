import type {
  AnalysisType,
  Company,
  IAAnalysis,
  IACBreakdown,
  Interaction,
  Opportunity,
  OpportunityStatus,
  OpportunityWithCompany,
  Priority,
  Relevance,
  Signal,
  SignalType,
  SignalWithRefs,
  Source,
} from "@/domain/entities";

export interface CompanyFilter {
  city?: string;
  segment?: string;
  priority?: Priority;
  search?: string;
}

export type NewCompany = Pick<Company, "company_name"> &
  Partial<Pick<Company, "cnpj" | "segment" | "city" | "state" | "website" | "notes">>;

export interface NewSignal {
  company_id: string;
  source_id: string | null;
  signal_type: SignalType;
  title: string;
  content: string | null;
  url: string | null;
  signal_date: string | null;
  summary: string | null;
  evidence: string[] | null;
  relevance: Relevance;
  relevance_score: number;
  /** "simulation": criado pelo botão de demonstração e removido por "Restaurar demo" */
  created_by: "manual" | "agent" | "simulation";
}

export interface OpportunityUpsert {
  company_id: string;
  title: string;
  description: string | null;
  iac_score: number;
  iac_breakdown: IACBreakdown;
  priority: Priority;
}

export interface NewAnalysis {
  company_id: string;
  opportunity_id: string | null;
  analysis_type: AnalysisType;
  content: string;
  model_name: string;
}

export interface TruckVisionRepository {
  readonly mode: "supabase" | "demo";

  listCompanies(filter?: CompanyFilter): Promise<(Company & { opportunity: Opportunity | null })[]>;
  getCompany(id: string): Promise<Company | null>;
  findCompanyByName(name: string): Promise<Company | null>;
  createCompany(input: NewCompany): Promise<Company>;

  listSources(): Promise<Source[]>;

  listSignals(opts?: { companyId?: string; sinceDays?: number; limit?: number }): Promise<SignalWithRefs[]>;
  signalExists(companyId: string, url: string): Promise<boolean>;
  createSignal(input: NewSignal): Promise<Signal>;
  /** Remove os sinais de simulação e devolve os ids das empresas afetadas. */
  deleteSimulatedSignals(): Promise<string[]>;

  listOpportunities(): Promise<OpportunityWithCompany[]>;
  getOpenOpportunity(companyId: string): Promise<Opportunity | null>;
  upsertOpenOpportunity(input: OpportunityUpsert): Promise<Opportunity>;
  updateOpportunityStatus(id: string, status: OpportunityStatus): Promise<void>;

  listAnalyses(companyId: string): Promise<IAAnalysis[]>;
  createAnalysis(input: NewAnalysis): Promise<IAAnalysis>;

  listInteractions(companyId: string): Promise<Interaction[]>;
  createInteraction(input: Pick<Interaction, "company_id" | "opportunity_id" | "notes" | "result">): Promise<Interaction>;
}
