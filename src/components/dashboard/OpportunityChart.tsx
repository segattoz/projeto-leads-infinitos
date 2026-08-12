import { useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOpportunitiesSeries } from '@/services/dashboardService'

const W = 720
const H = 200
const PAD = { top: 16, right: 16, bottom: 26, left: 34 }

/**
 * Oportunidades encontradas por período — série única (verde da marca),
 * linha 2px com preenchimento sutil, grid recessivo e crosshair com tooltip.
 */
export function OpportunityChart() {
  const data = useMemo(getOpportunitiesSeries, [])
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const maxValue = Math.max(...data.map((d) => d.value))
  const yMax = Math.ceil(maxValue / 10) * 10

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (i / (data.length - 1)) * plotW
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.value)}`).join(' ')
  const areaPath = `${linePath} L${x(data.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`

  const gridValues = [0, yMax / 2, yMax]

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((px - PAD.left) / plotW) * (data.length - 1))
    setHoverIndex(Math.max(0, Math.min(data.length - 1, i)))
  }

  const hover = hoverIndex !== null ? data[hoverIndex] : null
  const last = data[data.length - 1]

  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between">
        <CardTitle>Oportunidades encontradas por período</CardTitle>
        <span className="text-[11px] text-faint">Últimas 8 semanas</span>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label={`Oportunidades encontradas por semana, de ${data[0].label} a ${last.label}. Última semana: ${last.value}.`}
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Grid horizontal recessivo */}
            {gridValues.map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--color-line)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 8}
                  y={y(v) + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--color-faint)"
                  fontFamily="var(--font-mono)"
                >
                  {v}
                </text>
              </g>
            ))}

            {/* Área + linha */}
            <path d={areaPath} fill="var(--color-primary)" opacity="0.09" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Rótulos do eixo X (primeira, meio, última) */}
            {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
              <text
                key={i}
                x={x(i)}
                y={H - 8}
                textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                fontSize="10"
                fill="var(--color-faint)"
              >
                {data[i].label}
              </text>
            ))}

            {/* Rótulo direto no último ponto */}
            <circle cx={x(data.length - 1)} cy={y(last.value)} r="4" fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth="2" />
            <text
              x={x(data.length - 1) - 8}
              y={y(last.value) - 10}
              textAnchor="end"
              fontSize="11"
              fontWeight="700"
              fill="var(--color-ink)"
              fontFamily="var(--font-mono)"
            >
              {last.value}
            </text>

            {/* Crosshair de hover */}
            {hoverIndex !== null && hover && (
              <g>
                <line
                  x1={x(hoverIndex)}
                  x2={x(hoverIndex)}
                  y1={PAD.top}
                  y2={PAD.top + plotH}
                  stroke="var(--color-line-strong)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(hoverIndex)}
                  cy={y(hover.value)}
                  r="5"
                  fill="var(--color-primary)"
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Tooltip */}
          {hoverIndex !== null && hover && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-line-strong bg-surface-3 px-2.5 py-1.5 shadow-xl shadow-black/40"
              style={{
                left: `${(x(hoverIndex) / W) * 100}%`,
                top: `${(y(hover.value) / H) * 100 - 22}%`,
              }}
            >
              <p className="whitespace-nowrap text-[10px] text-faint">Semana de {hover.label}</p>
              <p className="font-mono text-xs font-bold text-ink">
                {hover.value} oportunidades
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
