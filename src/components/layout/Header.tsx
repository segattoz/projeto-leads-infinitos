import { MapPin } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'

/** Barra superior com contexto territorial e identificação do usuário. */
export function Header() {
  const userName = useSettingsStore((s) => s.userName)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <div className="flex items-center gap-2 text-xs text-muted">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono tracking-wide">
          Uberlândia · MG
          <span className="ml-3 hidden text-faint md:inline">-18.9186, -48.2772</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[11px] text-muted sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Base atualizada hoje às 08:00
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary-dim text-xs font-bold text-primary-strong">
            {userName.charAt(0)}
          </div>
          <span className="hidden text-sm text-ink md:inline">{userName}</span>
        </div>
      </div>
    </header>
  )
}
