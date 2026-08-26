import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Activity, ActivityType, Company, Lead, LeadStage, LossReason, NextAction } from '@/types'
import { convertCompanyToLead, createActivity } from '@/services/leadService'
import { getCurrentVersion } from '@/services/icpService'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useIcpStore } from '@/store/useIcpStore'
import { logAudit } from '@/store/useAuditStore'
import { buildDemoLeadsAndActivities } from '@/data/leads.demo'

export type ConvertCompanyResult =
  | { ok: true; lead: Lead }
  | { ok: false; reason: 'already_lead' | 'icp_missing' }

interface LeadState {
  leads: Lead[]
  activities: Activity[]
  convertCompany: (company: Company, ownerName: string) => ConvertCompanyResult
  moveStage: (
    leadId: string,
    stage: LeadStage,
    opts?: { lostReason?: LossReason; lostCompetitor?: string; recycleAt?: string; wonAmount?: number; wonProduct?: string },
  ) => void
  addActivity: (leadId: string, type: ActivityType, opts?: { result?: string; note?: string }) => void
  updateNotes: (leadId: string, notes: string) => void
  setNextAction: (leadId: string, action: NextAction | undefined) => void
  changeOwner: (leadId: string, ownerName: string) => void
  hasCompany: (companyId: string) => boolean
  reset: () => void
}

function seedInitialState(): { leads: Lead[]; activities: Activity[] } {
  const companies = useCompanyStore.getState().companies
  const icps = useIcpStore.getState().icps
  const { leads, activities } = buildDemoLeadsAndActivities(companies, icps)
  for (const lead of leads) {
    useCompanyStore.getState().updateStatus(lead.companyId, 'convertida')
  }
  return { leads, activities }
}

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      ...seedInitialState(),

      convertCompany: (company, ownerName) => {
        if (get().hasCompany(company.id)) return { ok: false, reason: 'already_lead' }
        const icp = useIcpStore.getState().icps.find((i) => i.id === company.icpId)
        if (!icp) {
          console.error(
            `[i9radar] Não foi possível converter "${company.nomeFantasia}" (id ${company.id}): ICP "${company.icpId}" não encontrado.`,
          )
          return { ok: false, reason: 'icp_missing' }
        }
        const version = getCurrentVersion(icp)
        const lead = convertCompanyToLead(company, icp, version, ownerName)
        const activity = createActivity(company.organizationId, lead.id, 'note', ownerName, {
          note: 'Empresa convertida em lead a partir do Radar/Empresas',
        })
        set((state) => ({ leads: [lead, ...state.leads], activities: [activity, ...state.activities] }))
        useCompanyStore.getState().updateStatus(company.id, 'convertida')
        logAudit(company.organizationId, 'company', company.id, 'company_converted', `Convertida em lead (score ${lead.score.total})`, ownerName)
        logAudit(company.organizationId, 'lead', lead.id, 'score_calculated', `Score inicial calculado: ${lead.score.total}/100`, ownerName)
        return { ok: true, lead }
      },

      moveStage: (leadId, stage, opts = {}) =>
        set((state) => ({
          leads: state.leads.map((lead) => {
            if (lead.id !== leadId || lead.stage === stage) return lead
            const now = new Date().toISOString()
            const updated: Lead = { ...lead, stage, updatedAt: now }
            if (stage === 'ganho') {
              updated.wonAt = now
              updated.wonAmount = opts.wonAmount
              updated.wonProduct = opts.wonProduct
              logAudit(lead.organizationId, 'lead', lead.id, 'lead_won', `Lead marcado como ganho${opts.wonAmount ? ` (R$ ${opts.wonAmount.toLocaleString('pt-BR')})` : ''}`, lead.ownerName)
            } else if (stage === 'perdido') {
              updated.lostAt = now
              updated.lostReason = opts.lostReason
              updated.lostCompetitor = opts.lostCompetitor
              updated.recycleAt = opts.recycleAt
              logAudit(lead.organizationId, 'lead', lead.id, 'lead_lost', `Lead marcado como perdido${opts.lostReason ? ` (${opts.lostReason})` : ''}`, lead.ownerName)
            } else {
              logAudit(lead.organizationId, 'lead', lead.id, 'stage_changed', `Movido para "${stage}"`, lead.ownerName)
            }
            return updated
          }),
        })),

      addActivity: (leadId, type, opts = {}) =>
        set((state) => {
          const lead = state.leads.find((l) => l.id === leadId)
          if (!lead) return state
          const activity = createActivity(lead.organizationId, leadId, type, lead.ownerName, opts)
          return {
            activities: [activity, ...state.activities],
            leads: state.leads.map((l) => (l.id === leadId ? { ...l, updatedAt: activity.createdAt } : l)),
          }
        }),

      updateNotes: (leadId, notes) =>
        set((state) => ({
          leads: state.leads.map((l) => (l.id === leadId ? { ...l, notes, updatedAt: new Date().toISOString() } : l)),
        })),

      setNextAction: (leadId, action) =>
        set((state) => ({
          leads: state.leads.map((l) => (l.id === leadId ? { ...l, nextAction: action, updatedAt: new Date().toISOString() } : l)),
        })),

      changeOwner: (leadId, ownerName) =>
        set((state) => ({
          leads: state.leads.map((l) => {
            if (l.id !== leadId || l.ownerName === ownerName) return l
            logAudit(l.organizationId, 'lead', l.id, 'owner_changed', `Responsável alterado de "${l.ownerName}" para "${ownerName}"`, ownerName)
            return { ...l, ownerName, updatedAt: new Date().toISOString() }
          }),
        })),

      hasCompany: (companyId) => get().leads.some((l) => l.companyId === companyId),

      reset: () => set(seedInitialState()),
    }),
    { name: 'i9radar:leads', version: 1 },
  ),
)

export function leadsForOrg(leads: Lead[], organizationId: string): Lead[] {
  return leads.filter((l) => l.organizationId === organizationId)
}

export function activitiesForLead(activities: Activity[], leadId: string): Activity[] {
  return activities.filter((a) => a.leadId === leadId)
}
