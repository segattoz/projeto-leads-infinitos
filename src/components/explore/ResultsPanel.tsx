import { useMemo, useState } from 'react'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import type { CompanyWithScore } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SimpleSelect } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { CompanyCard } from '@/components/companies/CompanyCard'
import { sortResults, type SortOption } from '@/services/prospectingService'

interface ResultsPanelProps {
  companies: CompanyWithScore[]
  pipelineCompanyIds: Set<string>
  selectedCompanyId: string | null
  onViewDetails: (company: CompanyWithScore) => void
  onAddToPipeline: (company: CompanyWithScore) => void
  onClose: () => void
}

/** Painel lateral com os resultados da busca territorial. */
export function ResultsPanel({
  companies,
  pipelineCompanyIds,
  selectedCompanyId,
  onViewDetails,
  onAddToPipeline,
  onClose,
}: ResultsPanelProps) {
  const [sortBy, setSortBy] = useState<SortOption>('score')
  const [showFilters, setShowFilters] = useState(false)
  const [minScore, setMinScore] = useState('0')
  const [porte, setPorte] = useState('todos')
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)
  const [onlyDigital, setOnlyDigital] = useState(false)

  const filtered = useMemo(() => {
    let list = companies
    const min = Number(minScore)
    if (min > 0) list = list.filter((c) => c.opportunity.score >= min)
    if (porte !== 'todos') list = list.filter((c) => c.porte === porte)
    if (onlyWithPhone) list = list.filter((c) => c.telefone || c.whatsapp)
    if (onlyDigital) list = list.filter((c) => c.website)
    return sortResults(list, sortBy)
  }, [companies, sortBy, minScore, porte, onlyWithPhone, onlyDigital])

  return (
    <div className="flex h-full w-[372px] shrink-0 flex-col border-l border-line bg-surface animate-[results-in_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      <style>{`@keyframes results-in { from { transform: translateX(30px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>

      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-bold text-ink">
            <span className="font-mono text-primary-strong">{companies.length}</span>{' '}
            {companies.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}
          </p>
          <p className="text-[11px] text-muted">nesta região</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar resultados">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <label className="text-[11px] text-faint" htmlFor="ordenar">
          Ordenar por
        </label>
        <SimpleSelect
          aria-label="Ordenar por"
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={[
            { value: 'score', label: 'Maior potencial' },
            { value: 'recent', label: 'Mais recentes' },
            { value: 'nearest', label: 'Mais próximas' },
            { value: 'oldest', label: 'Mais antigas' },
          ]}
          className="flex-1"
        />
        <Button
          variant={showFilters ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
        </Button>
      </div>

      {showFilters && (
        <div className="space-y-3 border-b border-line bg-surface-2/50 px-4 py-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] text-faint">Score mínimo</label>
              <SimpleSelect
                aria-label="Score mínimo"
                value={minScore}
                onChange={setMinScore}
                options={[
                  { value: '0', label: 'Todos' },
                  { value: '55', label: '55+' },
                  { value: '75', label: '75+ (alto)' },
                  { value: '85', label: '85+' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-faint">Porte</label>
              <SimpleSelect
                aria-label="Porte"
                value={porte}
                onChange={setPorte}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'MEI', label: 'MEI' },
                  { value: 'ME', label: 'ME' },
                  { value: 'EPP', label: 'EPP' },
                  { value: 'DEMAIS', label: 'Demais' },
                ]}
                className="w-full"
              />
            </div>
          </div>
          <Checkbox
            checked={onlyWithPhone}
            onChange={setOnlyWithPhone}
            label="Telefone disponível"
            className="text-xs"
          />
          <Checkbox
            checked={onlyDigital}
            onChange={setOnlyDigital}
            label="Presença digital"
            className="text-xs"
          />
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          companies.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nenhuma empresa encontrada nesta região"
              description="Amplie sua área ou escolha outro segmento."
              className={cn('border-0')}
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Nenhuma empresa com estes filtros"
              description="Ajuste os filtros acima para ampliar os resultados."
              className={cn('border-0')}
            />
          )
        ) : (
          filtered.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              selected={company.id === selectedCompanyId}
              inPipeline={pipelineCompanyIds.has(company.id)}
              onViewDetails={onViewDetails}
              onAddToPipeline={onAddToPipeline}
            />
          ))
        )}
      </div>
    </div>
  )
}
