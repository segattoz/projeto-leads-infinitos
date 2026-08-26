import { useNavigate } from 'react-router-dom'
import { Plus, Radar as RadarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { IcpMonitorCard } from '@/components/dashboard/IcpMonitorCard'
import { useRadarStore, jobsForOrg } from '@/store/useRadarStore'
import { useIcpStore, icpsForOrg } from '@/store/useIcpStore'
import { useCompanyStore, companiesForOrg } from '@/store/useCompanyStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'
import { formatDateTime, formatRelative } from '@/lib/utils'
import { RADAR_STATUS_BADGE } from '@/components/radar/radarStatusMeta'

/** Landing do Radar — histórico de execuções e ICPs monitorados. */
export function RadarListPage() {
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const jobs = jobsForOrg(useRadarStore((s) => s.jobs), orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const icps = icpsForOrg(useIcpStore((s) => s.icps), orgId)
  const companies = companiesForOrg(useCompanyStore((s) => s.companies), orgId)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Radar</h1>
          <p className="mt-1 text-sm text-muted">Mapeie o mercado e descubra empresas compatíveis com seus ICPs.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/app/radar/novo')}>
          <RadarIcon className="h-4 w-4" /> Novo Radar
        </Button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-muted">ICPs monitorados</h2>
        {icps.length === 0 ? (
          <EmptyState
            icon={RadarIcon}
            title="Nenhum ICP configurado"
            description="Crie um ICP antes de executar o Radar."
            action={
              <Button variant="primary" onClick={() => navigate('/app/icps/novo')}>
                <Plus className="h-4 w-4" /> Criar ICP
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {icps.map((icp) => (
              <IcpMonitorCard key={icp.id} icp={icp} companies={companies} radarJobs={jobs} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-muted">Execuções recentes</h2>
        {jobs.length === 0 ? (
          <EmptyState
            icon={RadarIcon}
            title="Nenhuma execução realizada"
            description="Configure seu primeiro ICP e comece a mapear oportunidades."
            action={
              <Button variant="primary" onClick={() => navigate('/app/radar/novo')}>
                <RadarIcon className="h-4 w-4" /> Executar Radar
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                  <th className="px-4 py-3 font-semibold">ICP</th>
                  <th className="px-3 py-3 font-semibold">Fonte</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Encontradas</th>
                  <th className="px-3 py-3 font-semibold">Novas</th>
                  <th className="px-3 py-3 font-semibold">Duplicadas</th>
                  <th className="px-3 py-3 font-semibold">Erros</th>
                  <th className="px-3 py-3 font-semibold">Quando</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const icp = icps.find((i) => i.id === job.icpId)
                  const status = RADAR_STATUS_BADGE[job.status]
                  return (
                    <tr
                      key={job.id}
                      className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2"
                      onClick={() => navigate(`/app/radar/${job.id}`)}
                    >
                      <td className="px-4 py-2.5 font-medium text-ink">{icp?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted">{job.sourceName}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted">{job.counts.found}</td>
                      <td className="px-3 py-2.5 font-mono text-success-strong">{job.counts.new}</td>
                      <td className="px-3 py-2.5 font-mono text-muted">{job.counts.duplicates}</td>
                      <td className="px-3 py-2.5 font-mono text-danger">{job.counts.errors || '—'}</td>
                      <td className="px-3 py-2.5 text-faint" title={formatDateTime(job.createdAt)}>
                        {formatRelative(job.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
