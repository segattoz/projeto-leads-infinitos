import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useIcpStore } from '@/store/useIcpStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { useLeadStore } from '@/store/useLeadStore'
import { useRadarStore } from '@/store/useRadarStore'
import { useAuditStore } from '@/store/useAuditStore'

interface SettingsState {
  userName: string
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      userName: 'Você',
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    { name: 'i9radar:settings', version: 1 },
  ),
)

/** Restaura todo o estado da POC para os dados de demonstração originais. */
export function restoreDemoData() {
  useRadarStore.getState().reset()
  useIcpStore.getState().reset()
  useCompanyStore.getState().reset()
  useLeadStore.getState().reset()
  useAuditStore.getState().reset()
}
