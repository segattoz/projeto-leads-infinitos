import type { Organization, OrgMember } from '@/types'

/**
 * Organizações de demonstração da V0. Nesta versão a separação entre
 * organizações é aplicada na camada de store/repositório (ver
 * src/services/repositories) — não há Postgres/RLS reais ainda (ver
 * docs/architecture.md, seção "Pendências").
 */
export const ORGANIZATIONS: Organization[] = [
  {
    id: 'org-a',
    name: 'Comercial Triângulo Ltda',
    plan: 'demo',
    city: 'Uberlândia',
    state: 'MG',
  },
  {
    id: 'org-b',
    name: 'Distribuidora Alfa Ltda',
    plan: 'demo',
    city: 'Ribeirão Preto',
    state: 'SP',
  },
]

export const ORG_MEMBERS: OrgMember[] = [
  { id: 'mem-a-01', organizationId: 'org-a', name: 'Matheus Segatto', email: 'matheus@comercialtriangulo.com.br', role: 'admin' },
  { id: 'mem-a-02', organizationId: 'org-a', name: 'Renata Alves', email: 'renata@comercialtriangulo.com.br', role: 'sdr' },
  { id: 'mem-a-03', organizationId: 'org-a', name: 'Bruno Costa', email: 'bruno@comercialtriangulo.com.br', role: 'closer' },
  { id: 'mem-b-01', organizationId: 'org-b', name: 'Camila Ferraz', email: 'camila@distribuidoraalfa.com.br', role: 'admin' },
  { id: 'mem-b-02', organizationId: 'org-b', name: 'Diego Nunes', email: 'diego@distribuidoraalfa.com.br', role: 'sdr' },
]

export function getOrganization(id: string): Organization | undefined {
  return ORGANIZATIONS.find((o) => o.id === id)
}

export function membersOf(organizationId: string): OrgMember[] {
  return ORG_MEMBERS.filter((m) => m.organizationId === organizationId)
}
