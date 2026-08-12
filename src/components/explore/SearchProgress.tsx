import { useEffect, useState } from 'react'
import { Check, Loader2, Radar } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  'Identificando CNAEs',
  'Cruzando localização',
  'Validando empresas ativas',
  'Calculando oportunidades',
]

/** Overlay animado exibido durante a análise do território. */
export function SearchProgress() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      window.setTimeout(() => setCurrentStep(i + 1), 280 * (i + 1)),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-bg/70 backdrop-blur-[2px] animate-fade-in">
      <div className="w-72 rounded-xl border border-line-strong bg-surface p-5 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary-dim">
            <Radar className="h-4 w-4 animate-pulse text-primary-strong" />
            <span className="radar-ping absolute inset-0 rounded-full border border-primary/60" />
          </div>
          <p className="text-sm font-semibold text-ink">Analisando território...</p>
        </div>
        <ul className="mt-4 space-y-2.5">
          {STEPS.map((step, i) => {
            const done = currentStep > i
            const active = currentStep === i
            return (
              <li
                key={step}
                className={cn(
                  'flex items-center gap-2 text-xs transition-colors',
                  done ? 'text-primary-strong' : active ? 'text-ink' : 'text-faint',
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-line-strong" />
                )}
                {step}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
