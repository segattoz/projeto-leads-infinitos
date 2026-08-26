import { Sparkles } from 'lucide-react'
import type { LeadScoreResult } from '@/types'
import { cn } from '@/lib/utils'

const LEVEL_LABEL: Record<LeadScoreResult['level'], string> = {
  ALTO: 'Alta prioridade',
  MEDIO: 'Prioridade média',
  BAIXO: 'Prioridade baixa',
}

const LEVEL_COLOR: Record<LeadScoreResult['level'], string> = {
  ALTO: 'text-success-strong',
  MEDIO: 'text-warn-strong',
  BAIXO: 'text-muted',
}

/**
 * Score explicável — nunca só um número. Mostra o total, o nível textual
 * (nunca depende só de cor) e o detalhamento por grupo com os motivos que
 * geraram cada pontuação.
 */
export function ScoreBreakdown({ score }: { score: LeadScoreResult }) {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-4xl font-bold tabular-nums text-ink">{score.total}</p>
          <p className="text-[11px] text-faint">de 100 pontos</p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center" aria-hidden>
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-line-strong)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={
                score.level === 'ALTO'
                  ? 'var(--color-success)'
                  : score.level === 'MEDIO'
                    ? 'var(--color-warn)'
                    : 'var(--color-faint)'
              }
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(score.total / 100) * 175.9} 175.9`}
            />
          </svg>
        </div>
        <p className={cn('text-xs font-bold uppercase tracking-wider', LEVEL_COLOR[score.level])}>
          {LEVEL_LABEL[score.level]}
        </p>
      </div>

      <div className="space-y-4 pt-5">
        {score.groups.map((group) => (
          <div key={group.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{group.label}</span>
              <span className="font-mono font-bold text-ink">
                {group.value}/{group.max}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${(group.value / group.max) * 100}%` }}
              />
            </div>
            <ul className="mt-1.5 space-y-1">
              {group.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-1.5 text-[11px] text-muted">
                  <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0 text-primary" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
