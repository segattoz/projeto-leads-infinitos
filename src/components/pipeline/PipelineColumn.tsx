import { useDroppable } from '@dnd-kit/core'
import type { Lead, LeadStage } from '@/types'
import { cn } from '@/lib/utils'
import { LeadCard } from '@/components/pipeline/LeadCard'

interface PipelineColumnProps {
  id: LeadStage
  label: string
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

/** Coluna do Kanban — alvo de drop para os cards de lead. */
export function PipelineColumn({ id, label, leads, onLeadClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex h-full w-[252px] shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</h3>
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold',
            leads.length > 0 ? 'bg-primary-dim text-primary-strong' : 'bg-surface-3 text-faint',
          )}
        >
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 overflow-y-auto rounded-xl border p-2 transition-colors',
          isOver
            ? 'border-primary/50 bg-primary-dim/40'
            : 'border-line/70 bg-surface/60',
        )}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
        ))}
        {leads.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-faint">
            {isOver ? 'Solte aqui' : 'Sem leads nesta etapa'}
          </div>
        )}
      </div>
    </div>
  )
}
