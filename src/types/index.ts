// ─────────────────────────────────────────────────────────────────────────────
// Modelos de domínio do i9 Radar.
//
// Toda entidade comercial carrega `organizationId` — a separação entre
// organizações é aplicada na camada de repositório/store (ver
// src/services/repositories) nesta V0 client-side. O schema Postgres
// equivalente (com RLS real) está documentado em supabase/migrations.
// ─────────────────────────────────────────────────────────────────────────────

// ── Organização / multiempresa ──────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  plan: 'demo' | 'starter' | 'pro'
  city: string
  state: string
}

export type Role = 'admin' | 'commercial_manager' | 'sdr' | 'closer' | 'viewer' | 'integration'

export interface OrgMember {
  id: string
  organizationId: string
  name: string
  email: string
  role: Role
}

// ── Compartilhado ───────────────────────────────────────────────────────────

export type Porte = 'MEI' | 'ME' | 'EPP' | 'DEMAIS'

export interface CompanyAddress {
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  latitude: number
  longitude: number
}

export type AreaMode = 'polygon' | 'radius'

/** Território geográfico — usado tanto pelo ICP quanto pelo wizard do Radar. */
export interface Territory {
  city: string
  state: string
  areaMode: AreaMode
  polygon?: GeoJSON.Polygon
  center?: { latitude: number; longitude: number }
  radiusKm?: number
}

/** Catálogo de segmentos comerciais — presets sugeridos, não obrigatórios. */
export interface SegmentPreset {
  id: string
  slug: string
  name: string
  description: string
  cnaes: { code: string; description: string }[]
}

// ── ICP — Ideal Customer Profile ────────────────────────────────────────────

export interface ScoreWeights {
  icpFit: number
  commercialPotential: number
  digitalMaturity: number
  apparentNeed: number
  contactAccessibility: number
  recentSignals: number
}

export const SCORE_GROUP_LABELS: Record<keyof ScoreWeights, string> = {
  icpFit: 'Compatibilidade com ICP',
  commercialPotential: 'Potencial comercial',
  digitalMaturity: 'Maturidade digital',
  apparentNeed: 'Necessidade aparente',
  contactAccessibility: 'Contato e acessibilidade',
  recentSignals: 'Sinais recentes',
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  icpFit: 30,
  commercialPotential: 20,
  digitalMaturity: 15,
  apparentNeed: 15,
  contactAccessibility: 10,
  recentSignals: 10,
}

/**
 * Versão imutável de um ICP. Todo score calculado referencia o id de uma
 * versão específica — alterar o ICP nunca invalida scores já calculados.
 */
export interface IcpVersion {
  id: string
  icpId: string
  version: number
  cnaes: { code: string; description: string }[]
  portes: Porte[]
  keywords: string[]
  positiveCriteria: string[]
  negativeCriteria: string[]
  territory: Territory | null
  weights: ScoreWeights
  createdAt: string
}

export interface Icp {
  id: string
  organizationId: string
  name: string
  description: string
  productService: string
  status: 'draft' | 'active' | 'archived'
  currentVersionId: string
  versions: IcpVersion[]
  createdAt: string
  updatedAt: string
}

// ── Radar ────────────────────────────────────────────────────────────────

export type DataSourceType = 'seed_database' | 'csv_import'

export interface DataSource {
  id: string
  organizationId: string | null // null = fonte global (ex.: base seed compartilhada)
  type: DataSourceType
  name: string
  description: string
}

export type RadarJobStatus =
  | 'draft'
  | 'running'
  | 'partial'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type RadarJobItemOutcome = 'new' | 'duplicate' | 'possible_duplicate' | 'error'

export interface RadarJobItem {
  id: string
  radarJobId: string
  companyId?: string
  rawName: string
  outcome: RadarJobItemOutcome
  detail: string
}

export interface RadarJobCounts {
  found: number
  new: number
  duplicates: number
  possibleDuplicates: number
  errors: number
}

export interface RadarJob {
  id: string
  organizationId: string
  icpId: string
  icpVersionId: string
  territory: Territory
  sourceId: string
  sourceName: string
  status: RadarJobStatus
  startedAt: string
  finishedAt?: string
  counts: RadarJobCounts
  items: RadarJobItem[]
  createdBy: string
  createdAt: string
}

