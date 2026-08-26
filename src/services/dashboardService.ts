import type { Company, CompanySource, Lead, RadarJob } from '@/types'

/** Métricas executivas da Visão Geral — todas calculadas a partir de dados reais da organização ativa. */

export interface DashboardMetrics {
  companiesFound: number
  activeLeads: number
  qualifiedLeads: number
  openOpportunities: number
  conversionRate: number
  wonInPeriod: number
  wonAmountInPeriod: number
}

const PERIOD_DAYS = 30

export function getDashboardMetrics(companies: Company[], leads: Lead[]): DashboardMetrics {
  const periodStart = Date.now() - PERIOD_DAYS * 86_400_000

  const activeLeads = leads.filter((l) => l.stage !== 'ganho' && l.stage !== 'perdido')
  const qualifiedLeads = leads.filter((l) => l.stage !== 'novo' && l.stage !== 'perdido')
  const openOpportunities = leads.filter((l) => ['reuniao', 'proposta', 'negociacao'].includes(l.stage))
  const wonLeads = leads.filter((l) => l.stage === 'ganho')
  const wonInPeriod = wonLeads.filter((l) => l.wonAt && new Date(l.wonAt).getTime() >= periodStart)
  const closedLeads = leads.filter((l) => l.stage === 'ganho' || l.stage === 'perdido')

  return {
    companiesFound: companies.length,
    activeLeads: activeLeads.length,
    qualifiedLeads: qualifiedLeads.length,
    openOpportunities: openOpportunities.length,
    conversionRate: closedLeads.length > 0 ? Math.round((wonLeads.length / closedLeads.length) * 100) : 0,
    wonInPeriod: wonInPeriod.length,
    wonAmountInPeriod: wonInPeriod.reduce((sum, l) => sum + (l.wonAmount ?? 0), 0),
  }
}

export interface FunnelStage {
  label: string
  value: number
}

export function getConversionFunnel(companies: Company[], leads: Lead[]): FunnelStage[] {
  const contacted = leads.filter((l) => l.stage !== 'novo').length
  const qualified = leads.filter((l) => ['reuniao', 'proposta', 'negociacao', 'ganho'].includes(l.stage)).length
  const opportunity = leads.filter((l) => ['proposta', 'negociacao', 'ganho'].includes(l.stage)).length
  const won = leads.filter((l) => l.stage === 'ganho').length

  return [
    { label: 'Radar', value: companies.length },
    { label: 'Lead', value: leads.length },
    { label: 'Contato', value: contacted },
    { label: 'Qualificado', value: qualified },
    { label: 'Oportunidade', value: opportunity },
    { label: 'Ganho', value: won },
  ]
}

export interface SourcePerformance {
  sourceName: string
  leads: number
  qualified: number
  won: number
}

export function getPerformanceBySource(
  companies: Company[],
  leads: Lead[],
  sources: CompanySource[],
): SourcePerformance[] {
  const sourceByCompany = new Map<string, string>()
  for (const source of sources) {
    if (!sourceByCompany.has(source.companyId)) {
      sourceByCompany.set(source.companyId, source.dataSourceName)
    }
  }

  const companyById = new Map(companies.map((c) => [c.id, c]))
  const stats = new Map<string, SourcePerformance>()

  for (const lead of leads) {
    const company = companyById.get(lead.companyId)
    const sourceName = (company && sourceByCompany.get(company.id)) || 'Cadastro manual'
    const entry = stats.get(sourceName) ?? { sourceName, leads: 0, qualified: 0, won: 0 }
    entry.leads++
    if (lead.stage !== 'novo' && lead.stage !== 'perdido') entry.qualified++
    if (lead.stage === 'ganho') entry.won++
    stats.set(sourceName, entry)
  }

  return [...stats.values()].sort((a, b) => b.leads - a.leads)
}

export interface OperationalAlert {
  id: string
  message: string
  severity: 'warn' | 'danger'
}

export function getOperationalAlerts(leads: Lead[], radarJobs: RadarJob[]): OperationalAlert[] {
  const alerts: OperationalAlert[] = []
  const now = Date.now()

  const activeLeads = leads.filter((l) => l.stage !== 'ganho' && l.stage !== 'perdido')

  const withoutNextAction = activeLeads.filter((l) => !l.nextAction)
  if (withoutNextAction.length > 0) {
    alerts.push({
      id: 'no-next-action',
      message: `${withoutNextAction.length} ${withoutNextAction.length === 1 ? 'lead está' : 'leads estão'} sem próxima ação definida`,
      severity: 'warn',
    })
  }

  const overdue = activeLeads.filter((l) => l.nextAction && new Date(l.nextAction.dueAt).getTime() < now)
  if (overdue.length > 0) {
    alerts.push({
      id: 'overdue',
      message: `${overdue.length} ${overdue.length === 1 ? 'ação está atrasada' : 'ações estão atrasadas'}`,
      severity: 'danger',
    })
  }

  const stalled = leads.filter((l) => {
    if (!['reuniao', 'proposta', 'negociacao'].includes(l.stage)) return false
    return now - new Date(l.updatedAt).getTime() > 7 * 86_400_000
  })
  if (stalled.length > 0) {
    alerts.push({
      id: 'stalled',
      message: `${stalled.length} ${stalled.length === 1 ? 'oportunidade está parada' : 'oportunidades estão paradas'} há mais de 7 dias`,
      severity: 'warn',
    })
  }

  const failedJobs = radarJobs.filter((j) => j.status === 'failed' || j.counts.errors > 0)
  if (failedJobs.length > 0) {
    alerts.push({
      id: 'radar-errors',
      message: `${failedJobs.length} ${failedJobs.length === 1 ? 'execução do Radar teve' : 'execuções do Radar tiveram'} erros`,
      severity: 'danger',
    })
  }

  return alerts
}
