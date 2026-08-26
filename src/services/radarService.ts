import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import distance from '@turf/distance'
import { point, polygon as turfPolygon } from '@turf/helpers'
import type {
  Company,
  DataSourceType,
  RadarJobItemOutcome,
  RadarSearchParams,
  RadarSourceResult,
  Territory,
} from '@/types'
import { restOfPool } from '@/services/repositories/CompanyPoolRepository'
import { findDuplicate } from '@/services/dedupeService'

/**
 * Contrato de fonte de dados do Radar. Trocar de fonte (ex.: um provedor
 * pago de Dados Abertos do CNPJ) significa implementar esta interface —
 * nada no restante do pipeline (normalização, dedup, score) muda.
 */
export interface RadarSourceAdapter {
  id: DataSourceType
  name: string
  search(params: RadarSearchParams): Promise<RadarSourceResult[]>
}

function matchesTerritory(result: RadarSourceResult, territory: Territory): boolean {
  const p = point([result.endereco.longitude, result.endereco.latitude])
  if (territory.areaMode === 'polygon' && territory.polygon) {
    return booleanPointInPolygon(p, turfPolygon(territory.polygon.coordinates))
  }
  if (territory.areaMode === 'radius' && territory.center && territory.radiusKm) {
    const center = point([territory.center.longitude, territory.center.latitude])
    return distance(center, p, { units: 'kilometers' }) <= territory.radiusKm
  }
  return true
}

function matchesCnaes(result: RadarSourceResult, cnaeCodes: string[]): boolean {
  if (cnaeCodes.length === 0) return true
  const set = new Set(cnaeCodes)
  return set.has(result.cnaePrincipal) || (result.cnaesSecundarios ?? []).some((c) => set.has(c))
}

/**
 * Fonte "base de dados monitorada" — consulta o pool de empresas ainda não
 * descobertas pela organização (simula uma fatia dos Dados Abertos do CNPJ)
 * e filtra por território + CNAEs do ICP.
 */
export const seedDatabaseAdapter: RadarSourceAdapter = {
  id: 'seed_database',
  name: 'Base de dados monitorada',
  async search(params) {
    const pool = restOfPool(params.organizationId)
    const cnaeCodes = params.icpVersion.cnaes.map((c) => c.code)
    return pool.filter(
      (item) => matchesCnaes(item, cnaeCodes) && matchesTerritory(item, params.territory),
    )
  },
}

/** Colunas aceitas pelo importador CSV (cabeçalho obrigatório, ordem livre). */
export const CSV_IMPORT_COLUMNS = [
  'razaoSocial', 'nomeFantasia', 'cnpj', 'cnaePrincipal', 'cnaeDescricao', 'situacao',
  'dataAbertura', 'porte', 'matrizFilial', 'telefone', 'whatsapp', 'email', 'website',
  'logradouro', 'numero', 'bairro', 'cidade', 'uf', 'cep', 'latitude', 'longitude',
] as const

interface CsvParseResult {
  results: RadarSourceResult[]
  errors: { line: number; reason: string }[]
}

