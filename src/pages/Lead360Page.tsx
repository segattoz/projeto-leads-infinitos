import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Globe,
  History,
  Mail,
  MessageCircle,
  MessageSquarePlus,
  MoveRight,
  Paperclip,
  Phone,
  PhoneCall,
  Plus,
  ShieldCheck,
  User,
} from 'lucide-react'
import type { ActivityType, LeadStage, LossReason } from '@/types'
import { LOSS_REASON_LABELS, ACTIVITY_TYPE_LABELS } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input, Textarea } from '@/components/ui/input'
import { SimpleSelect } from '@/components/ui/select'
import { CompanyScore } from '@/components/companies/CompanyScore'
import { ScoreBreakdown } from '@/components/companies/ScoreBreakdown'
import { LEAD_STAGES, stageLabel } from '@/services/leadService'
import { formatAge, formatDataAbertura, formatPorte } from '@/services/companyService'
import { formatDateTime, cn } from '@/lib/utils'
import { useLeadStore, activitiesForLead } from '@/store/useLeadStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useIcpStore } from '@/store/useIcpStore'
import { useAuditStore, auditForEntity } from '@/store/useAuditStore'
import { membersOf } from '@/data/organizations'

const TABS = ['Visão geral', 'Contato', 'Score', 'Atividades', 'Qualificação', 'Oportunidades', 'Arquivos', 'Auditoria'] as const
type Tab = (typeof TABS)[number]

const ACTIVITY_ICONS: Record<ActivityType, typeof Plus> = {
  call: PhoneCall,
  whatsapp: MessageCircle,
  email: Mail,
  meeting: CalendarClock,
  note: MessageSquarePlus,
  linkedin: User,
  qualification: ShieldCheck,
  proposal: FileText,
  custom: MoveRight,
}

