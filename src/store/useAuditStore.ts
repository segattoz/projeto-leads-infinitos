import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuditAction, AuditEvent } from '@/types'

let seq = 1
function nextId(): string {
  return `audit-${Date.now()}-${seq++}`
}

interface AuditState {
  events: AuditEvent[]
  log: (event: Omit<AuditEvent, 'id' | 'createdAt'>) => void
  reset: () => void
}

/**
 * Log de auditoria central. Alimenta a timeline do Lead 360 e (quando a
 * organização tiver uma tela de Configurações → Auditoria, fora do escopo
 * desta V0) poderá ser consultado por entidade ou por organização inteira.
 */
export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      events: [],
      log: (event) =>
        set((state) => ({
          events: [{ ...event, id: nextId(), createdAt: new Date().toISOString() }, ...state.events],
        })),
      reset: () => set({ events: [] }),
    }),
    { name: 'i9radar:audit', version: 1 },
  ),
)

/** Atalho para registrar um evento sem precisar de um componente React. */
export function logAudit(
  organizationId: string,
  entityType: AuditEvent['entityType'],
  entityId: string,
  action: AuditAction,
  description: string,
  userName: string,
) {
  useAuditStore.getState().log({ organizationId, entityType, entityId, action, description, userName })
}

export function auditForEntity(events: AuditEvent[], entityType: AuditEvent['entityType'], entityId: string): AuditEvent[] {
  return events.filter((e) => e.entityType === entityType && e.entityId === entityId)
}

export function auditForOrg(events: AuditEvent[], organizationId: string): AuditEvent[] {
  return events.filter((e) => e.organizationId === organizationId)
}
