# Arquitetura — Segatto's Leads

## Visão macro

```text
Dados Abertos Receita Federal
           │
           ▼
       ETL / Importação
           │
           ▼
 Normalização + Geocoding
           │
           ▼
 PostgreSQL + PostGIS
           │
           ▼
 Motor de Inteligência Territorial
           │
           ├─────────────┐
           ▼             ▼
     Segatto's Leads    Alertas
           │
           ▼
        Pipeline
```

A narrativa do produto segue o mesmo eixo:

```text
DADOS → TERRITÓRIO → OPORTUNIDADES → QUALIFICAÇÃO → PIPELINE → VENDA
```

## Camadas da aplicação (POC)

```text
src/
├── data/          Base de demonstração (seed) + catálogos (segmentos, bairros)
├── types/         Modelos de domínio (Company espelha os Dados Abertos do CNPJ)
├── services/      Regras de negócio — nada de lógica complexa em componentes
│   ├── repositories/   Contratos de acesso a dados (troca mock → Supabase)
│   ├── prospectingService     Motor de busca territorial (Turf.js)
│   ├── opportunityScoreService  Score heurístico 0–100 com justificativas
│   ├── companyService         Consultas e formatações de empresa
│   ├── pipelineService        Etapas, criação de leads, timeline
│   ├── territoryService       Territórios monitorados
│   └── dashboardService       Métricas da visão geral
├── store/         Estado global (Zustand) com persistência em localStorage
├── components/    UI por domínio (layout, map, explore, companies, pipeline, dashboard, ui)
└── pages/         Rotas (Splash, Dashboard, Explorar, Oportunidades, Pipeline, ...)
```

### Regra de dependência

`pages → components → services → data`. Componentes nunca importam o seed
diretamente; sempre passam por um serviço ou repositório.

## Filtragem geoespacial

A busca territorial é **real** já na POC:

| POC (frontend)                          | Produção (PostGIS)                       |
| --------------------------------------- | ---------------------------------------- |
| `booleanPointInPolygon(point, polygon)` | `ST_Within(location, território)`        |
| filtro por raio com `distance()`        | `ST_DWithin(location, ponto, metros)`    |
| `area(polygon)` para km²                | `ST_Area(geography)`                     |
| interseção de territórios (futuro)      | `ST_Intersects` / `ST_Contains`          |

O polígono desenhado no mapa já é serializado como **GeoJSON Polygon
(`[lng, lat]`, anel fechado)** — exatamente o formato aceito por
`ST_GeomFromGeoJSON`, então a troca do motor não altera o contrato.

## Troca da fonte de dados

O contrato central é `CompanyRepository`:

```ts
interface CompanyRepository {
  findAll(): Promise<Company[]>
  findById(id: string): Promise<Company | undefined>
  findByCnaes(cnaes: string[]): Promise<Company[]>
}
```

- **Hoje:** `MockCompanyRepository` lê `src/data/companies.seed.json`
  (fatia simulada da base oficial, 128 empresas em Uberlândia/MG).
- **Amanhã:** `SupabaseCompanyRepository` implementa o mesmo contrato chamando a
  função SQL `find_companies_in_territory` (ver
  `supabase/migrations/0001_init.sql`), que resolve CNAE × polígono × situação
  no banco. Nenhum componente de interface muda.

Na versão com banco, `findByCnaes` + filtro no cliente é substituído por uma
única consulta territorial no servidor — o `prospectingService` passa a
delegar a interseção geográfica ao repositório.

## Score de oportunidade

`opportunityScoreService.calculateOpportunityScore(company)` é uma heurística
documentada (não é IA): base 40 + sinais objetivos (canais de contato, tempo de
atividade, porte, completude cadastral, empresa recém-identificada), teto 100.
Retorna também `reasons: string[]`, exibidas como "Inteligência da
oportunidade". Em produção o cálculo migra para o backend e pode evoluir para
um modelo estatístico sem alterar o contrato.

## Multi-tenant / RLS

Ver `supabase/migrations/0001_init.sql`:

- `companies`, `segments`, `segment_cnaes`: base compartilhada, somente leitura.
- `territories`, `leads`, `lead_activities`, `monitored_companies`: isoladas
  por `user_id = auth.uid()` via Row Level Security.

## Automação futura

A separação por serviços permite plugar, sem tocar na interface:

- **n8n** — orquestração de fluxos (novo lead → sequência de contato);
- **WhatsApp Business API** — abordagem direta a partir do lead;
- **APIs de enriquecimento** — completar contatos/presença digital antes do
  cálculo de score.

O gatilho natural é o monitoramento: quando o ETL identifica uma empresa nova
dentro de um território ativo (`monitored_companies.first_seen_at`), um evento
alimenta alertas e automações.