export function Lead360Page() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Visão geral')
  const [noteDraft, setNoteDraft] = useState('')
  const [pendingStage, setPendingStage] = useState<LeadStage | null>(null)
  const [lossReason, setLossReason] = useState<LossReason>('sem_orcamento')
  const [lostCompetitor, setLostCompetitor] = useState('')
  const [wonAmount, setWonAmount] = useState('')
  const [wonProduct, setWonProduct] = useState('')
  const [nextChannel, setNextChannel] = useState<ActivityType>('call')
  const [nextDate, setNextDate] = useState('')

  const lead = useLeadStore((s) => s.leads.find((l) => l.id === id))
  const moveStage = useLeadStore((s) => s.moveStage)
  const addActivity = useLeadStore((s) => s.addActivity)
  const updateNotes = useLeadStore((s) => s.updateNotes)
  const setNextAction = useLeadStore((s) => s.setNextAction)
  const changeOwner = useLeadStore((s) => s.changeOwner)
  const allActivities = useLeadStore((s) => s.activities)
  const activities = activitiesForLead(allActivities, id ?? '')
  const company = useCompanyStore((s) => s.companies.find((c) => c.id === lead?.companyId))
  const icp = useIcpStore((s) => s.icps.find((i) => i.id === lead?.icpId))
  const allAuditEvents = useAuditStore((s) => s.events)
  const auditEvents = auditForEntity(allAuditEvents, 'lead', id ?? '')

  if (!lead || !company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState icon={User} title="Lead não encontrado" description="Este lead não existe ou foi removido." />
      </div>
    )
  }

  const members = membersOf(lead.organizationId)
  const timeline = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const handleStageSelect = (value: string) => {
    const stage = value as LeadStage
    if (stage === 'ganho' || stage === 'perdido') {
      setPendingStage(stage)
    } else {
      moveStage(lead.id, stage)
      toast.success(`Lead movido para "${stageLabel(stage)}".`)
    }
  }

  const confirmPendingStage = () => {
    if (pendingStage === 'ganho') {
      const amount = Number(wonAmount)
      if (!amount) {
        toast.error('Informe o valor do fechamento.')
        return
      }
      moveStage(lead.id, 'ganho', { wonAmount: amount, wonProduct })
      toast.success('Lead marcado como ganho!')
    } else if (pendingStage === 'perdido') {
      moveStage(lead.id, 'perdido', { lostReason: lossReason, lostCompetitor: lostCompetitor || undefined })
      toast.success('Lead marcado como perdido.')
    }
    setPendingStage(null)
    setWonAmount('')
    setWonProduct('')
    setLostCompetitor('')
  }

  const handleSaveNote = () => {
    if (!noteDraft.trim()) return
    updateNotes(lead.id, noteDraft.trim())
    setNoteDraft('')
    toast.success('Observação registrada.')
  }

  const handleRegisterActivity = (type: ActivityType) => {
    addActivity(lead.id, type, { result: 'Registrado manualmente' })
    toast.success(`${ACTIVITY_TYPE_LABELS[type]} registrado(a).`)
  }

  const handleSetNextAction = () => {
    if (!nextDate) {
      toast.error('Escolha uma data para a próxima ação.')
      return
    }
    setNextAction(lead.id, { channel: nextChannel, dueAt: new Date(nextDate).toISOString() })
    toast.success('Próxima ação definida.')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/leads')}>
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Leads
      </Button>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold text-ink">{company.nomeFantasia}</h1>
              <Badge variant="outline">{stageLabel(lead.stage)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{company.cnaeDescricao} · {icp?.name}</p>
            <div className="mt-3">
              <CompanyScore score={lead.score.total} size="lg" />
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:w-64 sm:shrink-0">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-faint" htmlFor="lead-stage">Status</label>
              <SimpleSelect
                aria-label="Status do lead"
                value={lead.stage}
                onChange={handleStageSelect}
                options={LEAD_STAGES.map((s) => ({ value: s.id, label: s.label }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-faint" htmlFor="lead-owner">Responsável</label>
              <SimpleSelect
                aria-label="Responsável"
                value={lead.ownerName}
                onChange={(v) => changeOwner(lead.id, v)}
                options={members.map((m) => ({ value: m.name, label: m.name }))}
                className="w-full"
              />
            </div>
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Próxima ação</p>
              {lead.nextAction ? (
                <p className="mt-0.5 text-xs text-ink">
                  {ACTIVITY_TYPE_LABELS[lead.nextAction.channel]} — {formatDateTime(lead.nextAction.dueAt)}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-faint">Nenhuma definida</p>
              )}
            </div>
          </div>
        </div>

        {pendingStage && (
          <div className="mt-4 rounded-lg border border-line bg-surface-2 p-4 animate-fade-in">
            {pendingStage === 'ganho' ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-ink">Confirmar fechamento</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Valor (R$)" type="number" value={wonAmount} onChange={(e) => setWonAmount(e.target.value)} />
                  <Input placeholder="Produto/serviço" value={wonProduct} onChange={(e) => setWonProduct(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={confirmPendingStage}>Confirmar ganho</Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingStage(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-ink">Motivo da perda</p>
                <SimpleSelect
                  aria-label="Motivo da perda"
                  value={lossReason}
                  onChange={(v) => setLossReason(v as LossReason)}
                  options={Object.entries(LOSS_REASON_LABELS).map(([value, label]) => ({ value, label }))}
                  className="w-full"
                />
                {lossReason === 'concorrente' && (
                  <Input placeholder="Nome do concorrente" value={lostCompetitor} onChange={(e) => setLostCompetitor(e.target.value)} />
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" onClick={confirmPendingStage}>Confirmar perda</Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingStage(null)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-t-lg px-3 py-2 text-xs font-medium transition-colors',
              tab === t ? 'border-b-2 border-primary text-primary-strong' : 'text-muted hover:text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Visão geral' && (
        <Card className="p-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {[
              ['Razão social', company.razaoSocial],
              ['CNPJ', company.cnpj],
              ['CNAE principal', `${company.cnaePrincipal} — ${company.cnaeDescricao}`],
              ['Porte', formatPorte(company.porte)],
              ['Situação', company.situacao === 'ATIVA' ? 'Ativa' : 'Inativa'],
              ['Aberta há', formatAge(company.dataAbertura)],
              ['Data de abertura', formatDataAbertura(company.dataAbertura)],
              ['Endereço', `${company.endereco.logradouro}, ${company.endereco.numero} — ${company.endereco.bairro}`],
              ['Cidade', `${company.endereco.cidade}/${company.endereco.uf}`],
              ['ICP', icp?.name ?? '—'],
              ['Tags', company.tags.length > 0 ? company.tags.join(', ') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-line/60 py-2 text-xs sm:justify-start sm:gap-3">
                <dt className="text-faint">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {tab === 'Contato' && (
        <Card className="p-5">
          {company.telefone || company.whatsapp || company.email || company.website ? (
            <ul className="space-y-3">
              {company.telefone && (
                <li className="flex items-center gap-2.5 text-sm text-ink"><Phone className="h-4 w-4 text-primary" /> <span className="font-mono">{company.telefone}</span></li>
              )}
              {company.whatsapp && (
                <li className="flex items-center gap-2.5 text-sm text-ink"><MessageCircle className="h-4 w-4 text-primary" /> <span className="font-mono">{company.whatsapp}</span> <Badge variant="primary">WhatsApp</Badge></li>
              )}
              {company.email && (
                <li className="flex items-center gap-2.5 text-sm text-ink"><Mail className="h-4 w-4 text-primary" /> <span className="font-mono">{company.email}</span></li>
              )}
              {company.website && (
                <li className="flex items-center gap-2.5 text-sm text-ink"><Globe className="h-4 w-4 text-primary" /> <span className="font-mono">{company.website.replace('https://', '')}</span></li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-muted">Nenhum canal de contato identificado.</p>
          )}
        </Card>
      )}

      {tab === 'Score' && (
        <Card className="p-5">
          <ScoreBreakdown score={lead.score} />
        </Card>
      )}

      {tab === 'Atividades' && (
        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold text-ink">Registrar atividade</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[])
                .filter((t) => t !== 'note')
                .map((type) => (
                  <Button key={type} size="sm" variant="outline" onClick={() => handleRegisterActivity(type)}>
                    {ACTIVITY_TYPE_LABELS[type]}
                  </Button>
                ))}
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold text-ink">Próxima ação</p>
              <div className="flex flex-wrap items-end gap-2">
                <SimpleSelect
                  aria-label="Canal da próxima ação"
                  value={nextChannel}
                  onChange={(v) => setNextChannel(v as ActivityType)}
                  options={(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => ({ value: t, label: ACTIVITY_TYPE_LABELS[t] }))}
                />
                <Input type="datetime-local" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="w-auto" />
                <Button size="sm" variant="primary" onClick={handleSetNextAction}>Definir</Button>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold text-ink">Observações</p>
              {lead.notes && <p className="mb-2 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink">{lead.notes}</p>}
              <Textarea rows={2} placeholder="Adicionar observação..." value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              <Button size="sm" variant="secondary" className="mt-2" onClick={handleSaveNote} disabled={!noteDraft.trim()}>
                <MessageSquarePlus className="h-3.5 w-3.5" /> Salvar
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Histórico</p>
            {timeline.length === 0 ? (
              <p className="text-xs text-muted">Nenhuma atividade registrada ainda.</p>
            ) : (
              <ol className="relative space-y-3 border-l border-line pl-4">
                {timeline.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type]
                  return (
                    <li key={activity.id} className="relative">
                      <span className="absolute -left-[23px] flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line-strong bg-surface-3">
                        <Icon className="h-2 w-2 text-primary" />
                      </span>
                      <p className="font-mono text-[10px] text-faint">{formatDateTime(activity.createdAt)}</p>
                      <p className="text-xs text-ink">{ACTIVITY_TYPE_LABELS[activity.type]}{activity.note ? ` — ${activity.note}` : ''}</p>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </div>
      )}

      {tab === 'Qualificação' && (
        <EmptyState
          icon={ShieldCheck}
          title="Qualificação estruturada chega na próxima fase"
          description="Por enquanto, registre observações e o resultado da conversa na aba Atividades."
        />
      )}

      {tab === 'Oportunidades' && (
        <EmptyState
          icon={FileText}
          title="Este lead ainda não foi convertido em oportunidade formal"
          description="Em breve: funil com valor, probabilidade e forecast por oportunidade."
        />
      )}

      {tab === 'Arquivos' && (
        <EmptyState icon={Paperclip} title="Anexos chegam na próxima fase" description="Por enquanto, use observações para registrar links e informações." />
      )}

      {tab === 'Auditoria' && (
        <Card className="p-5">
          {auditEvents.length === 0 ? (
            <p className="text-xs text-muted">Nenhum evento registrado ainda.</p>
          ) : (
            <ol className="relative space-y-3 border-l border-line pl-4">
              {auditEvents.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[23px] flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line-strong bg-surface-3">
                    <History className="h-2 w-2 text-primary" />
                  </span>
                  <p className="font-mono text-[10px] text-faint">{formatDateTime(event.createdAt)} · {event.userName}</p>
                  <p className="text-xs text-ink">{event.description}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  )
}
