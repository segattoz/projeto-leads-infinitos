import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Icp, IcpVersion, RadarJob, RadarJobItem, Territory } from '@/types'
import { getAdapter, normalizeAndDedupe, parseCsv } from '@/services/radarService'
import { poolItemToCompany } from '@/services/companyService'
import { calculateLeadScore } from '@/services/scoreService'
import { useCompanyStore, companiesForOrg } from '@/store/useCompanyStore'
import { logAudit } from '@/store/useAuditStore'

let seq = 1
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${seq++}`
}

export interface RunRadarJobInput {
  organizationId: string
  icp: Icp
  icpVersion: IcpVersion
  territory: Territory
  sourceType: 'seed_database' | 'csv_import'
  csvText?: string
  createdBy: string
}

interface RadarState {
  jobs: RadarJob[]
  runJob: (input: RunRadarJobInput) => Promise<RadarJob>
  cancelJob: (id: string) => void
  reset: () => void
}

export const useRadarStore = create<RadarState>()(
  persist(
    (set) => ({
      jobs: [],

      runJob: async (input) => {
        const startedAt = new Date().toISOString()
        const adapter = getAdapter(input.sourceType)
        const jobId = nextId('job')

        const draft: RadarJob = {
          id: jobId,
          organizationId: input.organizationId,
          icpId: input.icp.id,
          icpVersionId: input.icpVersion.id,
          territory: input.territory,
          sourceId: adapter.id,
          sourceName: adapter.name,
          status: 'running',
          startedAt,
          counts: { found: 0, new: 0, duplicates: 0, possibleDuplicates: 0, errors: 0 },
          items: [],
          createdBy: input.createdBy,
          createdAt: startedAt,
        }
        set((state) => ({ jobs: [draft, ...state.jobs] }))

        const rawResults = await adapter.search({
          organizationId: input.organizationId,
          icpVersion: input.icpVersion,
          territory: input.territory,
          csvText: input.csvText,
        })

        const csvErrors =
          input.sourceType === 'csv_import' && input.csvText ? parseCsv(input.csvText).errors : []

        const existingCompanies = companiesForOrg(useCompanyStore.getState().companies, input.organizationId)

        const processed = normalizeAndDedupe(rawResults, existingCompanies, (result) =>
          poolItemToCompany(result, input.organizationId, input.icp.id),
        )

        const items: RadarJobItem[] = []
        let newCount = 0
        let duplicateCount = 0
        let possibleDuplicateCount = 0

        for (const item of processed) {
          if (item.isNewCompany && item.company) {
            const score = calculateLeadScore(item.company, input.icpVersion)
            useCompanyStore.getState().upsertCompany(item.company)
            useCompanyStore.getState().addSource({
              companyId: item.company.id,
              radarJobId: jobId,
              dataSourceId: adapter.id,
              dataSourceName: adapter.name,
              foundAt: startedAt,
            })
            void score // score potencial recalculado sob demanda nas telas; aqui só validamos que o cálculo não falha
            if (item.outcome === 'possible_duplicate') possibleDuplicateCount++
            else newCount++
          } else if (item.company) {
            useCompanyStore.getState().addSource({
              companyId: item.company.id,
              radarJobId: jobId,
              dataSourceId: adapter.id,
              dataSourceName: adapter.name,
              foundAt: startedAt,
            })
            duplicateCount++
          }

          items.push({
            id: nextId('jobitem'),
            radarJobId: jobId,
            companyId: item.company?.id,
            rawName: item.rawName,
            outcome: item.outcome,
            detail: item.detail,
          })
        }

        for (const error of csvErrors) {
          items.push({
            id: nextId('jobitem'),
            radarJobId: jobId,
            rawName: `Linha ${error.line}`,
            outcome: 'error',
            detail: error.reason,
          })
        }

        const finishedAt = new Date().toISOString()
        const errorCount = csvErrors.length
        const status: RadarJob['status'] =
          errorCount > 0 && errorCount < items.length ? 'partial' : errorCount > 0 && items.length === errorCount ? 'failed' : 'completed'

        const finished: RadarJob = {
          ...draft,
          status,
          finishedAt,
          counts: {
            found: rawResults.length + errorCount,
            new: newCount,
            duplicates: duplicateCount,
            possibleDuplicates: possibleDuplicateCount,
            errors: errorCount,
          },
          items,
        }

        set((state) => ({ jobs: state.jobs.map((j) => (j.id === jobId ? finished : j)) }))
        logAudit(
          input.organizationId,
          'radar_job',
          jobId,
          'radar_job_completed',
          `Execução do Radar concluída (${status}): ${newCount} novas, ${duplicateCount} duplicadas, ${possibleDuplicateCount} possíveis duplicatas, ${errorCount} erros`,
          input.createdBy,
        )
        return finished
      },

      cancelJob: (id) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id && j.status === 'running'
              ? { ...j, status: 'cancelled', finishedAt: new Date().toISOString() }
              : j,
          ),
        })),

      reset: () => set({ jobs: [] }),
    }),
    { name: 'i9radar:radar-jobs', version: 1 },
  ),
)

export function jobsForOrg(jobs: RadarJob[], organizationId: string): RadarJob[] {
  return jobs.filter((j) => j.organizationId === organizationId)
}
