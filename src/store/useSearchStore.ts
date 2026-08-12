import { create } from 'zustand'
import type { ProspectingQuery, ProspectingResult } from '@/types'

/**
 * Estado da última busca territorial — mantido em memória durante a sessão
 * para que a navegação entre telas não descarte os resultados no mapa.
 */
interface SearchState {
  query: ProspectingQuery | null
  result: ProspectingResult | null
  setSearch: (query: ProspectingQuery, result: ProspectingResult) => void
  clear: () => void
}

export const useSearchStore = create<SearchState>()((set) => ({
  query: null,
  result: null,
  setSearch: (query, result) => set({ query, result }),
  clear: () => set({ query: null, result: null }),
}))
