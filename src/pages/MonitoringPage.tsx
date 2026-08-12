import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pause, Pencil, Play, Plus, Radar, SatelliteDish } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TerritoryCard } from '@/components/dashboard/TerritoryCard'
import { formatRelative } from '@/lib/utils'
import { useTerritoryStore } from '@/store/useTerritoryStore'

/** Monitoramentos — territórios acompanhados continuamente. */
export function MonitoringPage() {
  const navigate = useNavigate()
  const territories = useTerritoryStore((s) => s.territories)
  const toggleActive = useTerritoryStore((s) => s.toggleActive)

  const lastUpdateLabel = (iso: string) => {
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    return isToday
      ? `hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      : formatRelative(iso)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Territórios monitorados</h1>
          <p className="mt-1 text-sm text-muted">
            O radar acompanha seus territórios e avisa quando novas empresas surgem.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/app/explorar')}>
          <Plus className="h-4 w-4" /> Criar monitoramento
        </Button>
      </div>

      {territories.length === 0 ? (
        <EmptyState
          icon={SatelliteDish}
          title="Nenhum território monitorado"
          description="Explore uma região e transforme-a em um monitoramento contínuo."
          action={
            <Button variant="primary" onClick={() => navigate('/app/explorar')}>
              <Radar className="h-4 w-4" /> Explorar território
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {territories.map((territory) => (
            <TerritoryCard
              key={territory.id}
              territory={territory}
              footer={
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-3 text-[10px] text-faint">
                    Última atualização: {lastUpdateLabel(territory.lastUpdatedAt)}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/app/explorar')}
                    >
                      <Radar className="h-3 w-3" /> Explorar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toast.info('Edição de território disponível na versão completa.')
                      }
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        toggleActive(territory.id)
                        toast.success(
                          territory.active
                            ? 'Monitoramento pausado.'
                            : 'Monitoramento reativado.',
                        )
                      }}
                    >
                      {territory.active ? (
                        <>
                          <Pause className="h-3 w-3" /> Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" /> Retomar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
