-- ─────────────────────────────────────────────────────────────────────────────
-- i9 Radar — Schema V0 (Sprint 1: Multiempresa, ICP, Radar, Empresas, Score,
-- Lead 360)
--
-- IMPORTANTE: este arquivo é um ARTEFATO DE ARQUITETURA — foi escrito para
-- revisão e futura aplicação, mas NÃO foi executado contra um banco Postgres
-- real nesta rodada (a V0 do produto roda inteiramente no navegador, sem
-- backend conectado — ver docs/architecture.md, seção "Pendências"). Antes de
-- aplicar em produção, revise nomes, tipos e políticas com o time responsável
-- pelo banco e rode os testes de isolamento multi-tenant descritos abaixo.
--
-- Cobre apenas as entidades da Sprint 1. Cadências, qualificação estruturada,
-- oportunidades com forecast, integrações de canal (WhatsApp/e-mail),
-- webhooks e auditoria completa de configurações ficam para as próximas fases
-- — o modelo completo de dados está referenciado em docs/architecture.md.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ── Multiempresa ─────────────────────────────────────────────────────────

create table organizations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  plan       text not null default 'demo' check (plan in ('demo', 'starter', 'pro')),
  city       text,
  state      char(2),
  created_at timestamptz not null default now()
);

create type org_role as enum ('admin', 'commercial_manager', 'sdr', 'closer', 'viewer', 'integration');

create table organization_members (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            org_role not null default 'sdr',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index organization_members_user_idx on organization_members (user_id);

-- Helper usado em praticamente toda política de RLS abaixo.
create or replace function is_org_member(target_org uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members
    where organization_id = target_org and user_id = auth.uid()
  );
$$;

-- ── ICP — Ideal Customer Profile ─────────────────────────────────────────

create table icp_profiles (
  id                  uuid primary key default uuid_generate_v4(),
  organization_id     uuid not null references organizations (id) on delete cascade,
  name                text not null,
  description         text,
  product_service     text,
  status              text not null default 'active' check (status in ('draft', 'active', 'archived')),
  current_version_id  uuid, -- FK adicionada após criar icp_versions (evita dependência circular)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table icp_versions (
  id                  uuid primary key default uuid_generate_v4(),
  icp_id              uuid not null references icp_profiles (id) on delete cascade,
  version             integer not null,
  cnaes               jsonb not null default '[]',   -- [{ code, description }]
  portes              text[] not null default '{}',
  keywords            text[] not null default '{}',
  positive_criteria   text[] not null default '{}',
  negative_criteria   text[] not null default '{}',
  territory_city      text,
  territory_state     char(2),
  territory_geometry  geography(Geometry, 4326),      -- Polygon (desenho) ou Point (centro do raio)
  territory_radius_km numeric,
  -- Pesos dos 6 grupos de score (devem somar 100 — validado na aplicação).
  weight_icp_fit               smallint not null default 30,
  weight_commercial_potential  smallint not null default 20,
  weight_digital_maturity      smallint not null default 15,
  weight_apparent_need         smallint not null default 15,
  weight_contact_accessibility smallint not null default 10,
  weight_recent_signals        smallint not null default 10,
  created_at          timestamptz not null default now(),
  unique (icp_id, version)
);
create index icp_versions_icp_idx on icp_versions (icp_id);

alter table icp_profiles
  add constraint icp_profiles_current_version_fk
  foreign key (current_version_id) references icp_versions (id);

-- ── Radar ────────────────────────────────────────────────────────────────

create table data_sources (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations (id) on delete cascade, -- null = fonte global
  type            text not null check (type in ('seed_database', 'csv_import')),
  name            text not null,
  description     text
);

create table radar_jobs (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations (id) on delete cascade,
  icp_id           uuid not null references icp_profiles (id),
  icp_version_id   uuid not null references icp_versions (id),
  source_id        uuid not null references data_sources (id),
  status           text not null default 'draft'
    check (status in ('draft', 'scheduled', 'running', 'partial', 'completed', 'failed', 'cancelled')),
  territory_city   text,
  territory_state  char(2),
  found_count      integer not null default 0,
  new_count        integer not null default 0,
  duplicate_count  integer not null default 0,
  possible_duplicate_count integer not null default 0,
  error_count      integer not null default 0,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_by       uuid references auth.users (id),
  created_at       timestamptz not null default now()
);
create index radar_jobs_org_idx on radar_jobs (organization_id, created_at desc);

create table radar_job_items (
  id            uuid primary key default uuid_generate_v4(),
  radar_job_id  uuid not null references radar_jobs (id) on delete cascade,
  company_id    uuid, -- FK para companies adicionada abaixo
  raw_name      text not null,
  outcome       text not null check (outcome in ('new', 'duplicate', 'possible_duplicate', 'error')),
  detail        text,
  created_at    timestamptz not null default now()
);
create index radar_job_items_job_idx on radar_job_items (radar_job_id);

-- ── Empresas ─────────────────────────────────────────────────────────────

create table companies (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations (id) on delete cascade,
  cnpj              char(18) not null,
  razao_social      text not null,
  nome_fantasia     text,
  cnae_principal    char(9) not null,
  cnae_descricao    text not null,
  cnaes_secundarios text[] default '{}',
  situacao          text not null check (situacao in ('ATIVA', 'INATIVA')),
  data_abertura     date not null,
  porte             text not null check (porte in ('MEI', 'ME', 'EPP', 'DEMAIS')),
  matriz_filial     text not null check (matriz_filial in ('MATRIZ', 'FILIAL')),
  telefone          text,
  whatsapp          text,
  email             text,
  website           text,
  endereco          text,
  numero            text,
  bairro            text,
  cidade            text not null,
  uf                char(2) not null,
  cep               char(9),
  latitude          double precision,
  longitude         double precision,
  location          geography(Point, 4326),
  status            text not null default 'descoberta'
    check (status in ('descoberta', 'revisada', 'convertida', 'descartada', 'bloqueada')),
  icp_id            uuid references icp_profiles (id),
  possible_duplicate_of uuid references companies (id),
  tags              text[] default '{}',
  discovered_at     timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, cnpj)
);
create index companies_org_idx on companies (organization_id);
create index companies_location_idx on companies using gist (location);
create index companies_cnae_idx on companies (cnae_principal);

alter table radar_job_items
  add constraint radar_job_items_company_fk foreign key (company_id) references companies (id);

create table company_sources (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies (id) on delete cascade,
  radar_job_id    uuid references radar_jobs (id) on delete set null,
  data_source_id  uuid not null references data_sources (id),
  found_at        timestamptz not null default now()
);
create index company_sources_company_idx on company_sources (company_id);

-- ── Leads ────────────────────────────────────────────────────────────────

create table leads (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations (id) on delete cascade,
  company_id       uuid not null references companies (id),
  icp_id           uuid not null references icp_profiles (id),
  icp_version_id   uuid not null references icp_versions (id),
  stage            text not null default 'novo'
    check (stage in ('novo', 'diagnostico', 'reuniao', 'proposta', 'negociacao', 'ganho', 'perdido')),
  owner_user_id    uuid references auth.users (id),
  notes            text default '',
  next_action_channel text,
  next_action_due_at  timestamptz,
  next_action_note    text,
  won_at           timestamptz,
  won_amount       numeric,
  won_product      text,
  lost_at          timestamptz,
  lost_reason      text check (lost_reason in ('sem_orcamento', 'sem_necessidade', 'concorrente', 'timing', 'sem_resposta', 'outro')),
  lost_competitor  text,
  recycle_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, company_id)
);
create index leads_org_stage_idx on leads (organization_id, stage);

