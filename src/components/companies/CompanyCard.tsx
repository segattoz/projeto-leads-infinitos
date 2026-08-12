import { memo } from 'react'
import { Check, Eye, MapPin, Plus } from 'lucide-react'
import type { CompanyWithScore } from '@/types'
import { cn, formatKm } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { CompanyScore } from '@/components/companies/CompanyScore'
import { CompanyBadges } from '@/components/companies/CompanyBadges'
import { formatAge } from '@/services/companyService'
import { getSegment } from '@/data/segments'

interface CompanyCardProps {
  company: CompanyWithScore
  selected?: boolean
  inPipeline?: boolean
  onViewDetails: (company: CompanyWithScore) => void
  onAddToPipeline: (company: CompanyWithScore) => void
}

export const CompanyCard = memo(function CompanyCard({
  company,
  selected,
  inPipeline,
  onViewDetails,
  onAddToPipeline,
}: CompanyCardProps) {
  const segment = getSegment(company.segmentSlug)

  return (
    <article
      className={cn(
        'group rounded-xl border bg-surface-2 p-4 transition-all hover:border-primary/40 hover:bg-surface-3',
        selected ? 'border-primary/60 ring-1 ring-primary/30' : 'border-line',
        company.isNew && 'border-lime/25',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-ink">
            {company.nomeFantasia}
          </h4>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-faint">
            {segment?.name ?? company.cnaeDescricao}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {company.isNew ? (
            <Tooltip content="Empresa identificada na atualização mais recente da base.">
              <Badge variant="lime">Nova empresa</Badge>
            </Tooltip>
          ) : company.opportunity.level === 'ALTO' ? (
            <Badge variant="primary">Alta oportunidade</Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <CompanyScore score={company.opportunity.score} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <div className="flex justify-between gap-2 border-b border-line/60 py-1">
          <dt className="text-faint">CNPJ</dt>
          <dd className="truncate font-mono text-muted">{company.cnpj}</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-line/60 py-1">
          <dt className="text-faint">Situação</dt>
          <dd className={company.situacao === 'ATIVA' ? 'text-primary-strong' : 'text-danger'}>
            {company.situacao === 'ATIVA' ? 'Ativa' : 'Inativa'}
          </dd>
        </div>
        <div className="flex justify-between gap-2 py-1">
          <dt className="text-faint">Aberta há</dt>
          <dd className="text-muted">{formatAge(company.dataAbertura)}</dd>
        </div>
        <div className="flex justify-between gap-2 py-1">
          <dt className="text-faint">
            <MapPin className="mr-0.5 inline h-2.5 w-2.5" />
            {company.endereco.bairro}
          </dt>
          <dd className="text-muted">
            {company.distanceKm !== undefined ? formatKm(company.distanceKm) : 'Uberlândia/MG'}
          </dd>
        </div>
      </dl>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <CompanyBadges company={company} />
        <div className="flex shrink-0 gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
          <Button size="sm" variant="ghost" onClick={() => onViewDetails(company)}>
            <Eye className="h-3.5 w-3.5" /> Detalhes
          </Button>
          {inPipeline ? (
            <Button size="sm" variant="outline" disabled>
              <Check className="h-3.5 w-3.5" /> No pipeline
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onAddToPipeline(company)}>
              <Plus className="h-3.5 w-3.5" /> Pipeline
            </Button>
          )}
        </div>
      </div>
    </article>
  )
})
