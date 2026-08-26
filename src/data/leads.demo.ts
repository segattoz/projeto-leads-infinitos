import type { Activity, ActivityType, Company, Icp, Lead, LeadStage } from '@/types'
import { calculateLeadScore } from '@/services/scoreService'
import { getCurrentVersion } from '@/services/icpService'

/**
 * Leads pré-carregados da demonstração — simulam um funil já em uso.
 * O fluxo de conversão a partir do Radar/Empresas funciona de forma
 * independente destes dados. Empresas são localizadas por nome (estável),
 * já que os ids são gerados dinamicamente na inicialização do store.
 */

let seq = 1
function nextId(prefix: string): string {
  return `${prefix}-demo-${seq++}`
}

function daysAgo(d: number, h = 10): string {
  return new Date(Date.now() - d * 86_400_000 - h * 3_600_000).toISOString()
}

interface DemoLeadSpec {
  companyName: string
  stage: LeadStage
  ownerName: string
  createdDaysAgo: number
  notes?: string
  timeline: [number, ActivityType, string][]
}

const SPECS: DemoLeadSpec[] = [
  {
    companyName: 'Clínica Sorriso',
    stage: 'novo',
    ownerName: 'Renata Alves',
    createdDaysAgo: 1,
    timeline: [[1, 'note', 'Empresa convertida em lead a partir do Radar']],
  },
  {
    companyName: 'Advocacia Martins & Silva',
    stage: 'diagnostico',
    ownerName: 'Renata Alves',
    createdDaysAgo: 4,
    notes: 'Primeiro contato feito por telefone. Pediram material por e-mail.',
    timeline: [
      [4, 'note', 'Empresa convertida em lead a partir do Radar'],
      [3, 'call', 'Ligação de apresentação inicial'],
      [3, 'email', 'Material institucional enviado por e-mail'],
    ],
  },
  {
    companyName: 'Triângulo Auto Service',
    stage: 'reuniao',
    ownerName: 'Bruno Costa',
    createdDaysAgo: 6,
    notes: 'Reunião marcada para sexta-feira, 10h.',
    timeline: [
      [6, 'note', 'Empresa convertida em lead a partir do Radar'],
      [5, 'whatsapp', 'Mensagem enviada via WhatsApp'],
      [2, 'meeting', 'Reunião de apresentação agendada'],
    ],
  },
  {
    companyName: 'Odonto Prime',
    stage: 'proposta',
    ownerName: 'Bruno Costa',
    createdDaysAgo: 9,
    notes: 'Proposta enviada. Follow-up previsto para a próxima semana.',
    timeline: [
      [9, 'note', 'Empresa convertida em lead a partir do Radar'],
      [8, 'call', 'Ligação — contato com a gerência'],
      [4, 'proposal', 'Proposta comercial enviada'],
    ],
  },
  {
    companyName: 'Master Contabilidade',
    stage: 'negociacao',
    ownerName: 'Bruno Costa',
    createdDaysAgo: 14,
    notes: 'Em negociação de valores e prazo de implantação.',
    timeline: [
      [14, 'note', 'Empresa convertida em lead a partir do Radar'],
      [12, 'meeting', 'Reunião de diagnóstico realizada'],
      [6, 'proposal', 'Proposta comercial enviada'],
      [2, 'call', 'Ligação de negociação de valores'],
    ],
  },
  {
    companyName: 'Odonto Ribeirânia',
    stage: 'diagnostico',
    ownerName: 'Diego Nunes',
    createdDaysAgo: 5,
    notes: 'Aguardando retorno sobre orçamento disponível.',
    timeline: [
      [5, 'note', 'Empresa convertida em lead a partir do Radar'],
      [3, 'call', 'Ligação de diagnóstico inicial'],
    ],
  },
]

export function buildDemoLeadsAndActivities(
  companies: Company[],
  icps: Icp[],
): { leads: Lead[]; activities: Activity[] } {
  const leads: Lead[] = []
  const activities: Activity[] = []

  for (const spec of SPECS) {
    const company = companies.find((c) => c.nomeFantasia === spec.companyName)
    const icp = company ? icps.find((i) => i.id === company.icpId) : undefined
    if (!company || !icp) continue

    const version = getCurrentVersion(icp)
    const leadId = nextId('lead')
    const createdAt = daysAgo(spec.createdDaysAgo)

    leads.push({
      id: leadId,
      organizationId: company.organizationId,
      companyId: company.id,
      icpId: icp.id,
      icpVersionId: version.id,
      stage: spec.stage,
      ownerName: spec.ownerName,
      score: calculateLeadScore(company, version),
      notes: spec.notes ?? '',
      createdAt,
      updatedAt: daysAgo(0, 2),
    })

    for (const [d, type, description] of spec.timeline) {
      activities.push({
        id: nextId('activity'),
        organizationId: company.organizationId,
        leadId,
        type,
        userName: spec.ownerName,
        note: description,
        createdAt: daysAgo(d),
      })
    }
  }

  return { leads, activities }
}
