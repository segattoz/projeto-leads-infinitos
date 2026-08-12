import {
  Building2,
  Check,
  Crosshair,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
} from 'lucide-react'
import type { CompanyWithScore } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { Tooltip } from '@/components/ui/tooltip'
import { MiniMap } from '@/components/map/MiniMap'
import { formatAge, formatDataAbertura, formatPorte } from '@/services/companyService'
import { getSegment } from '@/data/segments'

interface CompanyDrawerProps {
  company: CompanyWithScore | null
  open: boolean
  onClose: () => void
  inPipeline: boolean
  onAddToPipeline: (company: CompanyWithScore) => void
  /** Justificativas adicionais dependentes do contexto (ex.: busca territorial). */
  contextReasons?: string[]
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-6 py-5">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-xs text-faint">{label}</dt>
      <dd className={cn('text-right text-xs text-ink', mono && 'font-mono text-muted')}>{value}</dd>
    </div>
  )
}

/** Drawer de detalhes da empresa — dossiê completo da oportunidade. */
export function CompanyDrawer({
  company,
  open,
  onClose,
  inPipeline,
  onAddToPipeline,
  contextReasons = [],
}: CompanyDrawerProps) {
  if (!company) return null

  const segment = getSegment(company.segmentSlug)
  const { score, level, reasons } = company.opportunity

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-lg"
      title={
        <div>
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-ink">{company.nomeFantasia}</h2>
            {company.isNew && (
              <Tooltip content="Empresa identificada na atualização mais recente da base.">
                <Badge variant="lime">Nova oportunidade</Badge>
              </Tooltip>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">Oportunidade comercial · {segment?.name}</p>
        </div>
      }
    >
      {/* Score em destaque */}
      <div className="flex items-center justify-between border-b border-line bg-surface-2/50 px-6 py-5">
        <div>
          <p className="font-mono text-4xl font-bold tabular-nums text-primary-strong">{score}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
            {level === 'ALTO' ? 'Alto potencial' : level === 'MEDIO' ? 'Potencial médio' : 'Potencial inicial'}
          </p>
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center" aria-hidden>
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-line-strong)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={score >= 75 ? 'var(--color-primary)' : score >= 55 ? 'var(--color-warn)' : 'var(--color-faint)'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 175.9} 175.9`}
            />
          </svg>
          <Crosshair className="absolute h-5 w-5 text-primary/70" />
        </div>
      </div>

      <Section title="Inteligência da oportunidade">
        <ul className="space-y-2">
          {[...reasons, ...contextReasons].map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-xs text-ink">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              {reason}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Informações cadastrais">
        <dl>
          <Row label="Razão social" value={company.razaoSocial} />
          <Row label="Nome fantasia" value={company.nomeFantasia} />
          <Row label="CNPJ" value={company.cnpj} mono />
          <Row
            label="Situação cadastral"
            value={
              <span className={company.situacao === 'ATIVA' ? 'text-primary-strong' : 'text-danger'}>
                {company.situacao === 'ATIVA' ? 'Ativa' : 'Inativa'}
              </span>
            }
          />
          <Row
            label="Data de abertura"
            value={`${formatDataAbertura(company.dataAbertura)} (${formatAge(company.dataAbertura)})`}
          />
          <Row label="Porte" value={formatPorte(company.porte)} />
          <Row label="Tipo" value={company.matrizFilial === 'MATRIZ' ? 'Matriz' : 'Filial'} />
        </dl>
      </Section>

      <Section title="Atividade">
        <dl>
          <Row label="CNAE principal" value={company.cnaePrincipal} mono />
          <Row label="Descrição" value={company.cnaeDescricao} />
          {company.cnaesSecundarios && company.cnaesSecundarios.length > 0 && (
            <Row label="CNAEs secundários" value={company.cnaesSecundarios.join(', ')} mono />
          )}
        </dl>
      </Section>

      <Section title="Localização">
        <dl className="mb-3">
          <Row
            label="Endereço"
            value={`${company.endereco.logradouro}, ${company.endereco.numero}`}
          />
          <Row label="Bairro" value={company.endereco.bairro} />
          <Row label="Cidade" value={`${company.endereco.cidade}/${company.endereco.uf}`} />
          <Row label="CEP" value={company.endereco.cep} mono />
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
                <Badge variant="primary">WhatsApp</Badge>
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
            <Building2 className="h-3.5 w-3.5" />
            Nenhum canal de contato identificado na base.
          </p>
        )}
      </Section>

      {/* CTA fixo */}
      <div className="sticky bottom-0 border-t border-line bg-surface p-4">
        {inPipeline ? (
          <Button variant="outline" size="lg" className="w-full" disabled>
            <Check className="h-4 w-4" /> Empresa já está no pipeline
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full tracking-wide"
            onClick={() => onAddToPipeline(company)}
          >
            <Plus className="h-4 w-4" /> ADICIONAR AO PIPELINE
          </Button>
        )}
      </div>
    </Drawer>
  )
}
