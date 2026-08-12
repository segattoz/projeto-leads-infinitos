import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Territory } from '@/types'
import { buildDemoTerritories } from '@/services/territoryService'

interface TerritoryState {
  territories: Territory[]
  addTerritory: (territory: Territory) => void
  toggleActive: (id: string) => void
  removeTerritory: (id: string) => void
  reset: () => void
}

export const useTerritoryStore = create<TerritoryState>()(
  persist(
    (set) => ({
      territories: buildDemoTerritories(),

      addTerritory: (territory) =>
        set((state) => ({ territories: [territory, ...state.territories] })),

      toggleActive: (id) =>
        set((state) => ({
          territories: state.territories.map((t) =>
            t.id === id ? { ...t, active: !t.active } : t,
          ),
        })),

      removeTerritory: (id) =>
        set((state) => ({
          territories: state.territories.filter((t) => t.id !== id),
        })),

      reset: () => set({ territories: buildDemoTerritories() }),
    }),
    { name: 'segattos-leads:territories', version: 1 },
  ),
)
