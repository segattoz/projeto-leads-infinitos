import type { Company, IcpVersion, LeadScoreResult, ScoreGroupResult, ScoreWeights } from '@/types'
import { SCORE_GROUP_LABELS } from '@/types'

/**
 * Motor de score explicável do i9 Radar.
 *
 * Heurística documentada (não é IA/caixa-preta): 6 grupos ponderados cujos
 * pesos vêm da versão do ICP usada no cálculo (`icpVersionId` fica gravado
 * no resultado, então o score sempre pode ser explicado retroativamente,
 * mesmo que o ICP mude depois). Cada grupo devolve valor/máximo/motivos —
 * nunca apenas um número.
 */

const NEW_COMPANY_WINDOW_DAYS = 7
const RECENTLY_OPENED_YEARS = 1

function isRecentlyDiscovered(company: Company, now = new Date()): boolean {
  const diffDays = (now.getTime() - new Date(company.discoveredAt).getTime()) / 86_400_000
  return diffDays <= NEW_COMPANY_WINDOW_DAYS
}

function companyAgeYears(company: Company, now = new Date()): number {
  return (now.getTime() - new Date(company.dataAbertura).getTime()) / (365.25 * 86_400_000)
}

function clamp01(fraction: number): number {
  return Math.max(0, Math.min(1, fraction))
}

function group(
  key: keyof ScoreWeights,
  fraction: number,
  weights: ScoreWeights,
  reasons: string[],
): ScoreGroupResult {
  const max = weights[key]
  return {
    key,
    label: SCORE_GROUP_LABELS[key],
    value: Math.round(clamp01(fraction) * max),
    max,
    reasons,
  }
}

function scoreIcpFit(company: Company, icpVersion: IcpVersion): ScoreGroupResult {
  const reasons: string[] = []
  let fraction = 0

  const cnaeCodes = new Set(icpVersion.cnaes.map((c) => c.code))
  if (cnaeCodes.size === 0 || cnaeCodes.has(company.cnaePrincipal)) {
    fraction += 0.5
    if (cnaeCodes.has(company.cnaePrincipal)) reasons.push('CNAE principal compatível com o ICP')
  } else if (company.cnaesSecundarios?.some((c) => cnaeCodes.has(c))) {
    fraction += 0.3
    reasons.push('CNAE secundário compatível com o ICP')
  }

  if (icpVersion.portes.length === 0 || icpVersion.portes.includes(company.porte)) {
    fraction += 0.2
    reasons.push('Porte dentro do perfil definido')
  }

  reasons.push('Está dentro do território configurado no ICP')
  fraction += 0.2

  const haystack = `${company.razaoSocial} ${company.nomeFantasia} ${company.cnaeDescricao}`.toLowerCase()
  const keywordHit = icpVersion.keywords.find((k) => haystack.includes(k.toLowerCase()))
  if (keywordHit) {
    fraction += 0.1
    reasons.push(`Palavra-chave "${keywordHit}" encontrada`)
  }

  const negativeHit = icpVersion.negativeCriteria.find((k) => haystack.includes(k.toLowerCase()))
  if (negativeHit) {
    fraction -= 0.4
    reasons.push(`Critério negativo "${negativeHit}" identificado`)
  }

  return group('icpFit', fraction, icpVersion.weights, reasons)
}

function scoreCommercialPotential(company: Company, icpVersion: IcpVersion): ScoreGroupResult {
  const reasons: string[] = []
  let fraction = 0.2

  switch (company.porte) {
    case 'DEMAIS':
    case 'EPP':
      fraction += 0.35
      reasons.push('Porte com maior capacidade de contratação')
      break
    case 'ME':
      fraction += 0.2
      break
    case 'MEI':
      fraction += 0.05
      break
  }

  if (company.matrizFilial === 'MATRIZ') {
    fraction += 0.15
    reasons.push('Empresa matriz')
  }

  if (company.cnaesSecundarios && company.cnaesSecundarios.length > 0) {
    fraction += 0.15
    reasons.push('Atua em mais de uma frente (CNAEs secundários)')
  }

  const years = companyAgeYears(company)
  if (years >= 3) {
    fraction += 0.15
    reasons.push('Negócio estabelecido há mais de 3 anos')
  }

  return group('commercialPotential', fraction, icpVersion.weights, reasons)
}

