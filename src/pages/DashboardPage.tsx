import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Building2, Percent, Plus, Target, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { IcpMonitorCard } from '@/components/dashboard/IcpMonitorCard'
import {
  getDashboardMetrics,
  getConversionFunnel,
  getPerformanceBySource,
  getOperationalAlerts,
} from '@/services/dashboardService'
import { useOrganizationStore } from '@/store/useOrganizationStore'
import { useCompanyStore, companiesForOrg } from '@/store/useCompanyStore'
import { useLeadStore, leadsForOrg } from '@/store/useLeadStore'
import { useIcpStore, icpsForOrg } from '@/store/useIcpStore'
import { useRadarStore, jobsForOrg } from '@/store/useRadarStore'
import { getOrganization } from '@/data/organizations'
import { greeting } from '@/lib/utils'

/** Visão Geral — dashboard executivo. */
export function DashboardPage() {
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const org = getOrganization(orgId)

  const companies = companiesForOrg(useCompanyStore((s) => s.companies), orgId)
  const leads = leadsForOrg(useLeadStore((s) => s.leads), orgId)
  const sources = useCompanyStore((s) => s.sources)
  const icps = icpsForOrg(useIcpStore((s) => s.icps), orgId)
  const radarJobs = jobsForOrg(useRadarStore((s) => s.jobs), orgId)

  const metrics = useMemo(() => getDashboardMetrics(companies, leads), [companies, leads])
  const funnel = useMemo(() => getConversionFunnel(companies, leads), [companies, leads])
  const bySource = useMemo(() => getPerformanceBySource(companies, leads, sources), [companies, leads, sources])
  const alerts = useMemo(() => getOperationalAlerts(leads, radarJobs), [leads, radarJobs])

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 animate-fade-in sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-bold text-ink sm:text-2xl">
          {greeting()}. {org?.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Do mapeamento de mercado ao fechamento — o que precisa da sua atenção hoje.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <MetricCard icon={Building2} label="Empresas encontradas" value={metrics.companiesFound} caption="descobertas pelo Radar" highlight />
        <MetricCard icon={Users} label="Leads ativos" value={metrics.activeLeads} caption="em prospecção" />
        <MetricCard icon={Target} label="Leads qualificados" value={metrics.qualifiedLeads} caption="passaram do primeiro contato" />
        <MetricCard icon={TrendingUp} label="Oportunidades abertas" value={metrics.openOpportunities} caption="em reunião, proposta ou negociação" />
        <MetricCard icon={Percent} label="Taxa de conversão" value={metrics.conversionRate} caption="leads fechados que viraram ganho" />
        <MetricCard icon={Target} label="Ganhos no período" value={metrics.wonInPeriod} caption="últimos 30 dias" />
      </div>

      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warn" /> Precisa da sua atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li key={alert.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${alert.severity === 'danger' ? 'bg-danger' : 'bg-warn'}`}
                  />
                  <span className="text-ink">{alert.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart stages={funnel} />

        <Card>
          <CardHeader>
            <CardTitle>Performance por origem</CardTitle>
          </CardHeader>
          <CardContent>
            {bySource.length === 0 ? (
              <p className="text-xs text-faint">Nenhum lead registrado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                      <th className="py-2 font-semibold">Fonte</th>
                      <th className="py-2 font-semibold">Leads</th>
                      <th className="py-2 font-semibold">Qualificados</th>
                      <th className="py-2 font-semibold">Ganhos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bySource.map((row) => (
                      <tr key={row.sourceName} className="border-b border-line/60 last:border-0">
                        <td className="py-2 text-ink">{row.sourceName}</td>
                        <td className="py-2 font-mono text-muted">{row.leads}</td>
                        <td className="py-2 font-mono text-muted">{row.qualified}</td>
                        <td className="py-2 font-mono text-success-strong">{row.won}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">ICPs monitorados</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/icps/novo')}>
            <Plus className="h-3.5 w-3.5" /> Novo ICP
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
            {icps.slice(0, 3).map((icp) => (
              <IcpMonitorCard
                key={icp.id}
                icp={icp}
                companies={companies}
                radarJobs={radarJobs}
                onClick={() => navigate('/app/radar')}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
