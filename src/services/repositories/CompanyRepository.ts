import type { Company } from '@/types'
import seed from '@/data/companies.seed.json'

/**
 * Contrato de acesso a empresas.
 *
 * A POC usa `MockCompanyRepository` (base local derivada de uma fatia simulada
 * dos Dados Abertos do CNPJ). Em produção, um `SupabaseCompanyRepository`
 * implementará este mesmo contrato consultando PostgreSQL + PostGIS
 * (ST_Within / ST_Intersects / ST_DWithin) — sem nenhuma alteração nos
 * componentes de interface.
 */
export interface CompanyRepository {
  findAll(): Promise<Company[]>
  findById(id: string): Promise<Company | undefined>
  findByCnaes(cnaes: string[]): Promise<Company[]>
}

class MockCompanyRepository implements CompanyRepository {
  private companies: Company[]

  constructor() {
    // Reancora as datas de descoberta em relação a hoje, para que a
    // demonstração sempre exiba "identificadas recentemente" de forma coerente,
    // independentemente de quando a base seed foi gerada.
    const generatedAt = new Date(seed.generatedAt).getTime()
    const shift = Date.now() - generatedAt
    this.companies = (seed.companies as Company[]).map((c) => ({
      ...c,
      discoveredAt: new Date(new Date(c.discoveredAt).getTime() + shift).toISOString(),
    }))
  }

  async findAll(): Promise<Company[]> {
    return this.companies
  }

  async findById(id: string): Promise<Company | undefined> {
    return this.companies.find((c) => c.id === id)
  }

  async findByCnaes(cnaes: string[]): Promise<Company[]> {
    const set = new Set(cnaes)
    return this.companies.filter(
      (c) =>
        set.has(c.cnaePrincipal) ||
        (c.cnaesSecundarios ?? []).some((code) => set.has(code)),
    )
  }
}

const mockRepository = new MockCompanyRepository()
export const companyRepository: CompanyRepository = mockRepository

/**
 * Índice síncrono usado pelos componentes de pipeline para resolver
 * companyId → Company sem roundtrip. Ao migrar para Supabase, os leads
 * passarão a ser carregados com join no banco e este índice será removido.
 */
export const companiesById: ReadonlyMap<string, Company> = new Map(
  (mockRepository as unknown as { companies: Company[] }).companies.map((c) => [c.id, c]),
)
