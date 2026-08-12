-- ─────────────────────────────────────────────────────────────────────────────
-- Segatto's Leads — Schema inicial (PostgreSQL + PostGIS + Supabase)
--
-- Este schema recebe os dados normalizados dos Dados Abertos do CNPJ da
-- Receita Federal após o pipeline de ETL + geocodificação. A POC usa uma base
-- local com o mesmo formato; ao ativar o Supabase, apenas o repositório de
-- dados muda (MockCompanyRepository → SupabaseCompanyRepository).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ── Empresas (base compartilhada, alimentada pela Receita Federal) ──────────
create table companies (
  id                uuid primary key default uuid_generate_v4(),
  cnpj              char(18) not null unique,
  razao_social      text not null,
  nome_fantasia     text,
  cnae_principal    char(9) not null,
  cnae_descricao    text not null,
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
  -- Coluna geoespacial usada pelo motor territorial (ST_Within/ST_DWithin).
  location          geography(Point, 4326),
  source_updated_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index companies_location_idx on companies using gist (location);
create index companies_cnae_idx on companies (cnae_principal);
create index companies_cidade_uf_idx on companies (cidade, uf);
create index companies_situacao_idx on companies (situacao);

-- CNAEs secundários (1:N)
create table company_secondary_cnaes (
  company_id uuid not null references companies (id) on delete cascade,
  cnae       char(9) not null,
  primary key (company_id, cnae)
);
create index company_secondary_cnaes_cnae_idx on company_secondary_cnaes (cnae);

-- ── Segmentos comerciais (um nicho agrupa vários CNAEs) ─────────────────────
create table segments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text
);

create table segment_cnaes (
  id         uuid primary key default uuid_generate_v4(),
  segment_id uuid not null references segments (id) on delete cascade,
  cnae       char(9) not null,
  unique (segment_id, cnae)
);

-- ── Territórios monitorados (por usuário) ───────────────────────────────────
create table territories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  city       text not null,
  state      char(2) not null,
  -- Polígono desenhado no mapa (mesmo GeoJSON enviado pelo frontend).
  geometry   geography(Polygon, 4326),
  segment_id uuid references segments (id),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index territories_user_idx on territories (user_id);
create index territories_geometry_idx on territories using gist (geometry);

-- ── Pipeline comercial ──────────────────────────────────────────────────────
create table leads (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  company_id   uuid not null references companies (id),
  territory_id uuid references territories (id) on delete set null,
  status       text not null default 'novos'
    check (status in ('novos', 'contatados', 'responderam', 'reuniao', 'proposta', 'fechado')),
  score        smallint not null check (score between 0 and 100),
  owner        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, company_id)
);
create index leads_user_status_idx on leads (user_id, status);

create table lead_activities (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid not null references leads (id) on delete cascade,
  type        text not null check (type in ('created', 'note', 'contact', 'stage', 'view')),
  description text not null,
  created_at  timestamptz not null default now()
);
create index lead_activities_lead_idx on lead_activities (lead_id, created_at);

-- ── Monitoramento contínuo (novas empresas por território) ──────────────────
create table monitored_companies (
  id            uuid primary key default uuid_generate_v4(),
  territory_id  uuid not null references territories (id) on delete cascade,
  company_id    uuid not null references companies (id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (territory_id, company_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security — multi-tenant
-- Empresas e segmentos são compartilhados (somente leitura para usuários);
-- territórios, leads, atividades e monitoramentos pertencem a cada usuário.
-- ─────────────────────────────────────────────────────────────────────────────

alter table companies enable row level security;
create policy "companies são públicas para leitura"
  on companies for select to authenticated using (true);

alter table segments enable row level security;
create policy "segments são públicos para leitura"
  on segments for select to authenticated using (true);

alter table segment_cnaes enable row level security;
create policy "segment_cnaes são públicos para leitura"
  on segment_cnaes for select to authenticated using (true);

alter table territories enable row level security;
create policy "cada usuário gerencia seus territórios"
  on territories for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table leads enable row level security;
create policy "cada usuário gerencia seus leads"
  on leads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table lead_activities enable row level security;
create policy "atividades seguem o dono do lead"
  on lead_activities for all to authenticated
  using (exists (select 1 from leads where leads.id = lead_id and leads.user_id = auth.uid()))
  with check (exists (select 1 from leads where leads.id = lead_id and leads.user_id = auth.uid()));

alter table monitored_companies enable row level security;
create policy "monitoramentos seguem o dono do território"
  on monitored_companies for select to authenticated
  using (exists (select 1 from territories t where t.id = territory_id and t.user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- Motor geoespacial — consulta equivalente à busca territorial da POC
-- (booleanPointInPolygon do frontend → ST_Within no banco)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function find_companies_in_territory(
  segment_slug text,
  territory_geojson jsonb,
  only_active boolean default true
)
returns setof companies
language sql stable
as $$
  select c.*
  from companies c
  where st_within(
      c.location::geometry,
      st_setsrid(st_geomfromgeojson(territory_geojson::text), 4326)
    )
    and (not only_active or c.situacao = 'ATIVA')
    and (
      c.cnae_principal in (
        select sc.cnae
        from segment_cnaes sc
        join segments s on s.id = sc.segment_id
        where s.slug = segment_slug
      )
      or exists (
        select 1
        from company_secondary_cnaes csc
        join segment_cnaes sc on sc.cnae = csc.cnae
        join segments s on s.id = sc.segment_id
        where csc.company_id = c.id and s.slug = segment_slug
      )
    );
$$;

-- Busca por raio (equivalente ao modo "Raio" da POC):
--   select * from companies
--   where st_dwithin(location, st_makepoint(:lng, :lat)::geography, :meters);
