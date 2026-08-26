import type { Activity, ActivityType, Company, Icp, IcpVersion, Lead, LeadStage } from '@/types'
import { calculateLeadScore } from '@/services/scoreService'

export const LEAD_STAGES: { id: LeadStage; label: string }[] = [
  { id: 'novo', label: 'Novo' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'ganho', label: 'Ganho' },
  { id: 'perdido', label: 'Perdido' },
]

export function stageLabel(stage: LeadStage): string {
  return LEAD_STAGES.find((s) => s.id === stage)?.label ?? stage
}

let seq = 1
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${seq++}`
}

export function convertCompanyToLead(company: Company, icp: Icp, icpVersion: IcpVersion, ownerName: string): Lead {
  const now = new Date().toISOString()
  return {
    id: nextId('lead'),
    organizationId: company.organizationId,
    companyId: company.id,
    icpId: icp.id,
    icpVersionId: icpVersion.id,
    stage: 'novo',
    ownerName,
    score: calculateLeadScore(company, icpVersion),
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function createActivity(
  organizationId: string,
  leadId: string,
  type: ActivityType,
  userName: string,
  opts: { result?: string; note?: string; createdAt?: string } = {},
): Activity {
  return {
    id: nextId('activity'),
    organizationId,
    leadId,
    type,
    userName,
    result: opts.result,
    note: opts.note,
    createdAt: opts.createdAt ?? new Date().toISOString(),
  }
}
