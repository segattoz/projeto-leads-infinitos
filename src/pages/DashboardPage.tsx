import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CalendarCheck, Crosshair, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { OpportunityChart } from '@/components/dashboard/OpportunityChart'
import { TerritoryCard } from '@/components/dashboard/TerritoryCard'
import { getDashboardMetrics } from '@/services/dashboardService'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useTerritoryStore } from '@/store/useTerritoryStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { greeting } from '@/lib/utils'

/** Visão Geral — dashboard inicial. */
export function DashboardPage() {
  const navigate = useNavigate()
  const leads = usePipelineStore((s) => s.leads)
  const territories = useTerritoryStore((s) => s.territories)
  const userName = useSettingsStore((s) => s.userName)

  const metrics = useMemo(() => getDashboardMetrics(leads), [leads])

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 animate-fade-in sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-bold text-ink sm:text-2xl">
          {greeting()}, {userName}.
        </h1>
        <p className="mt-1 text-sm text-muted">
          Encontre onde estão seus próximos clientes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          icon={Target}
          label="Oportunidades encontradas"
          value={metrics.opportunitiesFound}
          caption={`+${metrics.opportunitiesLast7Days} nos últimos 7 dias`}
          highlight
        />
        <MetricCard
          icon={Building2}
          label="Novas empresas"
          value={metrics.newCompanies}
          caption="identificadas recentemente"
        />
        <MetricCard
          icon={Crosshair}
          label="Em prospecção"
          value={metrics.inProspecting}
          caption="leads ativos no pipeline"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Reuniões"
          value={metrics.meetings}
          caption="agendadas este mês"
        />
      </div>

      <OpportunityChart />

      <section>
        <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">
            Territórios monitorados
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/explorar')}>
            <Plus className="h-3.5 w-3.5" /> Explorar novo território
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {territories.slice(0, 3).map((territory) => (
            <TerritoryCard
              key={territory.id}
              territory={territory}
              onClick={() => navigate('/app/monitoramentos')}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
