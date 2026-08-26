import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  'aria-label'?: string
}

export function Checkbox({ checked, onChange, label, className, ...rest }: CheckboxProps) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-2 text-sm text-ink',
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={rest['aria-label']}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-primary bg-primary text-white'
            : 'border-line-strong bg-surface-2 text-transparent hover:border-primary/50',
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3.5} />
      </button>
      {label && <span onClick={() => onChange(!checked)}>{label}</span>}
    </label>
  )
}
