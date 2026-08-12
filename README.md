# Segatto's Leads

**Captação de Futuros Clientes para o Seu Negócio** — plataforma de
inteligência territorial para prospecção B2B.

> Escolha onde quer vender. Encontre quem pode comprar.

O usuário escolhe um segmento (nicho → CNAEs), desenha uma região no mapa e o
sistema identifica empresas daquele perfil dentro da área — com score de
oportunidade, dossiê da empresa e pipeline comercial em Kanban.

Esta é uma **POC funcional e navegável**, arquitetada para que a base de
demonstração seja substituída pelos **Dados Abertos do CNPJ da Receita
Federal** (PostgreSQL + PostGIS via Supabase) sem reescrever a interface.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS 4** (tema dark próprio, estilo shadcn/ui) + **Lucide Icons**
- **Leaflet + OpenStreetMap** (tiles CARTO dark, sem token pago)
- **Turf.js** — filtragem geoespacial real (point-in-polygon, raio, área)
- **Zustand** — estado global com persistência em `localStorage`
- **@dnd-kit** — drag & drop do Kanban
- **sonner** — toasts

## Como executar

```bash
npm install
npm run dev        # http://localhost:5173
```

Outros comandos:

```bash
npm run build      # typecheck + build de produção
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run seed       # regenera a base de demonstração (determinística)
npm run preview    # serve o build
```

Não há variáveis de ambiente nem serviços externos obrigatórios: se os tiles
do mapa não carregarem (sem internet), o restante da aplicação continua
funcionando — prioridade é demo previsível.

## Deploy na Vercel

O projeto já está pronto para a Vercel (`vercel.json` incluído, com fallback de
SPA e cache imutável de assets):

1. Em [vercel.com/new](https://vercel.com/new), importe este repositório do
   GitHub. A Vercel detecta o Vite automaticamente (build `npm run build`,
   output `dist/`) — não altere nada.
2. Selecione a branch desejada e clique em **Deploy**.

Ou via CLI: `npm i -g vercel && vercel` na raiz do projeto.

Nenhuma variável de ambiente é necessária. As rotas (`/app/explorar`,
`/app/pipeline`, …) funcionam com refresh e link direto graças ao rewrite de
SPA do `vercel.json`.

## Fluxo principal (roteiro da demo)

1. **Abertura** → `EXPLORAR OPORTUNIDADES` → Dashboard (247 oportunidades).
2. **Explorar Território** → segmento **Oficinas Mecânicas** (CNAEs 4520-0/01…).
3. **Desenhar área no mapa** → 3+ cliques → fechar polígono (área em km²).
4. **ENCONTRAR OPORTUNIDADES** → análise animada → marcadores + painel de
   resultados (a filtragem por polígono é real: mudar a área muda o resultado).
5. Abrir **Mecânica Avenida** (badge NOVA, score 92) → drawer com score,
   inteligência da oportunidade, cadastro, mini mapa e contatos.
6. **ADICIONAR AO PIPELINE** → toast de confirmação.
7. **Pipeline** → card em *Novos Leads* → arrastar para *Contatados* →
   drawer do lead com observações, registro de contato e timeline.

Leads, territórios e preferências persistem em `localStorage` — a página pode
ser recarregada durante a apresentação. Em **Configurações → Restaurar dados
de demonstração** tudo volta ao estado inicial.

## Estrutura

```text
src/
├── data/          seed de empresas + segmentos (nicho → vários CNAEs) + bairros
├── types/         modelos de domínio (Company espelha os Dados Abertos do CNPJ)
├── services/      regras de negócio e repositórios (ver docs/architecture.md)
├── store/         Zustand + persist (pipeline, territórios, busca, preferências)
├── components/    ui/ · layout/ · map/ · explore/ · companies/ · pipeline/ · dashboard/
└── pages/         Splash · Dashboard · Explorar · Oportunidades · Pipeline ·
                   Monitoramentos · Configurações
scripts/generate-seed.mjs   gerador determinístico da base demo
supabase/migrations/        schema PostgreSQL + PostGIS + RLS
docs/architecture.md        arquitetura e plano de evolução
```

## Dados simulados

`npm run seed` gera **128 empresas fictícias plausíveis** em bairros reais de
Uberlândia/MG (10 segmentos). CNPJs são fictícios (raízes aleatórias com
dígitos verificadores válidos) e **não correspondem a empresas reais**. Nem
toda empresa tem todos os canais de contato — a distribuição é realista e o
score reflete isso. As datas de descoberta são reancoradas para "hoje" a cada
carga, então o badge **NOVA** ("identificada na atualização mais recente da
base") permanece coerente em qualquer data de apresentação.

## Score de oportunidade

`opportunityScoreService` — heurística demonstrativa (não é IA): base 40 +
telefone, WhatsApp, site, e-mail, tempo de atividade, porte, completude
cadastral e descoberta recente; máximo 100. Retorna o score e as
justificativas legíveis exibidas no drawer ("Inteligência da oportunidade").

## Integração futura com dados reais

1. **ETL**: importar os Dados Abertos do CNPJ, normalizar e geocodificar
   endereços → tabela `companies` com coluna `location geography(Point, 4326)`.
2. **Aplicar** `supabase/migrations/0001_init.sql` (PostGIS, RLS multi-tenant e
   a função `find_companies_in_territory`).
3. **Implementar** `SupabaseCompanyRepository` com o mesmo contrato de
   `CompanyRepository` (`src/services/repositories/CompanyRepository.ts`) —
   o polígono desenhado já é GeoJSON aceito por `ST_GeomFromGeoJSON`, e a
   consulta territorial passa a rodar no banco com `ST_Within` / `ST_DWithin`.
4. **Trocar** a instância exportada do repositório. Componentes e telas não
   mudam.

Detalhes, diagrama e equivalências Turf ↔ PostGIS em
[`docs/architecture.md`](docs/architecture.md).
