import { Menu } from 'lucide-react'
import { OrgSwitcher } from '@/components/layout/OrgSwitcher'

interface HeaderProps {
  onMenuClick: () => void
}

/** Barra superior — seletor de organização ativa e identificação do usuário. */
export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-ink md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <OrgSwitcher />
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary-dim text-xs font-bold text-primary-strong">
          V
        </div>
        <span className="hidden text-sm text-ink md:inline">Você</span>
      </div>
    </header>
  )
}