function parseCsvLine(line: string): string[] {
  // Parser simples: aceita valores entre aspas com vírgula escapada.
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

export function parseCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const results: RadarSourceResult[] = []
  const errors: CsvParseResult['errors'] = []
  if (lines.length === 0) return { results, errors: [{ line: 0, reason: 'Arquivo vazio' }] }

  const header = parseCsvLine(lines[0]).map((h) => h.trim())
  const idx = (col: string) => header.indexOf(col)

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1
    const cells = parseCsvLine(lines[i])
    const get = (col: string) => {
      const j = idx(col)
      return j >= 0 ? cells[j]?.trim() : undefined
    }

    const cnpj = get('cnpj')
    const nomeFantasia = get('nomeFantasia') || get('razaoSocial')
    const lat = Number(get('latitude'))
    const lng = Number(get('longitude'))

    if (!cnpj || !nomeFantasia) {
      errors.push({ line: lineNumber, reason: 'CNPJ ou nome fantasia ausente' })
      continue
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push({ line: lineNumber, reason: 'Latitude/longitude inválidas' })
      continue
    }

    results.push({
      cnpj,
      razaoSocial: get('razaoSocial') || nomeFantasia,
      nomeFantasia,
      cnaePrincipal: get('cnaePrincipal') || '0000-0/00',
      cnaeDescricao: get('cnaeDescricao') || 'Não informado',
      situacao: get('situacao') === 'INATIVA' ? 'INATIVA' : 'ATIVA',
      dataAbertura: get('dataAbertura') || new Date().toISOString().slice(0, 10),
      porte: (['MEI', 'ME', 'EPP', 'DEMAIS'].includes(get('porte') ?? '') ? get('porte') : 'ME') as RadarSourceResult['porte'],
      matrizFilial: get('matrizFilial') === 'FILIAL' ? 'FILIAL' : 'MATRIZ',
      telefone: get('telefone') || undefined,
      whatsapp: get('whatsapp') || undefined,
      email: get('email') || undefined,
      website: get('website') || undefined,
      endereco: {
        logradouro: get('logradouro') || '',
        numero: get('numero') || '',
        bairro: get('bairro') || '',
        cidade: get('cidade') || '',
        uf: get('uf') || '',
        cep: get('cep') || '',
        latitude: lat,
        longitude: lng,
      },
      discoveredAt: new Date().toISOString(),
    })
  }

  return { results, errors }
}

export const csvImportAdapter: RadarSourceAdapter = {
  id: 'csv_import',
  name: 'Importação CSV',
  async search(params) {
    if (!params.csvText) return []
    return parseCsv(params.csvText).results
  },
}

export function getAdapter(type: DataSourceType): RadarSourceAdapter {
  return type === 'csv_import' ? csvImportAdapter : seedDatabaseAdapter
}

// ── Normalização + deduplicação ─────────────────────────────────────────────

export interface ProcessedItem {
  rawName: string
  outcome: RadarJobItemOutcome
  detail: string
  company: Company | null
  isNewCompany: boolean
}

function normalizeResult(result: RadarSourceResult): RadarSourceResult {
  return {
    ...result,
    cnpj: result.cnpj.trim(),
    razaoSocial: result.razaoSocial.trim(),
    nomeFantasia: result.nomeFantasia.trim() || result.razaoSocial.trim(),
    telefone: result.telefone?.trim() || undefined,
    whatsapp: result.whatsapp?.trim() || undefined,
    email: result.email?.trim().toLowerCase() || undefined,
    website: result.website?.trim() || undefined,
  }
}

/**
 * Normaliza e deduplica os resultados brutos contra as empresas já
 * cadastradas na organização (mais as já processadas neste mesmo job).
 * Nunca mescla "possíveis duplicatas" silenciosamente — apenas
 * CNPJ/domínio/telefone idênticos são considerados definitivos.
 */
export function normalizeAndDedupe(
  rawResults: RadarSourceResult[],
  existingCompanies: Company[],
  buildCompany: (result: RadarSourceResult) => Company,
): ProcessedItem[] {
  const knownCompanies = [...existingCompanies]
  const items: ProcessedItem[] = []

  for (const raw of rawResults) {
    const result = normalizeResult(raw)
    const match = findDuplicate(result, knownCompanies)

    if (match && match.confidence !== 'possible') {
      items.push({
        rawName: result.nomeFantasia,
        outcome: 'duplicate',
        detail: match.reason,
        company: match.company,
        isNewCompany: false,
      })
      continue
    }

    if (match && match.confidence === 'possible') {
      const company = buildCompany(result)
      company.possibleDuplicateOfCompanyId = match.company.id
      knownCompanies.push(company)
      items.push({
        rawName: result.nomeFantasia,
        outcome: 'possible_duplicate',
        detail: match.reason,
        company,
        isNewCompany: true,
      })
      continue
    }

    const company = buildCompany(result)
    knownCompanies.push(company)
    items.push({
      rawName: result.nomeFantasia,
      outcome: 'new',
      detail: 'Nenhuma correspondência encontrada — empresa nova',
      company,
      isNewCompany: true,
    })
  }

  return items
}
