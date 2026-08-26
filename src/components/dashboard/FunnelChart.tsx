import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FunnelStage } from '@/services/dashboardService'

/** Funil de conversão Radar → Lead → Contato → Qualificado → Oportunidade → Ganho. */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-2.5"
          role="img"
          aria-label={`Funil de conversão: ${stages.map((s) => `${s.label} ${s.value}`).join(', ')}`}
        >
          {stages.map((stage, i) => {
            const widthPct = Math.max(4, (stage.value / max) * 100)
            const prevValue = i > 0 ? stages[i - 1].value : null
            const dropRate = prevValue && prevValue > 0 ? Math.round((stage.value / prevValue) * 100) : null
            return (
              <div key={stage.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{stage.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink">{stage.value}</span>
                    {dropRate !== null && (
                      <span className="font-mono text-[10px] text-faint">{dropRate}%</span>
                    )}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
