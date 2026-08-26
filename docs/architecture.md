# Arquitetura — i9 Radar (V0)

## Visão macro (produto completo, roadmap)

```text
Fontes de dados (Dados Abertos do CNPJ, importação, futuros provedores)
           │
           ▼
       Radar (adapter + job)
           │
           ▼
 Normalização + Deduplicação
           │
           ▼
   Motor de Score explicável
           │
           ▼
        Empresas ──► Conversão em Lead
           │
           ▼
   Prospecção / Cadências / Qualificação
           │
           ▼
        Funil de Vendas
           │
           ├─────────────┐
           ▼             ▼
        Ganho         Perdido → Reciclagem
```

Narrativa central: **RADAR → PROSPECÇÃO → QUALIFICAÇÃO → FUNIL → ENCERRAMENTO
→ RECICLAGEM.**

## O que esta V0 cobre (Sprint 1) vs. o que fica para depois

| Módulo | Status nesta V0 |
|---|---|
| Multiempresa (modelo + isolamento em store) | ✅ Implementado (client-side) |
| Multiempresa (RLS testada em Postgres real) | ❌ Pendente — sem backend conectado |
| ICP + versionamento | ✅ Implementado |
| Radar (adapters, job, normalização, dedup) | ✅ Implementado |
| Importação CSV como fonte | ✅ Implementado |
| Empresas (base descoberta, não é lead automaticamente) | ✅ Implementado |
| Score explicável por grupos | ✅ Implementado |
| Lead 360 (Visão geral, Contato, Score, Atividades, Auditoria) | ✅ Implementado |
| Lead 360 — Qualificação estruturada | ❌ Pendente (empty-state honesto) |
| Lead 360 — Oportunidades com forecast | ❌ Pendente (empty-state honesto) |
| Lead 360 — Arquivos | ❌ Pendente (empty-state honesto) |
| Funil (Kanban, ganho/perda estruturados) | ✅ Implementado (sem valor/probabilidade por oportunidade separada) |
| Prospecção operacional ("próximo melhor lead", fila priorizada) | ❌ Pendente |
| Cadências multicanal | ❌ Pendente |
| WhatsApp Business Cloud API / E-mail | ❌ Pendente |
| Reciclagem automática (job agendado) | ❌ Pendente — `recycleAt` é gravado, mas nada dispara a reentrada automaticamente |
| Suppression list | ❌ Pendente |
| Papéis/permissões (RBAC aplicado) | ⚠️ Modelados em `types.Role`/membros, não aplicados como controle de acesso |
| Auditoria central (tela de Configurações) | ⚠️ Log central existe (`useAuditStore`) e alimenta o Lead 360, mas não há tela dedicada em Configurações |
| Relatórios, Equipe (telas de Gestão) | ❌ Pendente |
| Integrações/Fontes/Permissões (Configurações) | ❌ Pendente — Configurações tem só Organização + Usuários (leitura) |
| n8n (RADAR-01…OPS-01) | ❌ Pendente — arquitetura dos services já separa responsabilidades de forma equivalente aos workflows descritos, mas nenhum workflow real existe |
| Webhooks / `webhook_events` | ❌ Pendente |
| Busca global | ❌ Pendente |
| Filtros salvos | ❌ Pendente |

## Camadas da aplicação

```text
src/
├── data/          catálogos e seeds (organizations, segments, seeds por org)
├── types/         modelo de domínio — toda entidade de negócio carrega
│                  organizationId (exceto catálogos globais como SegmentPreset)
├── services/      regras de negócio puras — nada de estado React aqui
│   ├── repositories/CompanyPoolRepository   pool de empresas "descobríveis"
│   │                                        por organização (simula fonte externa)
│   ├── dedupeService       CNPJ/domínio/telefone/endereço+similaridade
│   ├── scoreService        6 grupos ponderados, ligado a IcpVersion
│   ├── icpService          criação e versionamento de ICP
│   ├── radarService        RadarSourceAdapter + normalização/dedup
│   ├── companyService      empresa a partir do pool, score potencial p/ exibição
│   ├── leadService         conversão empresa→lead, atividades, estágios
│   └── dashboardService    métricas executivas, funil, performance por origem
├── store/         Zustand + persist — cada store filtra por organizationId
└── pages/         rotas (ver README para o mapa completo)
```

### Regra de dependência

`pages → components → store → services → data`. Serviços nunca importam
stores (evita acoplar regra de negócio a React); stores chamam serviços e
persistem o resultado.

## Multiempresa — como o isolamento é aplicado nesta V0

Não há Postgres/RLS reais ainda. O isolamento é aplicado em duas camadas:

1. **Modelo**: toda entidade comercial (`Company`, `Icp`, `RadarJob`, `Lead`,
   `Activity`, `AuditEvent`) carrega `organizationId`.
2. **Store**: cada store Zustand guarda TODAS as organizações misturadas em
   um único array (ex.: `useCompanyStore.companies`), e cada leitura passa
   por um helper de filtro (`companiesForOrg`, `leadsForOrg`, `icpsForOrg`,
   `jobsForOrg`) que recebe o `organizationId` ativo
   (`useOrganizationStore`). Toda mutação (criar ICP, converter lead,
   registrar atividade) recebe ou deriva o `organizationId` do registro que
   está sendo alterado — nunca do contexto implícito da tela.

