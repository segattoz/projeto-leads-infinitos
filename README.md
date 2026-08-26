# i9 Radar

**Inteligência comercial do mercado ao fechamento.**

> Encontre quem pode comprar. Priorize quem vale a pena abordar. Feche mais.

O i9 Radar é uma plataforma comercial multiempresa que cobre todo o ciclo de uma
oportunidade: **Radar → Prospecção → Qualificação → Funil de Vendas →
Encerramento → Reciclagem**. O usuário configura um ICP (perfil de cliente
ideal), executa o Radar sobre um território, o sistema descobre e pontua
empresas de forma explicável, e a equipe conduz cada lead até o fechamento.

Este repositório evoluiu de uma POC anterior de prospecção geográfica de
nicho único (o antigo "Segatto's Leads") para esta arquitetura multiempresa
mais ampla — reaproveitando o mapa, o motor de filtragem geoespacial, o
Kanban e o design system, mas com um modelo de dados novo. Detalhes da
migração e da arquitetura completa em [`docs/architecture.md`](docs/architecture.md).

## Estado desta versão (V0)

Esta é a **Sprint 1** do produto: fundação de multiempresa, ICP, Radar,
Empresas, Score explicável e Lead 360 — **inteiramente client-side**, sem
backend conectado. Isso é uma decisão explícita desta rodada, não uma
limitação escondida:

- Multiempresa é **modelada e isolada na camada de estado/store** (cada
  entidade carrega `organizationId`, e todo store filtra por ele) — não há
  Postgres/RLS reais ainda. O SQL completo (schema + RLS) está em
  `supabase/migrations/0001_i9radar_v0.sql`, escrito para revisão e futura
  aplicação, mas **não executado** contra um banco real nesta rodada.
- Não há autenticação real — o seletor de organização no header (Header →
  `OrgSwitcher`) simula a troca de tenant para fins de demonstração e teste
  de isolamento.
- Prospecção operacional (fila priorizada), Cadências, Qualificação
  estruturada, separação Lead↔Oportunidade com forecast, integrações de
  WhatsApp/E-mail, tela de Auditoria em Configurações, Relatórios, Equipe e
  n8n/webhooks **não foram implementados** — ver pendências completas no
  relatório de entrega.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS 4** (tema claro, tokens em `src/index.css`) + **Lucide Icons**
- **Leaflet + OpenStreetMap** (tiles CARTO claros, sem token pago)
- **Turf.js** — filtragem geoespacial real (point-in-polygon, raio, área)
- **Zustand** — estado global org-scoped, persistido em `localStorage`
- **@dnd-kit** — drag & drop do Kanban (Funil)
- **sonner** — toasts

