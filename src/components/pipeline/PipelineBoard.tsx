import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Lead, LeadStatus } from '@/types'
import { PIPELINE_STAGES } from '@/services/pipelineService'
import { PipelineColumn } from '@/components/pipeline/PipelineColumn'
import { LeadCard } from '@/components/pipeline/LeadCard'

interface PipelineBoardProps {
  leads: Lead[]
  onMoveLead: (leadId: string, status: LeadStatus) => void
  onLeadClick: (lead: Lead) => void
}

// A coluna de destino é a que está sob o ponteiro — mais previsível para o
// usuário do que a interseção de retângulos quando o card cruza duas colunas.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args)
}

/** Kanban do pipeline comercial com drag & drop entre etapas. */
export function PipelineBoard({ leads, onMoveLead, onLeadClick }: PipelineBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLead(leads.find((l) => l.id === event.active.id) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      onMoveLead(String(active.id), over.id as LeadStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
    >
      <div className="flex h-full gap-3 overflow-x-auto px-6 pb-6">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            id={stage.id}
            label={stage.label}
            leads={leads.filter((l) => l.status === stage.id)}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {activeLead && <LeadCard lead={activeLead} onClick={() => {}} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
