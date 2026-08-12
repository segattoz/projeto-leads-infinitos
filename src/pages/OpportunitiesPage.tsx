import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  MessageCircle,
  Phone,
  Plus,
  Search,
  SearchX,
} from 'lucide-react'
import type { CompanyWithScore } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SimpleSelect } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Tooltip } from '@/components/ui/tooltip'
import { CompanyScore } from '@/components/companies/CompanyScore'
import { CompanyDrawer } from '@/components/companies/CompanyDrawer'
import { getAllCompaniesWithScore, formatDataAbertura } from '@/services/companyService'
import { stageLabel } from '@/services/pipelineService'
import { SEGMENTS, getSegment } from '@/data/segments'
import { usePipelineStore } from '@/store/usePipelineStore'

const PAGE_SIZE = 10

/** Oportunidades — visão em tabela de toda a base monitorada. */
export function OpportunitiesPage() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<CompanyWithScore[] | null>(null)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('todos')
  const [situacaoFilter, setSituacaoFilter] = useState('ATIVA')
  const [scoreFilter, setScoreFilter] = useState('0')
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerCompany, setDrawerCompany] = useState<CompanyWithScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const leads = usePipelineStore((s) => s.leads)
  const addCompany = usePipelineStore((s) => s.addCompany)
  const leadByCompanyId = useMemo(
    () => new Map(leads.map((l) => [l.companyId, l])),
    [leads],
  )

  useEffect(() => {
    let cancelled = false
    getAllCompaniesWithScore()
      .then((list) => {
        if (!cancelled) {
          setCompanies(list.sort((a, b) => b.opportunity.score - a.opportunity.score))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompanies([])
          toast.error('Não foi possível carregar as oportunidades.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!companies) return []
    const q = search.trim().toLowerCase()
    return companies.filter((c) => {
      if (q && !c.nomeFantasia.toLowerCase().includes(q) && !c.cnpj.includes(q)) return false
      if (segmentFilter !== 'todos' && c.segmentSlug !== segmentFilter) return false
      if (situacaoFilter !== 'todas' && c.situacao !== situacaoFilter) return false
      if (Number(scoreFilter) > 0 && c.opportunity.score < Number(scoreFilter)) return false
      return true
    })
  }, [companies, search, segmentFilter, situacaoFilter, scoreFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const allPageSelected = pageRows.length > 0 && pageRows.every((c) => selectedIds.has(c.id))

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pageRows.forEach((c) => next.delete(c.id))
      else pageRows.forEach((c) => next.add(c.id))
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddSelected = () => {
    if (!companies) return
    let added = 0
    selectedIds.forEach((id) => {
      const company = companies.find((c) => c.id === id)
      if (company && addCompany(company)) added++
    })
    setSelectedIds(new Set())
    if (added > 0) {
      toast.success(
        `${added} ${added === 1 ? 'empresa adicionada' : 'empresas adicionadas'} ao Pipeline.`,
        { action: { label: 'Ver pipeline', onClick: () => navigate('/app/pipeline') } },
      )
    } else {
      toast.info('As empresas selecionadas já estão no pipeline.')
    }
  }

  const handleAddSingle = (company: CompanyWithScore) => {
    const lead = addCompany(company)
    if (lead) {
      toast.success(`${company.nomeFantasia} adicionada ao Pipeline.`, {
        action: { label: 'Ver pipeline', onClick: () => navigate('/app/pipeline') },
      })
    } else {
      toast.info(`${company.nomeFantasia} já está no pipeline.`)
    }
    setDrawerOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Oportunidades</h1>
          <p className="mt-1 text-sm text-muted">
            Todas as empresas identificadas nos seus territórios.
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button variant="primary" onClick={handleAddSelected} className="animate-fade-in">
            <Plus className="h-4 w-4" />
            Adicionar {selectedIds.size} ao Pipeline
          </Button>
        )}
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="Buscar por nome ou CNPJ..."
            className="pl-9"
            aria-label="Buscar empresas"
          />
        </div>
        <SimpleSelect
          aria-label="Filtrar por segmento"
          value={segmentFilter}
          onChange={(v) => {
            setSegmentFilter(v)
            setPage(0)
          }}
          options={[
            { value: 'todos', label: 'Todos os segmentos' },
            ...SEGMENTS.map((s) => ({ value: s.slug, label: s.name })),
          ]}
          className="h-9"
        />
        <SimpleSelect
          aria-label="Filtrar por situação"
          value={situacaoFilter}
          onChange={(v) => {
            setSituacaoFilter(v)
            setPage(0)
          }}
          options={[
            { value: 'ATIVA', label: 'Somente ativas' },
            { value: 'INATIVA', label: 'Somente inativas' },
            { value: 'todas', label: 'Todas as situações' },
          ]}
          className="h-9"
        />
        <SimpleSelect
          aria-label="Filtrar por score"
          value={scoreFilter}
          onChange={(v) => {
            setScoreFilter(v)
            setPage(0)
          }}
          options={[
            { value: '0', label: 'Score: todos' },
            { value: '55', label: 'Score 55+' },
            { value: '75', label: 'Score 75+' },
            { value: '85', label: 'Score 85+' },
          ]}
          className="h-9"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        {companies === null ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhuma empresa encontrada"
            description="Ajuste a busca ou os filtros para ampliar os resultados."
            className="border-0"
          />
        ) : (
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={allPageSelected} onChange={toggleAll} aria-label="Selecionar página" />
                </th>
                <th className="px-3 py-3 font-semibold">Empresa</th>
                <th className="px-3 py-3 font-semibold">Segmento</th>
                <th className="px-3 py-3 font-semibold">Cidade</th>
                <th className="px-3 py-3 font-semibold">Score</th>
                <th className="px-3 py-3 font-semibold">Abertura</th>
                <th className="px-3 py-3 font-semibold">Situação</th>
                <th className="px-3 py-3 font-semibold">Contato</th>
                <th className="px-3 py-3 font-semibold">Status comercial</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((company) => {
                const lead = leadByCompanyId.get(company.id)
                return (
                  <tr
                    key={company.id}
                    className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2"
                    onClick={() => {
                      setDrawerCompany(company)
                      setDrawerOpen(true)
                    }}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(company.id)}
                        onChange={() => toggleOne(company.id)}
                        aria-label={`Selecionar ${company.nomeFantasia}`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{company.nomeFantasia}</span>
                        {company.isNew && (
                          <Tooltip content="Empresa identificada na atualização mais recente da base.">
                            <Badge variant="lime">Nova</Badge>
                          </Tooltip>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-faint">{company.cnpj}</p>
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {getSegment(company.segmentSlug)?.name}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {company.endereco.cidade}/{company.endereco.uf}
                    </td>
                    <td className="px-3 py-2.5">
                      <CompanyScore score={company.opportunity.score} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted">
                      {formatDataAbertura(company.dataAbertura)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'font-medium',
                          company.situacao === 'ATIVA' ? 'text-primary-strong' : 'text-danger',
                        )}
                      >
                        {company.situacao === 'ATIVA' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5 text-faint">
                        {company.telefone && <Phone className="h-3.5 w-3.5 text-muted" />}
                        {company.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-muted" />}
                        {company.website && <Globe className="h-3.5 w-3.5 text-muted" />}
                        {!company.telefone && !company.whatsapp && !company.website && '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {lead ? (
                        <Badge variant="primary">{stageLabel(lead.status)}</Badge>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {companies !== null && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted">
          <p>
            {filtered.length} {filtered.length === 1 ? 'empresa' : 'empresas'} · página{' '}
            {currentPage + 1} de {pageCount}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              Próxima <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <CompanyDrawer
        company={drawerCompany}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        inPipeline={drawerCompany ? leadByCompanyId.has(drawerCompany.id) : false}
        onAddToPipeline={handleAddSingle}
      />
    </div>
  )
}
