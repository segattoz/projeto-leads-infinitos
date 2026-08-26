import { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical, MapPin, User } from 'lucide-react'
import type { Lead } from '@/types'
import { cn, formatRelative } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CompanyScore } from '@/components/companies/CompanyScore'
import { isRecentlyDiscovered } from '@/services/companyService'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useIcpStore } from '@/store/useIcpStore'

interface LeadCardProps {
  lead: Lead
  onClick: (lead: Lead) => void
  overlay?: boolean
}

/** Card de lead arrastável do Kanban. */
export const LeadCard = memo(function LeadCard({ lead, onClick, overlay }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    disabled: overlay,
  })

  const company = useCompanyStore((s) => s.companies.find((c) => c.id === lead.companyId))
  const icp = useIcpStore((s) => s.icps.find((i) => i.id === lead.icpId))
  if (!company) return null

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      className={cn(
        'group cursor-pointer rounded-lg border border-line bg-surface-2 p-3 transition-all',
        'hover:border-primary/40 hover:bg-surface-3',
        isDragging && 'opacity-30',
        overlay && 'rotate-2 border-primary/50 shadow-2xl shadow-black/10',
      )}
      onClick={() => onClick(lead)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick(lead)
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">{company.nomeFantasia}</p>
          <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-faint">{icp?.name}</p>
        </div>
        <button
          className="shrink-0 cursor-grab touch-none rounded p-1 text-faint opacity-60 transition-opacity hover:bg-surface hover:text-muted group-hover:opacity-100 active:cursor-grabbing"
          aria-label={`Arrastar ${company.nomeFantasia}`}
          onClick={(e) => e.stopPropagation()}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2">
        <CompanyScore score={lead.score.total} />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-faint">
        <span className="flex items-center gap-1">
          <MapPin className="h-2.5 w-2.5" />
          {company.endereco.cidade}/{company.endereco.uf}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-2.5 w-2.5" />
          {lead.ownerName.split(' ')[0]}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px]">
        <span className="text-faint">Última interação: {formatRelative(lead.updatedAt)}</span>
        {isRecentlyDiscovered(company) && <Badge variant="success">Nova</Badge>}
      </div>
    </div>
  )
})