create table lead_scores (
  id              uuid primary key default uuid_generate_v4(),
  lead_id         uuid not null references leads (id) on delete cascade,
  icp_version_id  uuid not null references icp_versions (id),
  total_score     smallint not null check (total_score between 0 and 100),
  level           text not null check (level in ('ALTO', 'MEDIO', 'BAIXO')),
  calculated_at   timestamptz not null default now()
);
create index lead_scores_lead_idx on lead_scores (lead_id);

create table lead_score_items (
  id            uuid primary key default uuid_generate_v4(),
  lead_score_id uuid not null references lead_scores (id) on delete cascade,
  group_key     text not null, -- icpFit | commercialPotential | digitalMaturity | apparentNeed | contactAccessibility | recentSignals
  value         smallint not null,
  max_value     smallint not null,
  reasons       text[] not null default '{}'
);
create index lead_score_items_score_idx on lead_score_items (lead_score_id);

create table activities (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations (id) on delete cascade,
  lead_id         uuid not null references leads (id) on delete cascade,
  type            text not null
    check (type in ('call', 'whatsapp', 'email', 'meeting', 'note', 'linkedin', 'qualification', 'proposal', 'custom')),
  user_id         uuid references auth.users (id),
  result          text,
  note            text,
  created_at      timestamptz not null default now()
);
create index activities_lead_idx on activities (lead_id, created_at desc);

-- ── Auditoria ────────────────────────────────────────────────────────────