Isso é **testável e real no frontend** (trocar organização no seletor do
Header re-escopa tudo instantaneamente, sem reload), mas **não é
equivalente a RLS**: um bug de filtro no frontend, ou alguém manipulando o
`localStorage` diretamente, pode expor dados entre organizações. Por isso a
migration em `supabase/migrations/0001_i9radar_v0.sql` já modela RLS via
`is_org_member(organization_id)` para quando houver backend real — a
prioridade #1 da próxima fase.

## Radar — pipeline e adapters

```ts
interface RadarSourceAdapter {
  id: DataSourceType
  search(params: RadarSearchParams): Promise<RadarSourceResult[]>
}
```

- `seedDatabaseAdapter` — consulta `CompanyPoolRepository` (pool por
  organização) filtrando por CNAEs do ICP + território (polígono/raio via
  Turf.js — `booleanPointInPolygon` / `distance`, mesma técnica usada no
  protótipo geoespacial anterior).
- `csvImportAdapter` — parser CSV próprio (sem dependência nova), valida
  colunas obrigatórias e reporta erros por linha como `RadarJobItem` com
  `outcome: 'error'` (o job fica `partial`).

Pipeline (`useRadarStore.runJob`): busca na fonte → `normalizeAndDedupe`
(dedupeService) → para cada resultado novo, `calculateLeadScore` +
`upsertCompany` + `addSource` → grava `RadarJob`/`RadarJobItem` → registra
evento de auditoria. Trocar de fonte significa implementar um novo
`RadarSourceAdapter` — nada mais no pipeline muda.

## Deduplicação

Prioridade determinística (`dedupeService.findDuplicate`):

1. CNPJ normalizado igual → duplicata definitiva → mescla (nova
   `CompanySource` registrada, empresa existente preservada).
2. Domínio do site ou telefone iguais → duplicata forte → mescla.
3. Mesmo endereço (cidade+bairro+logradouro) + similaridade de nome
   (coeficiente de Dice sobre bigramas, ≥ 0.8) → **possível duplicata** —
   nunca mesclada automaticamente, fica marcada (`possibleDuplicateOfCompanyId`)
   para revisão manual na tela Empresas.

## Score explicável

6 grupos ponderados (pesos configuráveis por versão do ICP, default = spec
original): Compatibilidade ICP 30% · Potencial comercial 20% · Maturidade
digital 15% · Necessidade aparente 15% · Contato/acessibilidade 10% · Sinais
recentes 10%. Cada grupo retorna `{ value, max, reasons[] }`. Heurística
documentada em `scoreService.ts` — não é um modelo de IA, e isso é
comunicado deliberadamente na interface (nunca "prevemos que...").

## Modelo de dados completo (roadmap)

O `supabase/migrations/0001_i9radar_v0.sql` cobre exatamente as entidades da
Sprint 1. O modelo completo do produto (Prospecção/Cadências/Qualificação/
Funil com forecast/Integração/Auditoria de configurações) segue a mesma
lógica de organização proposta originalmente:

```text
organizations, organization_members, roles
icp_profiles, icp_versions, score_rules*, territories*
data_sources, source_credentials*, radar_jobs, radar_job_items
companies, company_sources, contacts*, contact_channels*
leads, lead_scores, lead_score_items, tags*, lead_tags*, suppression_list*
cadences*, cadence_steps*, enrollments*, activities, tasks*
qualification_forms*, qualification_questions*, qualification_answers*
pipelines*, stages*, opportunities*, proposals*, attachments*
integrations*, webhook_events*, audit_logs
```

(`*` = não modelado nesta migration V0; adicionar quando o módulo
correspondente for implementado, evitando criar tabelas sem uso real —
princípio seguido desde a Sprint 1: nunca criar estrutura cegamente antes de
haver funcionalidade que a use.)

## Papéis (modelados, não aplicados como RBAC)

`src/types/index.ts` define `Role = admin | commercial_manager | sdr |
closer | viewer | integration` e `OrgMember` com esse papel. A tela
Configurações → Usuários já lista os membros de demonstração com seus
papéis. **Nenhuma tela ou ação desta V0 restringe funcionalidade por
papel** — isso é uma pendência explícita, não uma omissão silenciosa.

## n8n e automações (arquitetura preparada, nada implementado)

A separação de responsabilidades em `services/` já espelha a proposta de
workflows do produto completo (`radarService` ≈ RADAR-01/02/03,
`scoreService` ≈ SCORE-01, `leadService` ≈ FUNIL-01, `auditService`/
`useAuditStore` ≈ OPS-01). Nenhum workflow n8n real existe nesta V0 — quando
implementados, devem carregar `organizationId` + `correlationId` e escrever
em `audit_logs`/`webhook_events`, seguindo o mesmo padrão de idempotência
descrito no pedido original.

## Migração de dados

Esta V0 não carrega dados reais de clientes (é uma base de demonstração
gerada deterministicamente por `scripts/generate-seed.mjs`, dois conjuntos
fictícios — um por organização de demo). Não há, portanto, dados de produção
a migrar nesta rodada. A estratégia de migração para quando houver dados
reais segue o mapeamento:

```text
Empresa (produto anterior)  →  companies (+ organization_id)
Lead (produto anterior)     →  leads (+ organization_id, icp_id, icp_version_id)
Score (produto anterior)    →  lead_scores + lead_score_items
Origem (produto anterior)   →  company_sources
```
