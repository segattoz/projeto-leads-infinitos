import { cn } from '@/lib/utils'

/** Símbolo da marca: radar/crosshair minimalista, discreto e profissional. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn('h-8 w-8', className)} aria-hidden>
      <circle cx="16" cy="16" r="10" stroke="var(--color-primary)" strokeWidth="1.4" opacity="0.35" />
      <circle cx="16" cy="16" r="5.5" stroke="var(--color-primary)" strokeWidth="1.4" opacity="0.85" />
      <circle cx="16" cy="16" r="1.9" fill="var(--color-success)" />
      <line x1="16" y1="1.5" x2="16" y2="7.5" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16" y1="24.5" x2="16" y2="30.5" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="1.5" y1="16" x2="7.5" y2="16" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="24.5" y1="16" x2="30.5" y2="16" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function LogoType({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="h-7 w-7 shrink-0" />
      {!collapsed && (
        <div className="leading-none">
          <p className="text-[13px] font-extrabold tracking-[0.1em] text-ink">
            i9 <span className="text-primary">RADAR</span>
          </p>
          <p className="mt-1 font-mono text-[8.5px] font-medium tracking-[0.24em] text-faint">
            INTELIGÊNCIA COMERCIAL
          </p>
        </div>
      )}
    </div>
  )
}
