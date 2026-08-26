import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KanbanSquare, Radar } from 'lucide-react'
import type { LeadStage } from '@/types'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PipelineBoard } from '@/components/pipeline/PipelineBoard'
import { stageLabel } from '@/services/leadService'
import { useLeadStore, leadsForOrg } from '@/store/useLeadStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'

/** Funil de vendas — Kanban de leads. */
export function FunilPage() {
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const leads = leadsForOrg(useLeadStore((s) => s.leads), orgId)
  const moveStage = useLeadStore((s) => s.moveStage)

  const stats = useMemo(() => {
    const active = leads.filter((l) => l.stage !== 'ganho' && l.stage !== 'perdido').length
    const won = leads.filter((l) => l.stage === 'ganho').length
    return { active, won }
  }, [leads])

  const handleMoveLead = (leadId: string, stage: LeadStage) => {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.stage === stage) return
    moveStage(leadId, stage)
    if (stage === 'ganho' || stage === 'perdido') {
      toast.success(`Lead movido para "${stageLabel(stage)}".`, {
        description: 'Abra o lead para registrar valor/motivo detalhado.',
        action: { label: 'Abrir lead', onClick: () => navigate(`/app/leads/${leadId}`) },
      })
    } else {
      toast.success(`Lead movido para "${stageLabel(stage)}".`)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col items-start gap-3 px-4 pb-4 pt-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Funil</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.active} {stats.active === 1 ? 'lead ativo' : 'leads ativos'}
            {stats.won > 0 && ` · ${stats.won} ${stats.won === 1 ? 'ganho' : 'ganhos'}`}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/empresas')}>
          <Radar className="h-4 w-4" /> Converter mais empresas
        </Button>
      </div>

      {leads.length === 0 ? (
        <div className="px-4 sm:px-6">
          <EmptyState
            icon={KanbanSquare}
            title="Nenhuma oportunidade aberta."
            description="Leads qualificados aparecerão aqui — converta empresas na tela Empresas para começar."
            action={
              <Button variant="primary" onClick={() => navigate('/app/empresas')}>
                <Radar className="h-4 w-4" /> Ver empresas
              </Button>
            }
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <PipelineBoard leads={leads} onMoveLead={handleMoveLead} onLeadClick={(lead) => navigate(`/app/leads/${lead.id}`)} />
        </div>
      )}
    </div>
  )
}
