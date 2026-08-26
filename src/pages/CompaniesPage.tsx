import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Globe, MessageCircle, Phone, Plus, Search, SearchX } from 'lucide-react'
import type { Company } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SimpleSelect } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Tooltip } from '@/components/ui/tooltip'
import { CompanyScore } from '@/components/companies/CompanyScore'
import { CompanyDrawer } from '@/components/companies/CompanyDrawer'
import { formatDataAbertura, companyPotentialScore, isRecentlyDiscovered } from '@/services/companyService'
import { useCompanyStore, companiesForOrg } from '@/store/useCompanyStore'
import { useIcpStore, icpsForOrg } from '@/store/useIcpStore'
import { useLeadStore, leadsForOrg } from '@/store/useLeadStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'
import { logAudit } from '@/store/useAuditStore'

const PAGE_SIZE = 10

/** Empresas — base de empresas descobertas pelo Radar (não é lead automaticamente). */
export function CompaniesPage() {
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const companies = companiesForOrg(useCompanyStore((s) => s.companies), orgId)
  const updateStatus = useCompanyStore((s) => s.updateStatus)
  const icps = icpsForOrg(useIcpStore((s) => s.icps), orgId)
  const leads = leadsForOrg(useLeadStore((s) => s.leads), orgId)
  const convertCompany = useLeadStore((s) => s.convertCompany)
  const sources = useCompanyStore((s) => s.sources)

  const [search, setSearch] = useState('')
  const [icpFilter, setIcpFilter] = useState('todos')
  const [situacaoFilter, setSituacaoFilter] = useState('ATIVA')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerCompany, setDrawerCompany] = useState<Company | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const leadByCompanyId = useMemo(() => new Map(leads.map((l) => [l.companyId, l])), [leads])
  const scored = useMemo(
    () => companies.map((c) => ({ company: c, score: companyPotentialScore(c, icps) })),
    [companies, icps],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scored.filter(({ company }) => {
      if (q && !company.nomeFantasia.toLowerCase().includes(q) && !company.cnpj.includes(q)) return false
      if (icpFilter !== 'todos' && company.icpId !== icpFilter) return false
      if (situacaoFilter !== 'todas' && company.situacao !== situacaoFilter) return false
      if (statusFilter !== 'todos' && company.status !== statusFilter) return false
      return true
    })
  }, [scored, search, icpFilter, situacaoFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.company.id))

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pageRows.forEach((r) => next.delete(r.company.id))
      else pageRows.forEach((r) => next.add(r.company.id))
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

  const handleConvert = (company: Company) => {
    const lead = convertCompany(company, 'Você')
    if (lead) {
      toast.success(`${company.nomeFantasia} convertida em lead.`, {
        action: { label: 'Ver lead', onClick: () => navigate(`/app/leads/${lead.id}`) },
      })
    } else {
      toast.info(`${company.nomeFantasia} já é um lead.`)
    }
    setDrawerOpen(false)
  }

  const handleConvertSelected = () => {
    let converted = 0
    selectedIds.forEach((id) => {
      const company = companies.find((c) => c.id === id)
      if (company && convertCompany(company, 'Você')) converted++
    })
    setSelectedIds(new Set())
    if (converted > 0) {
      toast.success(`${converted} ${converted === 1 ? 'empresa convertida' : 'empresas convertidas'} em lead.`, {
        action: { label: 'Ver leads', onClick: () => navigate('/app/leads') },
      })
    } else {
      toast.info('As empresas selecionadas já são leads.')
    }
  }

  const handleDiscard = (company: Company) => {
    updateStatus(company.id, 'descartada')
    logAudit(orgId, 'company', company.id, 'company_discarded', 'Empresa descartada', 'Você')
    toast.success(`${company.nomeFantasia} descartada.`)
    setDrawerOpen(false)
  }

  const handleBlock = (company: Company) => {
    updateStatus(company.id, 'bloqueada')
    logAudit(orgId, 'company', company.id, 'company_blocked', 'Empresa bloqueada', 'Você')
    toast.success(`${company.nomeFantasia} bloqueada.`)
    setDrawerOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Empresas</h1>
          <p className="mt-1 text-sm text-muted">Base de empresas descobertas pelo Radar.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button variant="primary" onClick={handleConvertSelected} className="animate-fade-in">
            <Plus className="h-4 w-4" /> Converter {selectedIds.size} em lead
          </Button>
        )}
      </div>

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
          aria-label="Filtrar por ICP"
          value={icpFilter}
          onChange={(v) => {
            setIcpFilter(v)
            setPage(0)
          }}
          options={[{ value: 'todos', label: 'Todos os ICPs' }, ...icps.map((i) => ({ value: i.id, label: i.name }))]}
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
          aria-label="Filtrar por status"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v)
            setPage(0)
          }}
          options={[
            { value: 'todos', label: 'Todos os status' },
            { value: 'descoberta', label: 'Descoberta' },
            { value: 'convertida', label: 'Convertida' },
            { value: 'descartada', label: 'Descartada' },
            { value: 'bloqueada', label: 'Bloqueada' },
          ]}
          className="h-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        {pageRows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhuma empresa encontrada"
            description="Ajuste a busca ou os filtros, ou execute o Radar para descobrir novas empresas."
            className="border-0"
          />
        ) : (
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={allPageSelected} onChange={toggleAll} aria-label="Selecionar página" />
                </th>
                <th className="px-3 py-3 font-semibold">Empresa</th>
                <th className="px-3 py-3 font-semibold">Cidade</th>
                <th className="px-3 py-3 font-semibold">Score potencial</th>
                <th className="px-3 py-3 font-semibold">Abertura</th>
                <th className="px-3 py-3 font-semibold">Situação</th>
                <th className="px-3 py-3 font-semibold">Contato</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ company, score }) => {
                const lead = leadByCompanyId.get(company.id)
                const isNew = isRecentlyDiscovered(company)
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
                        {isNew && (
                          <Tooltip content="Empresa identificada na atualização mais recente do Radar.">
                            <Badge variant="success">Nova</Badge>
                          </Tooltip>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-faint">{company.cnpj}</p>
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {company.endereco.cidade}/{company.endereco.uf}
                    </td>
                    <td className="px-3 py-2.5">{score ? <CompanyScore score={score.total} /> : <span className="text-faint">—</span>}</td>
                    <td className="px-3 py-2.5 font-mono text-muted">{formatDataAbertura(company.dataAbertura)}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn('font-medium', company.situacao === 'ATIVA' ? 'text-success-strong' : 'text-danger')}>
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
                      {lead ? <Badge variant="primary">Lead</Badge> : <Badge variant="outline">{company.status}</Badge>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted">
          <p>
            {filtered.length} {filtered.length === 1 ? 'empresa' : 'empresas'} · página {currentPage + 1} de {pageCount}
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>
              Próxima <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <CompanyDrawer
        company={drawerCompany}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        icps={icps}
        sources={sources}
        isLead={drawerCompany ? leadByCompanyId.has(drawerCompany.id) : false}
        onConvertToLead={handleConvert}
        onDiscard={handleDiscard}
        onBlock={handleBlock}
      />
    </div>
  )
}
