import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { IcpMonitorCard } from '@/components/dashboard/IcpMonitorCard'
import { useIcpStore, icpsForOrg } from '@/store/useIcpStore'
import { useCompanyStore, companiesForOrg } from '@/store/useCompanyStore'
import { useRadarStore, jobsForOrg } from '@/store/useRadarStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'

/** Lista de ICPs da organização ativa. */
export function IcpListPage() {
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const icps = icpsForOrg(useIcpStore((s) => s.icps), orgId)
  const companies = companiesForOrg(useCompanyStore((s) => s.companies), orgId)
  const radarJobs = jobsForOrg(useRadarStore((s) => s.jobs), orgId)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">ICPs</h1>
          <p className="mt-1 text-sm text-muted">Perfis de cliente ideal — quem o Radar deve procurar.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/app/icps/novo')}>
          <Plus className="h-4 w-4" /> Novo ICP
        </Button>
      </div>

      {icps.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhum ICP configurado ainda"
          description="Configure seu primeiro ICP e comece a mapear oportunidades com o Radar."
          action={
            <Button variant="primary" onClick={() => navigate('/app/icps/novo')}>
              <Plus className="h-4 w-4" /> Criar ICP
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {icps.map((icp) => (
            <IcpMonitorCard
              key={icp.id}
              icp={icp}
              companies={companies}
              radarJobs={radarJobs}
              footer={
                <div className="mt-4 border-t border-line pt-3">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/app/icps/${icp.id}`)}>
                    <Pencil className="h-3 w-3" /> Editar
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
