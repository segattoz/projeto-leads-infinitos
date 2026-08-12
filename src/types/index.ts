// ─────────────────────────────────────────────────────────────────────────────
// Modelos de domínio do Segatto's Leads.
// A estrutura de Company espelha os campos dos Dados Abertos do CNPJ da
// Receita Federal, permitindo trocar a base local pela base oficial sem
// alterar a interface.
// ─────────────────────────────────────────────────────────────────────────────

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

export interface Company {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  cnaePrincipal: string
  cnaeDescricao: string
  cnaesSecundarios?: string[]
  situacao: 'ATIVA' | 'INATIVA'
  dataAbertura: string
  porte: 'MEI' | 'ME' | 'EPP' | 'DEMAIS'
  matrizFilial: 'MATRIZ' | 'FILIAL'
  telefone?: string
  whatsapp?: string
  email?: string
  website?: string
  endereco: CompanyAddress
  /** Data em que a empresa entrou na base monitorada (última atualização). */
  discoveredAt: string
  /** Slug do segmento ao qual a empresa pertence (derivado do CNAE). */
  segmentSlug: string
}

export interface Segment {
  id: string
  slug: string
  name: string
  description: string
  /** Um nicho comercial pode agrupar vários CNAEs oficiais. */
  cnaes: { code: string; description: string }[]
}

export interface OpportunityScore {
  score: number
  level: 'ALTO' | 'MEDIO' | 'BAIXO'
  reasons: string[]
}

export type LeadStatus =
  | 'novos'
  | 'contatados'
  | 'responderam'
  | 'reuniao'
  | 'proposta'
  | 'fechado'

export interface LeadActivity {
  id: string
  type: 'created' | 'note' | 'contact' | 'stage' | 'view'
  description: string
  createdAt: string
}

export interface Lead {
  id: string
  companyId: string
  status: LeadStatus
  score: number
  owner: string
  notes: string
  activities: LeadActivity[]
  createdAt: string
  updatedAt: string
}

export interface Territory {
  id: string
  name: string
  city: string
  state: string
  segmentSlug: string
  /** GeoJSON Polygon em [lng, lat] — mesmo formato usado pelo PostGIS. */
  geometry: GeoJSON.Polygon | null
  companiesCount: number
  newCompaniesCount: number
  active: boolean
  lastUpdatedAt: string
  createdAt: string
}

export type AreaMode = 'polygon' | 'radius'

export interface ProspectingQuery {
  segmentSlug: string
  city: string
  onlyActive: boolean
  areaMode: AreaMode
  polygon?: GeoJSON.Polygon
  center?: { latitude: number; longitude: number }
  radiusKm?: number
}

export interface ProspectingResult {
  companies: CompanyWithScore[]
  areaKm2: number | null
  searchedAt: string
}

export interface CompanyWithScore extends Company {
  opportunity: OpportunityScore
  /** Distância em km do centro da área pesquisada, quando aplicável. */
  distanceKm?: number
  /** Empresa identificada na atualização mais recente da base. */
  isNew: boolean
}
