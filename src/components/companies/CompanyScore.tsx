import { cn } from '@/lib/utils'

interface CompanyScoreProps {
  score: number
  size?: 'sm' | 'lg'
  className?: string
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success-strong'
  if (score >= 60) return 'text-warn-strong'
  return 'text-muted'
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-success'
  if (score >= 60) return 'bg-warn'
  return 'bg-faint'
}

/** Score de oportunidade com barra de progresso segmentada. */
export function CompanyScore({ score, size = 'sm', className }: CompanyScoreProps) {
  const segments = 10
  const filled = Math.round((score / 100) * segments)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'font-mono font-bold tabular-nums',
          size === 'lg' ? 'text-xl' : 'text-sm',
          scoreColor(score),
        )}
      >
        {score}
      </span>
      <div
        className="flex gap-[2px]"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score de oportunidade: ${score} de 100`}
      >
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'rounded-[1px]',
              size === 'lg' ? 'h-3 w-1.5' : 'h-2.5 w-1',
              i < filled ? barColor(score) : 'bg-line-strong',
            )}
          />
        ))}
      </div>
    </div>
  )
}
