import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'primary' | 'lime' | 'outline' | 'muted' | 'danger' | 'warn'

const variants: Record<Variant, string> = {
  default: 'bg-surface-3 text-muted border border-line-strong',
  primary: 'bg-primary-dim text-primary-strong border border-primary/30',
  lime: 'bg-lime text-[#131804] border border-lime font-bold',
  outline: 'border border-line-strong text-muted',
  muted: 'bg-surface-2 text-faint border border-line',
  danger: 'bg-danger/10 text-danger border border-danger/30',
  warn: 'bg-warn/10 text-warn border border-warn/30',
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
