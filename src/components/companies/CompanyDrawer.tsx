import {
  Ban,
  Building2,
  Check,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Radar as RadarIcon,
  XCircle,
} from 'lucide-react'
import type { Company, CompanySource, Icp } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { Tooltip } from '@/components/ui/tooltip'
import { MiniMap } from '@/components/map/MiniMap'
import { ScoreBreakdown } from '@/components/companies/ScoreBreakdown'
import {
  formatAge,
  formatDataAbertura,
  formatPorte,
  isRecentlyDiscovered,
  companyPotentialScore,
} from '@/services/companyService'
import { formatDateTime } from '@/lib/utils'

interface CompanyDrawerProps {
  company: Company | null
  open: boolean
  onClose: () => void
  icps: Icp[]
  sources: CompanySource[]
  isLead: boolean
  onConvertToLead: (company: Company) => void
  onDiscard: (company: Company) => void
  onBlock: (company: Company) => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-6 py-5">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-xs text-faint">{label}</dt>
      <dd className={`text-right text-xs text-ink ${mono ? 'font-mono text-muted' : ''}`}>{value}</dd>
    </div>
  )
}

/** Drawer de detalhes da empresa — dossiê da tela Empresas. */
export function CompanyDrawer({
  company,
  open,
  onClose,
  icps,
  sources,
  isLead,
  onConvertToLead,
  onDiscard,
  onBlock,
}: CompanyDrawerProps) {
  if (!company) return null

  const icp = icps.find((i) => i.id === company.icpId)
  const score = companyPotentialScore(company, icps)
  const companySources = sources.filter((s) => s.companyId === company.id)
  const isNew = isRecentlyDiscovered(company)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-lg"
      title={
        <div>
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-ink">{company.nomeFantasia}</h2>
            {isNew && (
              <Tooltip content="Empresa identificada na atualização mais recente do Radar.">
                <Badge variant="success">Nova</Badge>
              </Tooltip>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {company.cnaeDescricao} {icp ? `· ${icp.name}` : ''}
          </p>
        </div>
      }
    >
      {score && (
        <div className="border-b border-line px-6 py-5">
          <ScoreBreakdown score={score} />
        </div>
      )}

      <Section title="Informações cadastrais">
        <dl>
          <Row label="Razão social" value={company.razaoSocial} />
          <Row label="CNPJ" value={company.cnpj} mono />
          <Row
            label="Situação cadastral"
            value={
              <span className={company.situacao === 'ATIVA' ? 'text-success-strong' : 'text-danger'}>
                {company.situacao === 'ATIVA' ? 'Ativa' : 'Inativa'}
              </span>
            }
          />
          <Row label="Data de abertura" value={`${formatDataAbertura(company.dataAbertura)} (${formatAge(company.dataAbertura)})`} />
          <Row label="Porte" value={formatPorte(company.porte)} />
          <Row label="Tipo" value={company.matrizFilial === 'MATRIZ' ? 'Matriz' : 'Filial'} />
          <Row label="CNAE principal" value={`${company.cnaePrincipal}`} mono />
        </dl>
      </Section>

      <Section title="Localização">
        <dl className="mb-3">
          <Row label="Endereço" value={`${company.endereco.logradouro}, ${company.endereco.numero}`} />
          <Row label="Bairro" value={company.endereco.bairro} />
          <Row label="Cidade" value={`${company.endereco.cidade}/${company.endereco.uf}`} />
        </dl>
        <MiniMap latitude={company.endereco.latitude} longitude={company.endereco.longitude} />
      </Section>

      <Section title="Contato">
        {company.telefone || company.whatsapp || company.website || company.email ? (
          <ul className="space-y-2.5">
            {company.telefone && (
              <li className="flex items-center gap-2.5 text-xs text-ink">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.telefone}</span>
              </li>
            )}
            {company.whatsapp && (
              <li className="flex items-center gap-2.5 text-xs text-ink">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.whatsapp}</span>
              </li>
            )}
            {company.email && (
              <li className="flex items-center gap-2.5 text-xs text-ink">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.email}</span>
              </li>
            )}
            {company.website && (
              <li className="flex items-center gap-2.5 text-xs text-ink">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.website.replace('https://', '')}</span>
              </li>
            )}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted">
            <Building2 className="h-3.5 w-3.5" /> Nenhum canal de contato identificado.
          </p>
        )}
      </Section>

      <Section title="Origens">
        {companySources.length === 0 ? (
          <p className="text-xs text-muted">Nenhuma origem registrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {companySources.map((source) => (
              <li key={source.id} className="flex items-center gap-2 text-xs text-ink">
                <RadarIcon className="h-3.5 w-3.5 text-primary" />
                {source.dataSourceName}
                <span className="text-faint">· {formatDateTime(source.foundAt)}</span>
              </li>
            ))}
          </ul>
        )}
        {company.possibleDuplicateOfCompanyId && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-warn-strong">
            <Ban className="h-3 w-3" /> Possível duplicata — revisar antes de prosseguir.
          </p>
        )}
      </Section>

      <div className="sticky bottom-0 space-y-2 border-t border-line bg-surface p-4">
        {isLead ? (
          <Button variant="outline" size="lg" className="w-full" disabled>
            <Check className="h-4 w-4" /> Já convertida em lead
          </Button>
        ) : (
          <Button variant="primary" size="lg" className="w-full" onClick={() => onConvertToLead(company)}>
            <Plus className="h-4 w-4" /> CONVERTER EM LEAD
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onDiscard(company)}>
            <XCircle className="h-3.5 w-3.5" /> Descartar
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onBlock(company)}>
            <Ban className="h-3.5 w-3.5" /> Bloquear
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
