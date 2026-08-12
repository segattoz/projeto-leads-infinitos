import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KanbanSquare, Radar } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PipelineBoard } from '@/components/pipeline/PipelineBoard'
import { LeadDrawer } from '@/components/pipeline/LeadDrawer'
import { stageLabel } from '@/services/pipelineService'
import { usePipelineStore } from '@/store/usePipelineStore'

/** Pipeline comercial — Kanban de leads em prospecção. */
export function PipelinePage() {
  const navigate = useNavigate()
  const leads = usePipelineStore((s) => s.leads)
  const moveLead = usePipelineStore((s) => s.moveLead)
  const registerView = usePipelineStore((s) => s.registerView)

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const stats = useMemo(() => {
    const active = leads.filter((l) => l.status !== 'fechado').length
    const closed = leads.filter((l) => l.status === 'fechado').length
    return { active, closed }
  }, [leads])

  const handleMoveLead = (leadId: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === status) return
    moveLead(leadId, status)
    toast.success(`Lead movido para "${stageLabel(status)}".`)
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
    registerView(lead.id, 'Detalhes do lead visualizados')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end justify-between px-6 pb-4 pt-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.active} {stats.active === 1 ? 'lead ativo' : 'leads ativos'} em prospecção
            {stats.closed > 0 && ` · ${stats.closed} ${stats.closed === 1 ? 'fechado' : 'fechados'}`}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/explorar')}>
          <Radar className="h-4 w-4" /> Encontrar mais oportunidades
        </Button>
      </div>

      {leads.length === 0 ? (
        <div className="px-6">
          <EmptyState
            icon={KanbanSquare}
            title="Suas melhores oportunidades podem começar aqui."
            description="Explore um território e adicione empresas ao pipeline para acompanhar a prospecção."
            action={
              <Button variant="primary" onClick={() => navigate('/app/explorar')}>
                <Radar className="h-4 w-4" /> Explorar território
              </Button>
            }
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <PipelineBoard leads={leads} onMoveLead={handleMoveLead} onLeadClick={handleLeadClick} />
        </div>
      )}

      <LeadDrawer lead={selectedLead} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
