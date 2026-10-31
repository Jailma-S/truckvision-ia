-- TruckVision IA — schema inicial (MVP)
-- Baseado no PRD v1.0, com ajustes:
--   * enums aplicados às colunas (signal_type, priority, status)
--   * market_signals.summary / evidence para rastreabilidade (IA 01)
--   * opportunities.iac_breakdown guarda os pesos usados (IA 03)
--   * ia_analyses.analysis_type distingue resumo, justificativa, briefing etc.
--   * RLS também em sources (ausente no PRD)

create extension if not exists pgcrypto;

-- ENUMS -------------------------------------------------------------------
create type signal_type_enum as enum (
  'contract', 'investment', 'expansion', 'logistics', 'industry', 'fleet'
);

create type priority_enum as enum ('alta', 'media', 'exploratoria');

create type opportunity_status_enum as enum (
  'identified', 'investigating', 'contacted', 'validated', 'closed'
);

create type relevance_enum as enum ('alta', 'media', 'baixa');

create type analysis_type_enum as enum (
  'summary', 'justification', 'iac_explanation', 'approach', 'briefing'
);

-- TABELAS -----------------------------------------------------------------
create table companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  cnpj varchar(18) unique,
  segment text,
  city text,
  state varchar(2) default 'MA',
  website text,
  notes text,
  created_at timestamptz default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text,
  feed_url text,                         -- RSS monitorado pelo agente (IA 08)
  reliability_score integer default 50 check (reliability_score between 0 and 100),
  active boolean default true,
  created_at timestamptz default now()
);

create table market_signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  signal_type signal_type_enum not null,
  title text not null,
  content text,
  url text,
  summary text,                          -- IA 01
  evidence text[],                       -- trechos que sustentam o sinal
  signal_date date,
  relevance relevance_enum default 'media', -- IA 07
  relevance_score integer default 0,
  created_by text default 'manual',      -- 'manual' | 'agent'
  created_at timestamptz default now(),
  unique (company_id, url)
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text,
  description text,
  status opportunity_status_enum default 'identified',
  iac_score integer default 0 check (iac_score between 0 and 100),
  iac_breakdown jsonb default '{}'::jsonb,
  priority priority_enum default 'exploratoria',
  estimated_units integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- no máximo uma oportunidade aberta por empresa
create unique index opportunities_one_open_per_company
  on opportunities (company_id) where status <> 'closed';

create table ia_analyses (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  analysis_type analysis_type_enum not null,
  summary text,
  justification text,
  recommendation text,
  content text,
  model_name text,
  created_at timestamptz default now()
);

create table interactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete set null,
  interaction_date timestamptz default now(),
  notes text,
  result text,
  created_at timestamptz default now()
);

create index market_signals_company_idx on market_signals (company_id, signal_date desc);
create index opportunities_score_idx on opportunities (iac_score desc);
create index companies_city_idx on companies (city);

-- updated_at automático
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger opportunities_updated_at before update on opportunities
  for each row execute function set_updated_at();

-- ROW LEVEL SECURITY ------------------------------------------------------
alter table companies enable row level security;
alter table sources enable row level security;
alter table market_signals enable row level security;
alter table opportunities enable row level security;
alter table ia_analyses enable row level security;
alter table interactions enable row level security;

-- Política inicial MVP: qualquer usuário autenticado lê e escreve.
create policy authenticated_users on companies      for all to authenticated using (true) with check (true);
create policy authenticated_users on sources        for all to authenticated using (true) with check (true);
create policy authenticated_users on market_signals for all to authenticated using (true) with check (true);
create policy authenticated_users on opportunities  for all to authenticated using (true) with check (true);
create policy authenticated_users on ia_analyses    for all to authenticated using (true) with check (true);
create policy authenticated_users on interactions   for all to authenticated using (true) with check (true);