function scoreDigitalMaturity(company: Company, icpVersion: IcpVersion): ScoreGroupResult {
  const reasons: string[] = []
  let fraction = 0
  if (company.website) {
    fraction += 0.6
    reasons.push('Possui site próprio')
  }
  if (company.email) {
    fraction += 0.4
    reasons.push('Possui e-mail de contato')
  }
  if (fraction === 0) reasons.push('Nenhum sinal de presença digital identificado')
  return group('digitalMaturity', fraction, icpVersion.weights, reasons)
}

function scoreApparentNeed(company: Company, icpVersion: IcpVersion): ScoreGroupResult {
  const reasons: string[] = []
  const years = companyAgeYears(company)
  let fraction: number

  if (years < RECENTLY_OPENED_YEARS) {
    fraction = 0.75
    reasons.push('Empresa em fase de estruturação inicial')
  } else if (!company.website && !company.email) {
    fraction = 0.55
    reasons.push('Baixa maturidade digital sugere oportunidade de modernização')
  } else {
    fraction = 0.3
    reasons.push('Nenhum sinal forte de necessidade imediata identificado')
  }

  return group('apparentNeed', fraction, icpVersion.weights, reasons)
}

function scoreContactAccessibility(company: Company, icpVersion: IcpVersion): ScoreGroupResult {
  const reasons: string[] = []
  let fraction = 0
  if (company.telefone) {
    fraction += 0.45
    reasons.push('Telefone disponível')
  }
  if (company.whatsapp) {
    fraction += 0.35
    reasons.push('WhatsApp disponível')
  }
  if (company.endereco.cep) {
    fraction += 0.2
    reasons.push('Endereço completo cadastrado')
  }
  if (fraction === 0) reasons.push('Nenhum canal de contato identificado')
  return group('contactAccessibility', fraction, icpVersion.weights, reasons)
}

function scoreRecentSignals(
  company: Company,
  icpVersion: IcpVersion,
  sourcesCount: number,
): ScoreGroupResult {
  const reasons: string[] = []
  let fraction = 0
  if (isRecentlyDiscovered(company)) {
    fraction += 0.6
    reasons.push('Identificada na atualização mais recente do Radar')
  }
  if (companyAgeYears(company) < RECENTLY_OPENED_YEARS) {
    fraction += 0.2
    reasons.push('Empresa recém-aberta')
  }
  if (sourcesCount > 1) {
    fraction += 0.2
    reasons.push(`Confirmada por ${sourcesCount} fontes diferentes`)
  }
  if (fraction === 0) reasons.push('Sem sinais recentes relevantes')
  return group('recentSignals', fraction, icpVersion.weights, reasons)
}

export function calculateLeadScore(
  company: Company,
  icpVersion: IcpVersion,
  opts: { sourcesCount?: number } = {},
): LeadScoreResult {
  const groups: ScoreGroupResult[] = [
    scoreIcpFit(company, icpVersion),
    scoreCommercialPotential(company, icpVersion),
    scoreDigitalMaturity(company, icpVersion),
    scoreApparentNeed(company, icpVersion),
    scoreContactAccessibility(company, icpVersion),
    scoreRecentSignals(company, icpVersion, opts.sourcesCount ?? 1),
  ]

  const total = Math.max(0, Math.min(100, groups.reduce((sum, g) => sum + g.value, 0)))
  const level: LeadScoreResult['level'] = total >= 80 ? 'ALTO' : total >= 60 ? 'MEDIO' : 'BAIXO'

  return {
    id: `score-${company.id}-${Date.now()}`,
    icpVersionId: icpVersion.id,
    total,
    level,
    groups,
    calculatedAt: new Date().toISOString(),
  }
}
