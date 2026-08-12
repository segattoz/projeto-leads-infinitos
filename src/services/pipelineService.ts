import type { Company, Lead, LeadActivity, LeadStatus } from '@/types'
import { calculateOpportunityScore } from '@/services/opportunityScoreService'
import seed from '@/data/companies.seed.json'

/** Regras do pipeline comercial: criação de leads, etapas e timeline. */

export const PIPELINE_STAGES: { id: LeadStatus; label: string }[] = [
  { id: 'novos', label: 'Novos Leads' },
  { id: 'contatados', label: 'Contatados' },
  { id: 'responderam', label: 'Responderam' },
  { id: 'reuniao', label: 'Reunião Marcada' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'fechado', label: 'Fechado' },
]

export function stageLabel(status: LeadStatus): string {
  return PIPELINE_STAGES.find((s) => s.id === status)?.label ?? status
}

export const DEFAULT_OWNER = 'Matheus Segatto'

let activitySeq = 0
export function newActivity(
  type: LeadActivity['type'],
  description: string,
  createdAt = new Date().toISOString(),
): LeadActivity {
  return {
    id: `act-${Date.now()}-${activitySeq++}`,
    type,
    description,
    createdAt,
  }
}

export function createLeadFromCompany(company: Company): Lead {
  const now = new Date().toISOString()
  return {
    id: `lead-${company.id}-${Date.now()}`,
    companyId: company.id,
    status: 'novos',
    score: calculateOpportunityScore(company).score,
    owner: DEFAULT_OWNER,
    notes: '',
    activities: [newActivity('created', 'Lead adicionado ao pipeline', now)],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Leads pré-carregados da demonstração — simulam um pipeline já em uso.
 * O fluxo de novas buscas funciona de forma independente destes dados.
 */
export function buildDemoLeads(): Lead[] {
  const daysAgo = (d: number, h = 10) =>
    new Date(Date.now() - d * 86_400_000 - h * 3_600_000).toISOString()

  const spec: {
    companyId: string
    status: LeadStatus
    createdDaysAgo: number
    notes?: string
    timeline: [number, LeadActivity['type'], string][]
  }[] = [
    {
      companyId: 'cmp-005', // Clínica Sorriso
      status: 'novos',
      createdDaysAgo: 1,
      timeline: [[1, 'created', 'Lead adicionado ao pipeline']],
    },
    {
      companyId: 'cmp-007', // Advocacia Martins & Silva
      status: 'contatados',
      createdDaysAgo: 4,
      notes: 'Primeiro contato feito por telefone. Pediram material por e-mail.',
      timeline: [
        [4, 'created', 'Lead adicionado ao pipeline'],
        [3, 'contact', 'Ligação realizada — apresentação inicial'],
        [3, 'note', 'Material institucional enviado por e-mail'],
      ],
    },
    {
      companyId: 'cmp-003', // Triângulo Auto Service
      status: 'responderam',
      createdDaysAgo: 6,
      notes: 'Responderam com interesse. Aguardando definição de agenda.',
      timeline: [
        [6, 'created', 'Lead adicionado ao pipeline'],
        [5, 'contact', 'Mensagem enviada via WhatsApp'],
        [2, 'note', 'Resposta recebida — demonstraram interesse'],
      ],
    },
    {
      companyId: 'cmp-004', // Odonto Prime
      status: 'reuniao',
      createdDaysAgo: 9,
      notes: 'Reunião marcada para sexta-feira, 10h, na clínica.',
      timeline: [
        [9, 'created', 'Lead adicionado ao pipeline'],
        [8, 'contact', 'Ligação realizada — contato com a gerência'],
        [4, 'stage', 'Reunião de apresentação agendada'],
      ],
    },
    {
      companyId: 'cmp-006', // Segatto Contabilidade
      status: 'proposta',
      createdDaysAgo: 14,
      notes: 'Proposta enviada. Follow-up previsto para a próxima semana.',
      timeline: [
        [14, 'created', 'Lead adicionado ao pipeline'],
        [12, 'contact', 'Reunião de diagnóstico realizada'],
        [6, 'stage', 'Proposta comercial enviada'],
      ],
    },
  ]

  const companies = seed.companies as Company[]

  return spec.flatMap((item) => {
    const company = companies.find((c) => c.id === item.companyId)
    if (!company) return []
    return [
      {
        id: `lead-demo-${item.companyId}`,
        companyId: item.companyId,
        status: item.status,
        score: calculateOpportunityScore(company).score,
        owner: DEFAULT_OWNER,
        notes: item.notes ?? '',
        activities: item.timeline.map(([d, type, desc]) =>
          newActivity(type, desc, daysAgo(d)),
        ),
        createdAt: daysAgo(item.createdDaysAgo),
        updatedAt: daysAgo(0, 2),
      } satisfies Lead,
    ]
  })
}
