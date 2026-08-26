import { useState } from 'react'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ORGANIZATIONS } from '@/data/organizations'
import { useOrganizationStore } from '@/store/useOrganizationStore'

/**
 * Seletor de organização ativa. Trocar aqui re-escopa toda a aplicação —
 * é a demonstração concreta (nesta V0 sem backend) de que dados de uma
 * organização nunca aparecem sob outra.
 */
export function OrgSwitcher() {
  const [open, setOpen] = useState(false)
  const activeId = useOrganizationStore((s) => s.activeOrganizationId)
  const setActiveId = useOrganizationStore((s) => s.setActiveOrganizationId)
  const active = ORGANIZATIONS.find((o) => o.id === activeId) ?? ORGANIZATIONS[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-left transition-colors hover:border-primary/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-dim text-primary">
          <Building2 className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-xs font-semibold text-ink">{active.name}</span>
          <span className="block text-[10px] text-faint">
            {active.city}/{active.state}
          </span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-faint" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[1050]" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="absolute left-0 z-[1060] mt-1.5 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-xl shadow-black/10 animate-fade-in"
          >
            {ORGANIZATIONS.map((org) => (
              <li key={org.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={org.id === activeId}
                  onClick={() => {
                    setActiveId(org.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                    org.id === activeId ? 'bg-primary-dim text-primary' : 'text-ink hover:bg-surface-2',
                  )}
                >
                  <span>
                    <span className="block font-medium">{org.name}</span>
                    <span className="block text-[11px] text-faint">
                      {org.city}/{org.state}
                    </span>
                  </span>
                  {org.id === activeId && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
