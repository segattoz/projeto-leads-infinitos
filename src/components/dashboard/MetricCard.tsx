import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: number
  caption: string
  highlight?: boolean
}

/** Contador animado de 0 até o valor final. */
function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let frame: number
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const progress = Math.min((t - startRef.current) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}

export function MetricCard({ icon: Icon, label, value, caption, highlight }: MetricCardProps) {
  const displayed = useCountUp(value)

  return (
    <Card className={`group p-5 transition-colors hover:border-primary/30 ${highlight ? 'glow-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors group-hover:border-primary/40 ${
            highlight ? 'border-primary/30 bg-primary-dim' : 'border-line bg-surface-2'
          }`}
        >
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-ink">
        {displayed.toLocaleString('pt-BR')}
      </p>
      <p className={`mt-1 text-[11px] ${highlight ? 'text-primary-strong' : 'text-faint'}`}>
        {caption}
      </p>
    </Card>
  )
}
