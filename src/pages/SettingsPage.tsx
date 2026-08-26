import { toast } from 'sonner'
import { Building2, Database, PanelLeft, RotateCcw, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { restoreDemoData, useSettingsStore } from '@/store/useSettingsStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'
import { getOrganization, membersOf } from '@/data/organizations'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  commercial_manager: 'Gerente comercial',
  sdr: 'SDR',
  closer: 'Closer',
  viewer: 'Visualização',
  integration: 'Integração',
}

/** Configurações — organização ativa e preferências da plataforma. */
export function SettingsPage() {
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const org = getOrganization(orgId)
  const members = membersOf(orgId)

  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useSettingsStore((s) => s.setSidebarCollapsed)

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Configurações</h1>
        <p className="mt-1 text-sm text-muted">Organização ativa e preferências da plataforma.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Organização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-muted">Nome</span>
            <span className="text-ink">{org?.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-muted">Plano</span>
            <span className="font-medium text-primary-strong">Demonstração</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Região padrão</span>
            <span className="text-ink">{org?.city}/{org?.state}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
              <div>
                <p className="text-ink">{member.name}</p>
                <p className="text-[11px] text-faint">{member.email}</p>
              </div>
              <Badge variant="outline">{ROLE_LABELS[member.role] ?? member.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelLeft className="h-4 w-4 text-primary" /> Interface
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink">Menu lateral recolhido</p>
              <p className="text-xs text-faint">Maximiza a área útil das telas.</p>
            </div>
            <Switch checked={sidebarCollapsed} onChange={setSidebarCollapsed} />
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
            Esta V0 do i9 Radar roda inteiramente no navegador (sem backend conectado ainda).
            Empresas, ICPs, execuções do Radar e leads ficam salvos neste navegador, isolados
            por organização.
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