create table audit_logs (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id         uuid references auth.users (id),
  entity_type     text not null check (entity_type in ('lead', 'company', 'icp', 'radar_job')),
  entity_id       uuid not null,
  action          text not null,
  description     text not null,
  old_value       jsonb,
  new_value       jsonb,
  origin          text default 'app',
  correlation_id  uuid,
  created_at      timestamptz not null default now()
);
create index audit_logs_org_entity_idx on audit_logs (organization_id, entity_type, entity_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security — multi-tenant real
--
-- Toda tabela de negócio é isolada por organization_id através de
-- is_org_member(organization_id). Tabelas sem organization_id direto
-- (icp_versions, radar_job_items, company_sources, lead_scores,
-- lead_score_items, activities já tem organization_id próprio) resolvem o
-- vínculo via join com a tabela pai.
-- ─────────────────────────────────────────────────────────────────────────────

alter table organizations enable row level security;
create policy "membros veem sua organização"
  on organizations for select to authenticated using (is_org_member(id));

alter table organization_members enable row level security;
create policy "membros veem outros membros da mesma organização"
  on organization_members for select to authenticated using (is_org_member(organization_id));

alter table icp_profiles enable row level security;
create policy "icp_profiles isolado por organização"
  on icp_profiles for all to authenticated
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table icp_versions enable row level security;
create policy "icp_versions segue o ICP pai"
  on icp_versions for all to authenticated
  using (exists (select 1 from icp_profiles p where p.id = icp_id and is_org_member(p.organization_id)))
  with check (exists (select 1 from icp_profiles p where p.id = icp_id and is_org_member(p.organization_id)));

alter table data_sources enable row level security;
create policy "fontes globais visíveis a todos; fontes próprias isoladas"
  on data_sources for select to authenticated
  using (organization_id is null or is_org_member(organization_id));

alter table radar_jobs enable row level security;
create policy "radar_jobs isolado por organização"
  on radar_jobs for all to authenticated
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table radar_job_items enable row level security;
create policy "radar_job_items segue o job pai"
  on radar_job_items for all to authenticated
  using (exists (select 1 from radar_jobs j where j.id = radar_job_id and is_org_member(j.organization_id)))
  with check (exists (select 1 from radar_jobs j where j.id = radar_job_id and is_org_member(j.organization_id)));

alter table companies enable row level security;
create policy "companies isolado por organização"
  on companies for all to authenticated
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table company_sources enable row level security;
create policy "company_sources segue a empresa pai"
  on company_sources for all to authenticated
  using (exists (select 1 from companies c where c.id = company_id and is_org_member(c.organization_id)))
  with check (exists (select 1 from companies c where c.id = company_id and is_org_member(c.organization_id)));

alter table leads enable row level security;
create policy "leads isolado por organização"
  on leads for all to authenticated
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table lead_scores enable row level security;
create policy "lead_scores segue o lead pai"
  on lead_scores for all to authenticated
  using (exists (select 1 from leads l where l.id = lead_id and is_org_member(l.organization_id)))
  with check (exists (select 1 from leads l where l.id = lead_id and is_org_member(l.organization_id)));

alter table lead_score_items enable row level security;
create policy "lead_score_items segue o score pai"
  on lead_score_items for all to authenticated
  using (exists (
    select 1 from lead_scores s join leads l on l.id = s.lead_id
    where s.id = lead_score_id and is_org_member(l.organization_id)
  ))
  with check (exists (
    select 1 from lead_scores s join leads l on l.id = s.lead_id
    where s.id = lead_score_id and is_org_member(l.organization_id)
  ));

alter table activities enable row level security;
create policy "activities isolado por organização"
  on activities for all to authenticated
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table audit_logs enable row level security;
create policy "audit_logs isolado por organização"
  on audit_logs for select to authenticated using (is_org_member(organization_id));
create policy "audit_logs inserido só pelo próprio backend/app"
  on audit_logs for insert to authenticated with check (is_org_member(organization_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- Teste de isolamento multi-tenant (executar manualmente após aplicar,
-- autenticado alternadamente como um usuário de cada organização):
--
--   -- Como usuário da Organização A:
--   select count(*) from companies;            -- deve retornar só empresas da A
--   insert into companies (organization_id, ...) values ('<id-da-B>', ...);
--                                                -- deve falhar (RLS INSERT)
--   update leads set stage = 'ganho' where organization_id = '<id-da-B>';
--                                                -- deve afetar 0 linhas
--   delete from companies where organization_id = '<id-da-B>';
--                                                -- deve afetar 0 linhas
--
-- Repita como usuário da Organização B e confirme o inverso. Isso NÃO foi
-- executado nesta rodada (sem projeto Supabase conectado) — ver Pendências.
-- ─────────────────────────────────────────────────────────────────────────────
