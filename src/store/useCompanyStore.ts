import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company, CompanySource, CompanyStatus } from '@/types'
import { anchorPoolItems } from '@/services/repositories/CompanyPoolRepository'
import { poolItemToCompany } from '@/services/companyService'
import { useIcpStore } from '@/store/useIcpStore'

let sourceSeq = 1
function nextSourceId(): string {
  return `csrc-${Date.now()}-${sourceSeq++}`
}

interface CompanyState {
  companies: Company[]
  sources: CompanySource[]
  upsertCompany: (company: Company) => void
  addSource: (source: Omit<CompanySource, 'id'>) => void
  updateStatus: (id: string, status: CompanyStatus) => void
  reset: () => void
}

function buildInitialCompanies(): Company[] {
  // Semeia cada organização com as empresas "âncora" da demonstração,
  // vinculadas ao primeiro ICP daquela organização.
  const icps = useIcpStore.getState().icps
  const companies: Company[] = []
  for (const orgId of ['org-a', 'org-b']) {
    const firstIcp = icps.find((icp) => icp.organizationId === orgId)
    for (const item of anchorPoolItems(orgId)) {
      companies.push(poolItemToCompany(item, orgId, firstIcp?.id))
    }
  }
  return companies
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      companies: buildInitialCompanies(),
      sources: [],

      upsertCompany: (company) =>
        set((state) => {
          const exists = state.companies.some((c) => c.id === company.id)
          return {
            companies: exists
              ? state.companies.map((c) => (c.id === company.id ? company : c))
              : [company, ...state.companies],
          }
        }),

      addSource: (source) =>
        set((state) => ({ sources: [{ ...source, id: nextSourceId() }, ...state.sources] })),

      updateStatus: (id, status) =>
        set((state) => ({
          companies: state.companies.map((c) => (c.id === id ? { ...c, status } : c)),
        })),

      reset: () => set({ companies: buildInitialCompanies(), sources: [] }),
    }),
    { name: 'i9radar:companies', version: 1 },
  ),
)

export function companiesForOrg(companies: Company[], organizationId: string): Company[] {
  return companies.filter((c) => c.organizationId === organizationId)
}

export function sourcesForCompany(sources: CompanySource[], companyId: string): CompanySource[] {
  return sources.filter((s) => s.companyId === companyId)
}