/** Resultado bruto de uma fonte, antes de normalização/dedup/score. */
export interface RadarSourceResult {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  cnaePrincipal: string
  cnaeDescricao: string
  cnaesSecundarios?: string[]
  situacao: 'ATIVA' | 'INATIVA'
  dataAbertura: string
  porte: Porte
  matrizFilial: 'MATRIZ' | 'FILIAL'
  telefone?: string
  whatsapp?: string
  email?: string
  website?: string
  endereco: CompanyAddress
  discoveredAt: string
}

export interface RadarSearchParams {
  organizationId: string
  icpVersion: IcpVersion
  territory: Territory
  /** Usado apenas pelo adapter de importação. */
  csvText?: string
}

// ── Empresas ─────────────────────────────────────────────────────────────

export type CompanyStatus = 'descoberta' | 'revisada' | 'convertida' | 'descartada' | 'bloqueada'

/**
 * Empresa descoberta pelo Radar. Não é automaticamente um lead — vira lead
 * apenas quando explicitamente convertida (ver leadService.convertToLead).
 */
export interface Company {
  id: string
  organizationId: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  cnaePrincipal: string
  cnaeDescricao: string
  cnaesSecundarios?: string[]
  situacao: 'ATIVA' | 'INATIVA'
  dataAbertura: string
  porte: Porte
  matrizFilial: 'MATRIZ' | 'FILIAL'
  telefone?: string
  whatsapp?: string
  email?: string
  website?: string
  endereco: CompanyAddress
  status: CompanyStatus
  discoveredAt: string
  icpId?: string
  possibleDuplicateOfCompanyId?: string
  tags: string[]
}

/** Registro de que uma empresa foi encontrada por uma fonte/execução específica. */
export interface CompanySource {
  id: string
  companyId: string
  radarJobId?: string
  dataSourceId: string
  dataSourceName: string
  foundAt: string
}

// ── Score explicável ─────────────────────────────────────────────────────

export interface ScoreGroupResult {
  key: keyof ScoreWeights
  label: string
  value: number
  max: number
  reasons: string[]
}

export interface LeadScoreResult {
  id: string
  icpVersionId: string
  total: number
  level: 'ALTO' | 'MEDIO' | 'BAIXO'
  groups: ScoreGroupResult[]
  calculatedAt: string
}

// ── Leads / Funil ────────────────────────────────────────────────────────

export type LeadStage =
  | 'novo'
  | 'diagnostico'
  | 'reuniao'
  | 'proposta'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

export type LossReason =
  | 'sem_orcamento'
  | 'sem_necessidade'
  | 'concorrente'
  | 'timing'
  | 'sem_resposta'
  | 'outro'

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  sem_orcamento: 'Sem orçamento agora',
  sem_necessidade: 'Sem necessidade identificada',
  concorrente: 'Fechou com concorrente',
  timing: 'Timing incorreto',
  sem_resposta: 'Sem resposta / não engajou',
  outro: 'Outro motivo',
}

export type ActivityType =
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'meeting'
  | 'note'
  | 'linkedin'
  | 'qualification'
  | 'proposal'
  | 'custom'

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  meeting: 'Reunião',
  note: 'Observação',
  linkedin: 'LinkedIn',
  qualification: 'Qualificação',
  proposal: 'Proposta',
  custom: 'Outro',
}

export interface Activity {
  id: string
  organizationId: string
  leadId: string
  type: ActivityType
  userName: string
  result?: string
  note?: string
  createdAt: string
}

export interface NextAction {
  channel: ActivityType
  dueAt: string
  note?: string
}

export interface Lead {
  id: string
  organizationId: string
  companyId: string
  icpId: string
  icpVersionId: string
  stage: LeadStage
  ownerName: string
  score: LeadScoreResult
  nextAction?: NextAction
  notes: string
  wonAt?: string
  wonAmount?: number
  wonProduct?: string
  lostAt?: string
  lostReason?: LossReason
  lostCompetitor?: string
  recycleAt?: string
  createdAt: string
  updatedAt: string
}

// ── Auditoria ────────────────────────────────────────────────────────────

export type AuditAction =
  | 'company_discovered'
  | 'company_converted'
  | 'company_discarded'
  | 'company_blocked'
  | 'score_calculated'
  | 'stage_changed'
  | 'owner_changed'
  | 'lead_won'
  | 'lead_lost'
  | 'icp_created'
  | 'icp_version_published'
  | 'radar_job_started'
  | 'radar_job_completed'

export interface AuditEvent {
  id: string
  organizationId: string
  entityType: 'lead' | 'company' | 'icp' | 'radar_job'
  entityId: string
  action: AuditAction
  description: string
  userName: string
  createdAt: string
}
