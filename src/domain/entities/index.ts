export const SIGNAL_TYPES = [
  "contract",
  "investment",
  "expansion",
  "logistics",
  "industry",
  "fleet",
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const SIGNAL_TYPE_LABEL: Record<SignalType, string> = {
  contract: "Novo contrato",
  investment: "Investimento",
  expansion: "Expansão operacional",
  logistics: "Logística",
  industry: "Indústria",
  fleet: "Frota",
};

export type Priority = "alta" | "media" | "exploratoria";
export const PRIORITY_LABEL: Record<Priority, string> = {
  alta: "Alta prioridade",
  media: "Prioridade média",
  exploratoria: "Exploratório",
};

export type Relevance = "alta" | "media" | "baixa";

export const OPPORTUNITY_STATUSES = [
  "identified",
  "investigating",
  "contacted",
  "validated",
  "closed",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export const STATUS_LABEL: Record<OpportunityStatus, string> = {
  identified: "Identificada",
  investigating: "Investigação",
  contacted: "Contato",
  validated: "Validada",
  closed: "Encerrada",
};

export type AnalysisType =
  | "summary"
  | "justification"
  | "iac_explanation"
  | "approach"
  | "briefing";

export interface Company {
  id: string;
  company_name: string;
  cnpj: string | null;
  segment: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
}

export interface Source {
  id: string;
  source_name: string;
  source_url: string | null;
  feed_url: string | null;
  reliability_score: number;
  active: boolean;
}

export interface Signal {
  id: string;
  company_id: string | null;
  source_id: string | null;
  signal_type: SignalType;
  title: string;
  content: string | null;
  url: string | null;
  summary: string | null;
  evidence: string[] | null;
  signal_date: string | null;
  relevance: Relevance;
  relevance_score: number;
  created_by: string;
  created_at: string;
}

export interface IACBreakdown {
  contract: number;
  expansion: number;
  investment: number;
  reliable_source: number;
  recent: number;
  /** ids dos sinais que sustentaram cada critério */
  evidence: Partial<Record<keyof Omit<IACBreakdown, "evidence">, string[]>>;
}

export interface Opportunity {
  id: string;
  company_id: string;
  title: string | null;
  description: string | null;
  status: OpportunityStatus;
  iac_score: number;
  iac_breakdown: IACBreakdown | null;
  priority: Priority;
  estimated_units: number | null;
  created_at: string;
  updated_at: string;
}

export interface IAAnalysis {
  id: string;
  opportunity_id: string | null;
  company_id: string | null;
  analysis_type: AnalysisType;
  content: string | null;
  model_name: string | null;
  created_at: string;
}

export interface Interaction {
  id: string;
  company_id: string;
  opportunity_id: string | null;
  interaction_date: string;
  notes: string | null;
  result: string | null;
  created_at: string;
}

export type OpportunityWithCompany = Opportunity & { company: Company };
export type SignalWithRefs = Signal & {
  company: Pick<Company, "id" | "company_name" | "city"> | null;
  source: Pick<Source, "id" | "source_name" | "reliability_score"> | null;
};
