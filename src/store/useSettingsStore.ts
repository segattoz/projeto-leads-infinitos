import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useTerritoryStore } from '@/store/useTerritoryStore'
import { useSearchStore } from '@/store/useSearchStore'

interface SettingsState {
  userName: string
  heatmapEnabled: boolean
  sidebarCollapsed: boolean
  skipSplash: boolean
  setHeatmapEnabled: (v: boolean) => void
  setSidebarCollapsed: (v: boolean) => void
  setSkipSplash: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      userName: 'Matheus',
      heatmapEnabled: false,
      sidebarCollapsed: false,
      skipSplash: false,
      setHeatmapEnabled: (v) => set({ heatmapEnabled: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setSkipSplash: (v) => set({ skipSplash: v }),
    }),
    { name: 'segattos-leads:settings', version: 1 },
  ),
)

/** Restaura todo o estado da POC para os dados de demonstração originais. */
export function restoreDemoData() {
  usePipelineStore.getState().reset()
  useTerritoryStore.getState().reset()
  useSearchStore.getState().clear()
  useSettingsStore.setState({ heatmapEnabled: false })
}
