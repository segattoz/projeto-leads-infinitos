import { toast } from 'sonner'
import { Database, Flame, PanelLeft, RotateCcw, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { restoreDemoData, useSettingsStore } from '@/store/useSettingsStore'

/** Configurações — preferências básicas e utilitários da demonstração. */
export function SettingsPage() {
  const heatmapEnabled = useSettingsStore((s) => s.heatmapEnabled)
  const setHeatmapEnabled = useSettingsStore((s) => s.setHeatmapEnabled)
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useSettingsStore((s) => s.setSidebarCollapsed)
  const userName = useSettingsStore((s) => s.userName)

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-6 py-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Configurações</h1>
        <p className="mt-1 text-sm text-muted">Preferências da sua conta e da plataforma.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-muted">Nome</span>
            <span className="text-ink">{userName} Segatto</span>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-muted">Plano</span>
            <span className="font-medium text-primary-strong">Demonstração</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Região padrão</span>
            <span className="text-ink">Uberlândia/MG</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelLeft className="h-4 w-4 text-primary" /> Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink">Menu lateral recolhido</p>
              <p className="text-xs text-faint">Maximiza a área útil do mapa.</p>
            </div>
            <Switch checked={sidebarCollapsed} onChange={setSidebarCollapsed} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-ink">
                <Flame className="h-3.5 w-3.5 text-primary" /> Mapa de calor por padrão
              </p>
              <p className="text-xs text-faint">
                Exibe a concentração de empresas ao abrir o mapa.
              </p>
            </div>
            <Switch checked={heatmapEnabled} onChange={setHeatmapEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs leading-relaxed text-muted">
            Esta POC usa uma base local que simula uma fatia dos Dados Abertos do CNPJ da
            Receita Federal. Leads, territórios e preferências ficam salvos neste navegador.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              restoreDemoData()
              toast.success('Dados de demonstração restaurados.')
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar dados de demonstração
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
