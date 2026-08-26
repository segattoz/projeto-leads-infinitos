import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
  'aria-label'?: string
}

export function Checkbox({ checked, onChange, label, className, disabled, ...rest }: CheckboxProps) {
  return (
    <label
      className={cn(
        'inline-flex select-none items-center gap-2 text-sm text-ink',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={rest['aria-label']}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-primary bg-primary text-white'
            : 'border-line-strong bg-surface-2 text-transparent hover:border-primary/50',
          disabled && 'cursor-not-allowed hover:border-line-strong',
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3.5} />
      </button>
      {label && <span onClick={() => !disabled && onChange(!checked)}>{label}</span>}
    </label>
  )
}
