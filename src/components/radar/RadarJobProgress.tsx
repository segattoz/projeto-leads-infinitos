import { useEffect, useState } from 'react'
import { Check, Loader2, Radar as RadarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['Consultando fonte', 'Normalizando empresas', 'Verificando duplicidade', 'Calculando score']

/** Overlay animado exibido durante a execução do Radar. */
export function RadarJobProgress() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) => window.setTimeout(() => setCurrentStep(i + 1), 320 * (i + 1)))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-bg/80 backdrop-blur-[2px] animate-fade-in">
      <div className="w-80 rounded-xl border border-line-strong bg-surface p-6 shadow-2xl shadow-black/10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary-dim">
            <RadarIcon className="h-4 w-4 animate-pulse text-primary" />
            <span className="radar-ping absolute inset-0 rounded-full border border-primary/50" />
          </div>
          <p className="text-sm font-semibold text-ink">Analisando território...</p>
        </div>
        <ul className="mt-5 space-y-3">
          {STEPS.map((step, i) => {
            const done = currentStep > i
            const active = currentStep === i
            return (
              <li
                key={step}
                className={cn(
                  'flex items-center gap-2 text-xs transition-colors',
                  done ? 'text-success-strong' : active ? 'text-ink' : 'text-faint',
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
