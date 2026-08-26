import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SearchX, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { SimpleSelect } from '@/components/ui/select'
import { CompanyScore } from '@/components/companies/CompanyScore'
import { LEAD_STAGES, stageLabel } from '@/services/leadService'
import { formatRelative } from '@/lib/utils'
import { useLeadStore, leadsForOrg } from '@/store/useLeadStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'

/** Lista de leads da organização ativa. */
export function LeadsListPage() {
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const leads = leadsForOrg(useLeadStore((s) => s.leads), orgId)
  const companies = useCompanyStore((s) => s.companies)

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('todos')

  const rows = useMemo(() => {
    return leads
      .map((lead) => ({ lead, company: companies.find((c) => c.id === lead.companyId) }))
      .filter((r) => r.company)
      .filter((r) => stageFilter === 'todos' || r.lead.stage === stageFilter)
      .filter((r) => {
        const q = search.trim().toLowerCase()
        return !q || r.company!.nomeFantasia.toLowerCase().includes(q)
      })
      .sort((a, b) => b.lead.score.total - a.lead.score.total)
  }, [leads, companies, search, stageFilter])

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Leads</h1>
        <p className="mt-1 text-sm text-muted">Empresas convertidas em oportunidade comercial.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por empresa..." className="pl-9" aria-label="Buscar leads" />
        </div>
        <SimpleSelect
          aria-label="Filtrar por estágio"
          value={stageFilter}
          onChange={setStageFilter}
          options={[{ value: 'todos', label: 'Todos os estágios' }, ...LEAD_STAGES.map((s) => ({ value: s.id, label: s.label }))]}
          className="h-9"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={leads.length === 0 ? Users : SearchX}
          title={leads.length === 0 ? 'Nenhum lead ainda' : 'Nenhum lead encontrado'}
          description={leads.length === 0 ? 'Converta empresas em leads na tela Empresas para começar.' : 'Ajuste a busca ou os filtros.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-3 py-3 font-semibold">Score</th>
                <th className="px-3 py-3 font-semibold">Estágio</th>
                <th className="px-3 py-3 font-semibold">Responsável</th>
                <th className="px-3 py-3 font-semibold">Próxima ação</th>
                <th className="px-3 py-3 font-semibold">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ lead, company }) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2"
                  onClick={() => navigate(`/app/leads/${lead.id}`)}
                >
                  <td className="px-4 py-2.5 font-medium text-ink">{company!.nomeFantasia}</td>
                  <td className="px-3 py-2.5"><CompanyScore score={lead.score.total} /></td>
                  <td className="px-3 py-2.5"><Badge variant="outline">{stageLabel(lead.stage)}</Badge></td>
                  <td className="px-3 py-2.5 text-muted">{lead.ownerName}</td>
                  <td className="px-3 py-2.5 text-muted">
                    {lead.nextAction ? formatRelative(lead.nextAction.dueAt) : <span className="text-warn-strong">Sem próxima ação</span>}
                  </td>
                  <td className="px-3 py-2.5 text-faint">{formatRelative(lead.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
