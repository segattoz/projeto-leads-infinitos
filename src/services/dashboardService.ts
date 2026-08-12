import type { Lead } from '@/types'
import { companiesById } from '@/services/repositories/CompanyRepository'
import { isRecentlyDiscovered } from '@/services/opportunityScoreService'

/**
 * Métricas da Visão Geral.
 * Os totais de base ("oportunidades encontradas") representam o acumulado
 * histórico da conta demo; os contadores de pipeline são calculados em tempo
 * real a partir do estado atual.
 */

const BASELINE_OPPORTUNITIES = 247
const BASELINE_LAST_7_DAYS = 34
const BASELINE_IN_PROSPECTING = 37
const BASELINE_MEETINGS = 7

export interface DashboardMetrics {
  opportunitiesFound: number
  opportunitiesLast7Days: number
  newCompanies: number
  inProspecting: number
  meetings: number
}

export function getDashboardMetrics(leads: Lead[]): DashboardMetrics {
  const newCompanies = [...companiesById.values()].filter((c) =>
    isRecentlyDiscovered(c),
  ).length

  const activeLeads = leads.filter((l) => l.status !== 'fechado').length
  const meetingLeads = leads.filter((l) => l.status === 'reuniao').length

  return {
    opportunitiesFound: BASELINE_OPPORTUNITIES,
    opportunitiesLast7Days: BASELINE_LAST_7_DAYS,
    newCompanies,
    inProspecting: BASELINE_IN_PROSPECTING + activeLeads,
    meetings: BASELINE_MEETINGS + meetingLeads,
  }
}

export interface ChartPoint {
  label: string
  value: number
}

/** Série semanal de oportunidades encontradas (últimas 8 semanas). */
export function getOpportunitiesSeries(): ChartPoint[] {
  const values = [18, 22, 19, 27, 31, 26, 34, 41]
  const now = new Date()
  return values.map((value, i) => {
    const weeksAgo = values.length - 1 - i
    const d = new Date(now.getTime() - weeksAgo * 7 * 86_400_000)
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return { label, value }
  })
}
