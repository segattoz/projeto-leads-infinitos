import type { Company, CompanyWithScore } from '@/types'
import { companyRepository } from '@/services/repositories/CompanyRepository'
import {
  calculateOpportunityScore,
  isRecentlyDiscovered,
} from '@/services/opportunityScoreService'

/** Consultas de empresas usadas fora do fluxo de prospecção (tabelas, drawers). */

export async function getAllCompaniesWithScore(): Promise<CompanyWithScore[]> {
  const companies = await companyRepository.findAll()
  return companies.map(withScore)
}

export async function getCompanyById(id: string): Promise<CompanyWithScore | undefined> {
  const company = await companyRepository.findById(id)
  return company ? withScore(company) : undefined
}

export function withScore(company: Company): CompanyWithScore {
  return {
    ...company,
    opportunity: calculateOpportunityScore(company),
    isNew: isRecentlyDiscovered(company),
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

export function formatPorte(porte: Company['porte']): string {
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
