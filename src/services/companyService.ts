import type { Company, Icp, LeadScoreResult, Porte, RadarSourceResult } from '@/types'
import { calculateLeadScore } from '@/services/scoreService'
import { getCurrentVersion } from '@/services/icpService'

let seq = 1
function nextCompanyId(organizationId: string): string {
  return `company-${organizationId}-${Date.now()}-${seq++}`
}

export function poolItemToCompany(item: RadarSourceResult, organizationId: string, icpId?: string): Company {
  return {
    id: nextCompanyId(organizationId),
    organizationId,
    cnpj: item.cnpj,
    razaoSocial: item.razaoSocial,
    nomeFantasia: item.nomeFantasia,
    cnaePrincipal: item.cnaePrincipal,
    cnaeDescricao: item.cnaeDescricao,
    cnaesSecundarios: item.cnaesSecundarios,
    situacao: item.situacao,
    dataAbertura: item.dataAbertura,
    porte: item.porte,
    matrizFilial: item.matrizFilial,
    telefone: item.telefone,
    whatsapp: item.whatsapp,
    email: item.email,
    website: item.website,
    endereco: item.endereco,
    status: 'descoberta',
    discoveredAt: item.discoveredAt,
    icpId,
    tags: [],
  }
}

export function formatDataAbertura(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatAge(iso: string): string {
  const years = (Date.now() - new Date(iso).getTime()) / (365.25 * 86_400_000)
  if (years < 1) {
    const months = Math.max(1, Math.floor(years * 12))
    return `${months} ${months === 1 ? 'mês' : 'meses'}`
  }
  const full = Math.floor(years)
  return `${full} ${full === 1 ? 'ano' : 'anos'}`
}

export function formatPorte(porte: Porte): string {
  switch (porte) {
    case 'MEI':
      return 'Microempreendedor (MEI)'
    case 'ME':
      return 'Microempresa (ME)'
    case 'EPP':
      return 'Pequeno porte (EPP)'
    case 'DEMAIS':
      return 'Médio/grande porte'
  }
}

const NEW_COMPANY_WINDOW_DAYS = 7
export function isRecentlyDiscovered(company: Company, now = new Date()): boolean {
  const diffDays = (now.getTime() - new Date(company.discoveredAt).getTime()) / 86_400_000
  return diffDays <= NEW_COMPANY_WINDOW_DAYS
}

/**
 * Score potencial exibido na tela Empresas — calculado sob demanda com o
 * mesmo motor usado em Lead 360, contra a versão atual do ICP vinculado
 * (quando existe). Não é persistido no registro da empresa: o score
 * definitivo só é fixado (snapshot) no momento da conversão em lead.
 */
export function companyPotentialScore(company: Company, icps: Icp[]): LeadScoreResult | null {
  const icp = icps.find((i) => i.id === company.icpId)
  if (!icp) return null
  return calculateLeadScore(company, getCurrentVersion(icp))
}