## Como executar

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build       # typecheck + build de produção
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run seed          # regenera as bases de demonstração (determinística)
npm run preview        # serve o build
```

Não há variáveis de ambiente obrigatórias — a aplicação roda inteiramente
local. Se os tiles do mapa não carregarem (sem internet), o resto da
aplicação continua funcionando.

## Fluxo principal (V0)

1. **Splash** → entrar na plataforma → **Dashboard** (KPIs executivos, funil
   de conversão, alertas operacionais, ICPs monitorados).
2. **ICPs** → criar um ICP (segmentos/CNAEs, porte, palavras-chave, território
   no mapa, pesos do score) — cada alteração publica uma nova versão
   imutável.
3. **Radar** → Novo Radar → wizard (ICP → território/critérios da versão
   atual → fonte → executar) → job roda a pipeline **consultar fonte →
   normalizar → deduplicar → calcular score** e mostra o detalhe da
   execução.
4. **Empresas** → base de empresas descobertas (não é lead automaticamente)
   → abrir uma empresa → **Converter em lead**.
5. **Leads** → **Lead 360** (`/app/leads/:id`) — score explicável por 6
   grupos com motivos, timeline de atividades, próxima ação, auditoria.
6. **Funil** → Kanban (Novo/Diagnóstico/Reunião/Proposta/Negociação/
   Ganho/Perdido) — ganho exige valor, perda exige motivo estruturado.

Troque de organização no seletor do header (**Comercial Triângulo Ltda**,
Uberlândia/MG ↔ **Distribuidora Alfa Ltda**, Ribeirão Preto/SP) para
confirmar que nenhum dado cruza entre organizações — ICPs, Radar, Empresas,
Leads e Funil re-escopam instantaneamente.

Tudo persiste em `localStorage`, isolado por organização. Em
**Configurações → Restaurar dados de demonstração** o estado volta ao
inicial.

## Estrutura

```text
src/
├── data/          organizations, segments (presets de CNAE), seeds de duas
│                  organizações, ICPs/leads de demonstração
├── types/         modelo de domínio (Organization, Icp/IcpVersion, RadarJob,
│                  Company/CompanySource, Lead/LeadScore, Activity, AuditEvent)
├── services/       regras de negócio puras: icpService, radarService
│                  (adapters + normalização/dedup), dedupeService,
│                  scoreService (6 grupos ponderados), companyService,
│                  leadService, dashboardService
├── store/           Zustand + persist, todos org-scoped:
│                  useOrganizationStore, useIcpStore, useCompanyStore,
│                  useRadarStore, useLeadStore, useAuditStore, useSettingsStore
├── components/     ui/ · layout/ · map/ · icp/ · companies/ · pipeline/ ·
│                  radar/ · dashboard/
└── pages/          Splash · Dashboard · Radar (lista/wizard/detalhe) ·
                   Empresas · ICPs (lista/editor) · Leads · Lead 360 · Funil ·
                   Configurações
scripts/generate-seed.mjs   gerador determinístico das duas bases demo
supabase/migrations/        schema Postgres + PostGIS + RLS (V0, não aplicado)
docs/architecture.md        arquitetura, modelo de dados e pendências
```

## Arquitetura de dados: pool de empresas vs. base descoberta

O Radar não trabalha diretamente sobre a base final de empresas da
organização. Existe um **pool de empresas "descobríveis"**
(`src/services/repositories/CompanyPoolRepository.ts`, simulando uma fatia
dos Dados Abertos do CNPJ) por organização. Uma empresa só entra na tabela
`companies` da organização quando um `RadarJob` realmente a encontra —
exatamente como aconteceria contra uma fonte externa real. Isso torna a
deduplicação testável de verdade: rodar o Radar duas vezes sobre território
sobreposto produz duplicatas reais, não simuladas.

## Score explicável

`scoreService.calculateLeadScore(company, icpVersion)` — heurística
documentada (não é IA/caixa-preta), 6 grupos ponderados (pesos vêm da versão
do ICP): Compatibilidade com ICP, Potencial comercial, Maturidade digital,
Necessidade aparente, Contato e acessibilidade, Sinais recentes. Cada grupo
retorna valor/máximo/motivos — nunca só um número. O `icpVersionId` fica
gravado no resultado, então um score sempre pode ser explicado
retroativamente mesmo que o ICP mude depois.

## Integração futura com backend real

1. Aplicar `supabase/migrations/0001_i9radar_v0.sql` (revisar antes —
   nomes/tipos foram escritos para representar a arquitetura, não testados).
2. Implementar Supabase Auth + popular `organization_members`.
3. Trocar a persistência dos stores Zustand por chamadas ao Supabase,
   mantendo as mesmas assinaturas de ação (`upsertCompany`, `convertCompany`,
   `runJob`, etc.) — a camada de componentes não precisa mudar.
4. Rodar os testes de isolamento multi-tenant descritos no final do arquivo
   de migration (autenticado alternadamente como usuário de cada
   organização, confirmando que SELECT/INSERT/UPDATE/DELETE nunca cruzam
   organizações).
5. Substituir o `SeedDatabaseSourceAdapter` por um adapter real de fonte de
   dados (`RadarSourceAdapter`, ver `src/services/radarService.ts`) — o
   pipeline de normalização/dedup/score não muda.

Diagrama completo, modelo de dados e roadmap em
[`docs/architecture.md`](docs/architecture.md).
