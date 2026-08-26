import type { Company, RadarSourceResult } from '@/types'

/**
 * Motor de deduplicação de empresas.
 *
 * Prioridade determinística — nunca uma heurística caixa-preta:
 *   1. CNPJ igual                              → duplicata definitiva
 *   2. Domínio do site OU telefone iguais      → duplicata forte
 *   3. Endereço (cidade+bairro+logradouro) +
 *      similaridade de nome ≥ 0.8              → possível duplicata (revisão manual)
 *
 * Duplicatas definitivas/fortes são mescladas automaticamente (nova origem
 * registrada em `company_sources`, sem perder o registro já existente).
 * Possíveis duplicatas NUNCA são mescladas silenciosamente — ficam marcadas
 * para revisão humana na tela de Empresas.
 */

export type DuplicateConfidence = 'definite' | 'strong' | 'possible'

export interface DuplicateMatch {
  company: Company
  confidence: DuplicateConfidence
  reason: string
}

export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

export function normalizeDomain(website: string | undefined): string | null {
  if (!website) return null
  return website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim() || null
}

export function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  // Compara apenas os últimos 8-9 dígitos (número local), ignorando DDD/DDI
  // com formatação divergente entre fontes.
  return digits.length >= 8 ? digits.slice(-9) : null
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Coeficiente de Dice sobre bigramas — similaridade textual simples, sem dependências externas. */
export function diceCoefficient(a: string, b: string): number {
  const na = normalizeText(a)
  const nb = normalizeText(b)
  if (na === nb) return 1
  if (na.length < 2 || nb.length < 2) return na === nb ? 1 : 0

  const bigrams = (s: string) => {
    const set = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2)
      set.set(bg, (set.get(bg) ?? 0) + 1)
    }
    return set
  }

  const ba = bigrams(na)
  const bb = bigrams(nb)
  let intersection = 0
  for (const [bg, count] of ba) {
    const other = bb.get(bg)
    if (other) intersection += Math.min(count, other)
  }
  const totalA = [...ba.values()].reduce((s, v) => s + v, 0)
  const totalB = [...bb.values()].reduce((s, v) => s + v, 0)
  return (2 * intersection) / (totalA + totalB)
}

const NAME_SIMILARITY_THRESHOLD = 0.8

/** Procura uma duplicata do resultado do Radar entre as empresas já cadastradas na organização. */
export function findDuplicate(
  candidate: RadarSourceResult,
  existingCompanies: Company[],
): DuplicateMatch | null {
  const candidateCnpj = normalizeCnpj(candidate.cnpj)
  const cnpjMatch = existingCompanies.find((c) => normalizeCnpj(c.cnpj) === candidateCnpj)
  if (cnpjMatch) {
    return { company: cnpjMatch, confidence: 'definite', reason: 'CNPJ idêntico' }
  }

  const candidateDomain = normalizeDomain(candidate.website)
  if (candidateDomain) {
    const domainMatch = existingCompanies.find((c) => normalizeDomain(c.website) === candidateDomain)
    if (domainMatch) {
      return { company: domainMatch, confidence: 'strong', reason: `Mesmo domínio (${candidateDomain})` }
    }
  }

  const candidatePhone = normalizePhone(candidate.telefone) ?? normalizePhone(candidate.whatsapp)
  if (candidatePhone) {
    const phoneMatch = existingCompanies.find(
      (c) => normalizePhone(c.telefone) === candidatePhone || normalizePhone(c.whatsapp) === candidatePhone,
    )
    if (phoneMatch) {
      return { company: phoneMatch, confidence: 'strong', reason: 'Mesmo telefone' }
    }
  }

  const sameAddressCandidates = existingCompanies.filter(
    (c) =>
      normalizeText(c.endereco.cidade) === normalizeText(candidate.endereco.cidade) &&
      normalizeText(c.endereco.bairro) === normalizeText(candidate.endereco.bairro) &&
      normalizeText(c.endereco.logradouro) === normalizeText(candidate.endereco.logradouro),
  )
  for (const company of sameAddressCandidates) {
    const similarity = diceCoefficient(company.nomeFantasia, candidate.nomeFantasia)
    if (similarity >= NAME_SIMILARITY_THRESHOLD) {
      return {
        company,
        confidence: 'possible',
        reason: `Endereço igual e nome ${Math.round(similarity * 100)}% similar`,
      }
    }
  }

  return null
}
