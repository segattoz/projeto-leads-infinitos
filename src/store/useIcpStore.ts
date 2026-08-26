import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Icp } from '@/types'
import { buildDemoIcps } from '@/data/icps.demo'
import { createIcp, publishNewVersion, type IcpVersionInput } from '@/services/icpService'
import { logAudit } from '@/store/useAuditStore'

interface IcpState {
  icps: Icp[]
  createIcp: (
    organizationId: string,
    input: { name: string; description: string; productService: string } & Partial<IcpVersionInput>,
  ) => Icp
  updateIcpMeta: (id: string, changes: { name?: string; description?: string; productService?: string; status?: Icp['status'] }) => void
  publishVersion: (id: string, changes: Partial<IcpVersionInput>) => Icp | null
  removeIcp: (id: string) => void
  reset: () => void
}

export const useIcpStore = create<IcpState>()(
  persist(
    (set, get) => ({
      icps: buildDemoIcps(),

      createIcp: (organizationId, input) => {
        const icp = createIcp(organizationId, input)
        set((state) => ({ icps: [icp, ...state.icps] }))
        logAudit(organizationId, 'icp', icp.id, 'icp_created', `ICP "${icp.name}" criado`, 'Você')
        return icp
      },

      updateIcpMeta: (id, changes) =>
        set((state) => ({
          icps: state.icps.map((icp) =>
            icp.id === id ? { ...icp, ...changes, updatedAt: new Date().toISOString() } : icp,
          ),
        })),

      publishVersion: (id, changes) => {
        const icp = get().icps.find((i) => i.id === id)
        if (!icp) return null
        const updated = publishNewVersion(icp, changes)
        set((state) => ({ icps: state.icps.map((i) => (i.id === id ? updated : i)) }))
        const newVersion = updated.versions[updated.versions.length - 1]
        logAudit(
          icp.organizationId,
          'icp',
          icp.id,
          'icp_version_published',
          `Nova versão v${newVersion.version} publicada para "${icp.name}"`,
          'Você',
        )
        return updated
      },

      removeIcp: (id) => set((state) => ({ icps: state.icps.filter((i) => i.id !== id) })),

      reset: () => set({ icps: buildDemoIcps() }),
    }),
    { name: 'i9radar:icps', version: 1 },
  ),
)

export function icpsForOrg(icps: Icp[], organizationId: string): Icp[] {
  return icps.filter((icp) => icp.organizationId === organizationId)
}
