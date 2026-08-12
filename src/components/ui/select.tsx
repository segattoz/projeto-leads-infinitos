import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  hint?: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  id?: string
}

/** Select pesquisável no estilo combobox do shadcn/ui. */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Pesquisar...',
  className,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    inputRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v)
          setQuery('')
        }}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line-strong bg-surface-2 px-3 text-sm transition-colors',
          'hover:border-primary/40 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20',
          selected ? 'text-ink' : 'text-faint',
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-faint" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-line-strong bg-surface-2 shadow-2xl shadow-black/50 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="h-3.5 w-3.5 text-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-faint">
                Nenhum resultado encontrado.
              </li>
            )}
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                    option.value === value
                      ? 'bg-primary-dim text-primary-strong'
                      : 'text-ink hover:bg-surface-3',
                  )}
                >
                  <span className="flex flex-col">
                    <span>{option.label}</span>
                    {option.hint && (
                      <span className="text-[10px] text-faint">{option.hint}</span>
                    )}
                  </span>
                  {option.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface SimpleSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  'aria-label'?: string
}

/** Select nativo estilizado para ordenações e filtros simples. */
export function SimpleSelect({ options, value, onChange, className, ...rest }: SimpleSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-8 rounded-md border border-line-strong bg-surface-2 px-2 text-xs text-ink',
        'focus:border-primary/60 focus:outline-none cursor-pointer',
        className,
      )}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
