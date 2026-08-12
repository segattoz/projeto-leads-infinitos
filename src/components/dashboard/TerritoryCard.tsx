import { MapPin, Sparkles } from 'lucide-react'
import type { Territory } from '@/types'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { getSegment } from '@/data/segments'

interface TerritoryCardProps {
  territory: Territory
  onClick?: () => void
  footer?: ReactNode
}

/** Card de território monitorado usado no dashboard e em Monitoramentos. */
export function TerritoryCard({ territory, onClick, footer }: TerritoryCardProps) {
  const segment = getSegment(territory.segmentSlug)

  return (
    <Card
      className={`p-5 transition-all ${onClick ? 'cursor-pointer hover:border-primary/40 hover:bg-surface-2' : ''} ${!territory.active ? 'opacity-60' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && e.key === 'Enter') onClick()
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">
            {segment?.name ?? territory.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
            <MapPin className="h-3 w-3" />
            {territory.city}/{territory.state}
          </p>
        </div>
        {!territory.active && (
          <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-faint">
            Pausado
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-2xl font-bold tabular-nums text-ink">
            {territory.companiesCount}
          </p>
          <p className="text-[11px] text-faint">empresas</p>
        </div>
        {territory.newCompaniesCount > 0 && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-primary-strong">
            <Sparkles className="h-3 w-3" />
            {territory.newCompaniesCount} novas oportunidades
          </p>
        )}
      </div>

      {footer}
    </Card>
  )
}
