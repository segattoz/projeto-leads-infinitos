import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ORGANIZATIONS } from '@/data/organizations'

/**
 * Organização ativa da sessão. Trocar de organização re-escopa toda a
 * aplicação: cada store de dado comercial filtra pelo `organizationId` atual.
 *
 * Nesta V0 não há autenticação real — o seletor de organização no Header
 * simula o multi-tenant para fins de demonstração e teste de isolamento.
 */
interface OrganizationState {
  activeOrganizationId: string
  setActiveOrganizationId: (id: string) => void
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      activeOrganizationId: ORGANIZATIONS[0].id,
      setActiveOrganizationId: (id) => set({ activeOrganizationId: id }),
    }),
    { name: 'i9radar:organization', version: 1 },
  ),
)
