import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  className?: string
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
      {label != null && <span className="text-sm text-ink">{label}</span>}
    </label>
  )
}
