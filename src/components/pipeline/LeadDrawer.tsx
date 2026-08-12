import { useState } from 'react'
import {
  CalendarClock,
  Eye,
  Globe,
  Mail,
  MessageCircle,
  MessageSquarePlus,
  MoveRight,
  Phone,
  PhoneCall,
  Plus,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Lead, LeadActivity } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { Textarea } from '@/components/ui/input'
import { SimpleSelect } from '@/components/ui/select'
import { CompanyScore } from '@/components/companies/CompanyScore'
import { companiesById } from '@/services/repositories/CompanyRepository'
import { PIPELINE_STAGES, stageLabel } from '@/services/pipelineService'
import { usePipelineStore } from '@/store/usePipelineStore'
import { getSegment } from '@/data/segments'

interface LeadDrawerProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
}

const ACTIVITY_ICONS: Record<LeadActivity['type'], typeof Plus> = {
  created: Plus,
  note: MessageSquarePlus,
  contact: PhoneCall,
  stage: MoveRight,
  view: Eye,
}

/** Drawer de detalhes do lead no pipeline: status, contato, observações e timeline. */
export function LeadDrawer({ lead: leadProp, open, onClose }: LeadDrawerProps) {
  const leads = usePipelineStore((s) => s.leads)
  const moveLead = usePipelineStore((s) => s.moveLead)
  const addNote = usePipelineStore((s) => s.addNote)
  const registerContact = usePipelineStore((s) => s.registerContact)

  const [noteDraft, setNoteDraft] = useState('')

  // Sempre renderiza a versão mais recente do lead a partir do store.
  const lead = leadProp ? (leads.find((l) => l.id === leadProp.id) ?? leadProp) : null
  if (!lead) return null

  const company = companiesById.get(lead.companyId)
  if (!company) return null
  const segment = getSegment(company.segmentSlug)

  const timeline = [...lead.activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const handleSaveNote = () => {
    if (!noteDraft.trim()) return
    addNote(lead.id, noteDraft.trim())
    setNoteDraft('')
    toast.success('Observação registrada.')
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-md"
      title={
        <div>
          <h2 className="truncate text-base font-bold text-ink">{company.nomeFantasia}</h2>
          <p className="mt-0.5 text-xs text-muted">{segment?.name} · Uberlândia/MG</p>
        </div>
      }
    >
      <div className="space-y-5 px-6 py-5">
        {/* Score + status */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 p-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
              Score
            </p>
            <CompanyScore score={lead.score} size="lg" />
          </div>
          <div className="min-w-0">
            <label
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-faint"
              htmlFor="lead-status"
            >
              Status
            </label>
            <SimpleSelect
              aria-label="Status do lead"
              value={lead.status}
              onChange={(v) => {
                moveLead(lead.id, v as Lead['status'])
                toast.success(`Lead movido para "${stageLabel(v as Lead['status'])}".`)
              }}
              options={PIPELINE_STAGES.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
        </div>

        {/* Contato */}
        <section>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
            Contato
          </h3>
          <ul className="space-y-2 text-xs text-ink">
            {company.telefone && (
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.telefone}</span>
              </li>
            )}
            {company.whatsapp && (
              <li className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.whatsapp}</span>
                <Badge variant="primary">WhatsApp</Badge>
              </li>
            )}
            {company.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.email}</span>
              </li>
            )}
            {company.website && (
              <li className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono">{company.website.replace('https://', '')}</span>
              </li>
            )}
            {!company.telefone && !company.whatsapp && !company.email && !company.website && (
              <li className="text-muted">Nenhum canal de contato identificado.</li>
            )}
          </ul>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-faint">
            <User className="h-3 w-3" /> Responsável: {lead.owner}
          </div>
        </section>

        {/* Observações */}
        <section>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
            Observações
          </h3>
          {lead.notes && (
            <p className="mb-2 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-relaxed text-ink">
              {lead.notes}
            </p>
          )}
          <Textarea
            rows={2}
            placeholder="Adicionar observação..."
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleSaveNote} disabled={!noteDraft.trim()}>
              <MessageSquarePlus className="h-3.5 w-3.5" /> Salvar observação
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                registerContact(lead.id, 'Contato realizado com a empresa')
                toast.success('Contato registrado no histórico.')
              }}
            >
              <PhoneCall className="h-3.5 w-3.5" /> Registrar contato
            </Button>
          </div>
        </section>

        {/* Histórico */}
        <section>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
            Histórico
          </h3>
          <ol className="relative space-y-3 border-l border-line pl-4">
            {timeline.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type] ?? CalendarClock
              return (
                <li key={activity.id} className="relative">
                  <span className="absolute -left-[23px] flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line-strong bg-surface-3">
                    <Icon className="h-2 w-2 text-primary" />
                  </span>
                  <p className="font-mono text-[10px] text-faint">
                    {formatDateTime(activity.createdAt)}
                  </p>
                  <p className="text-xs text-ink">{activity.description}</p>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </Drawer>
  )
}
