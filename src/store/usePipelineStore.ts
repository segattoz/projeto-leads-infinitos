import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company, Lead, LeadStatus } from '@/types'
import {
  buildDemoLeads,
  createLeadFromCompany,
  newActivity,
  stageLabel,
} from '@/services/pipelineService'

interface PipelineState {
  leads: Lead[]
  addCompany: (company: Company) => Lead | null
  moveLead: (leadId: string, status: LeadStatus) => void
  addNote: (leadId: string, note: string) => void
  registerContact: (leadId: string, description?: string) => void
  registerView: (leadId: string, description: string) => void
  hasCompany: (companyId: string) => boolean
  reset: () => void
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      leads: buildDemoLeads(),

      addCompany: (company) => {
        if (get().hasCompany(company.id)) return null
        const lead = createLeadFromCompany(company)
        set((state) => ({ leads: [lead, ...state.leads] }))
        return lead
      },

      moveLead: (leadId, status) =>
        set((state) => ({
          leads: state.leads.map((lead) => {
            if (lead.id !== leadId || lead.status === status) return lead
            return {
              ...lead,
              status,
              updatedAt: new Date().toISOString(),
              activities: [
                ...lead.activities,
                newActivity('stage', `Movido para "${stageLabel(status)}"`),
              ],
            }
          }),
        })),

      addNote: (leadId, note) =>
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  notes: note,
                  updatedAt: new Date().toISOString(),
                  activities: [
                    ...lead.activities,
                    newActivity('note', 'Observação registrada'),
                  ],
                }
              : lead,
          ),
        })),

      registerContact: (leadId, description = 'Contato registrado') =>
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  updatedAt: new Date().toISOString(),
                  activities: [
                    ...lead.activities,
                    newActivity('contact', description),
                  ],
                }
              : lead,
          ),
        })),

      registerView: (leadId, description) =>
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  activities: [...lead.activities, newActivity('view', description)],
                }
              : lead,
          ),
        })),

      hasCompany: (companyId) =>
        get().leads.some((lead) => lead.companyId === companyId),

      reset: () => set({ leads: buildDemoLeads() }),
    }),
    { name: 'segattos-leads:pipeline', version: 1 },
  ),
)
