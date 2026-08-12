import type { Company, OpportunityScore } from '@/types'

/**
 * Serviço de score de oportunidade.
 *
 * Heurística demonstrativa (não é IA): parte de uma base de 40 pontos e soma
 * sinais objetivos de qualificação comercial extraíveis dos dados cadastrais.
 * O score máximo é 100. Cada ponto somado gera uma justificativa legível,
 * exibida na interface como "Inteligência da oportunidade".
 */

const NEW_COMPANY_WINDOW_DAYS = 7

export function isRecentlyDiscovered(company: Company, now = new Date()): boolean {
  const discovered = new Date(company.discoveredAt)
  const diffDays = (now.getTime() - discovered.getTime()) / 86_400_000
  return diffDays <= NEW_COMPANY_WINDOW_DAYS
}

export function companyAgeYears(company: Company, now = new Date()): number {
  const opened = new Date(company.dataAbertura)
  return (now.getTime() - opened.getTime()) / (365.25 * 86_400_000)
}

export function calculateOpportunityScore(company: Company): OpportunityScore {
  let score = 40
  const reasons: string[] = []

  if (company.situacao === 'ATIVA') {
    const years = Math.floor(companyAgeYears(company))
    if (years >= 5) {
      score += 8
      reasons.push(`Empresa ativa há ${years} anos`)
    } else if (years >= 2) {
      score += 5
      reasons.push(`Empresa ativa há ${years} anos`)
    } else {
      score += 2
      reasons.push('Empresa em início de operação')
    }
  } else {
    score -= 25
    reasons.push('Situação cadastral inativa')
  }

  if (company.telefone) {
    score += 12
    reasons.push('Telefone disponível')
  }
  if (company.whatsapp) {
    score += 8
    reasons.push('WhatsApp disponível')
  }
  if (company.website) {
    score += 10
    reasons.push('Possui presença digital')
  }
  if (company.email) {
    score += 4
    reasons.push('E-mail de contato disponível')
  }

  switch (company.porte) {
    case 'EPP':
    case 'DEMAIS':
      score += 6
      reasons.push('Porte com maior potencial de contratação')
      break
    case 'ME':
      score += 4
      break
    case 'MEI':
      score += 2
      break
  }

  if (isRecentlyDiscovered(company)) {
    score += 10
    reasons.push('Identificada na atualização mais recente da base')
  }

  // Cadastro completo facilita a abordagem comercial.
  if (company.telefone && (company.whatsapp || company.email) && company.endereco.cep) {
    score += 4
    reasons.push('Dados cadastrais completos')
  }

  score = Math.max(0, Math.min(100, score))

  const level: OpportunityScore['level'] =
    score >= 75 ? 'ALTO' : score >= 55 ? 'MEDIO' : 'BAIXO'

  return { score, level, reasons }
}
