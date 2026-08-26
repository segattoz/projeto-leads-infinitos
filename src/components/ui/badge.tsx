import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'primary' | 'success' | 'outline' | 'muted' | 'danger' | 'warn'

const variants: Record<Variant, string> = {
  default: 'bg-surface-3 text-muted border border-line-strong',
  primary: 'bg-primary-dim text-primary-strong border border-primary/25',
  success: 'bg-success text-white border border-success font-bold',
  outline: 'border border-line-strong text-muted',
  muted: 'bg-surface-2 text-faint border border-line',
  danger: 'bg-danger-dim text-danger border border-danger/25',
  warn: 'bg-warn-dim text-warn-strong border border-warn/25',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
