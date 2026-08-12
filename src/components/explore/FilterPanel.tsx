import { Circle as CircleIcon, Eraser, Hexagon, Radar, X } from 'lucide-react'
import type { AreaMode } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/select'
import { SEGMENTS, getSegment } from '@/data/segments'
import { BAIRROS } from '@/data/bairros'

interface FilterPanelProps {
  city: string
  onCityChange: (v: string) => void
  segmentSlug: string | null
  onSegmentChange: (v: string) => void
  onlyActive: boolean
  onOnlyActiveChange: (v: boolean) => void
  areaMode: AreaMode
  onAreaModeChange: (v: AreaMode) => void
  radiusBairro: string
  onRadiusBairroChange: (v: string) => void
  radiusKm: number
  onRadiusKmChange: (v: number) => void
  drawing: boolean
  hasPolygon: boolean
  hasDrawPoints: boolean
  onStartDrawing: () => void
  onClearArea: () => void
  onSearch: () => void
  searching: boolean
  /** Controla a visibilidade em telas menores que `xl`, onde o painel vira um overlay de tela cheia. */
  mobileOpen: boolean
  onMobileClose: () => void
}

/**
 * Painel de filtros da tela Explorar Território.
 * Em telas `xl+` é uma coluna lateral sempre visível; abaixo disso vira um
 * overlay de tela cheia acionado pela barra de ferramentas mobile.
 */
export function FilterPanel(props: FilterPanelProps) {
  const segment = props.segmentSlug ? getSegment(props.segmentSlug) : undefined

  return (
    <div
      className={cn(
        'fixed inset-0 z-[1150] w-full flex-col bg-surface',
        props.mobileOpen ? 'flex' : 'hidden',
        'xl:static xl:z-auto xl:flex xl:h-full xl:w-[290px] xl:shrink-0 xl:border-r xl:border-line',
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h1 className="text-base font-bold text-ink">Explore seu mercado</h1>
          <p className="mt-1 text-xs text-muted">
            Escolha quem você procura e onde deseja vender.
          </p>
        </div>
        <button
          onClick={props.onMobileClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-3 hover:text-ink xl:hidden"
          aria-label="Fechar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div>
          <label htmlFor="cidade" className="mb-1.5 block text-xs font-medium text-muted">
            Cidade
          </label>
          <Input
            id="cidade"
            value={props.city}
            onChange={(e) => props.onCityChange(e.target.value)}
            placeholder="Pesquisar cidade..."
          />
        </div>

        <div>
          <label htmlFor="segmento" className="mb-1.5 block text-xs font-medium text-muted">
            Segmento
          </label>
          <SearchableSelect
            id="segmento"
            options={SEGMENTS.map((s) => ({ value: s.slug, label: s.name }))}
            value={props.segmentSlug}
            onChange={props.onSegmentChange}
            placeholder="Quem você procura?"
            searchPlaceholder="Pesquisar segmento..."
          />
          {segment && (
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-faint">
              CNAEs relacionados: {segment.cnaes.map((c) => c.code).join(', ')}
            </p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Situação cadastral</p>
          <Checkbox
            checked={props.onlyActive}
            onChange={props.onOnlyActiveChange}
            label="Somente empresas ativas"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted">Área de prospecção</p>
          <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-line bg-surface-2 p-1">
            {(
              [
                { mode: 'polygon', label: 'Desenhar no mapa', icon: Hexagon },
                { mode: 'radius', label: 'Raio', icon: CircleIcon },
              ] as const
            ).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => props.onAreaModeChange(mode)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[11px] font-medium transition-colors',
                  props.areaMode === mode
                    ? 'bg-primary-dim text-primary-strong'
                    : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {props.areaMode === 'polygon' ? (
            <div className="mt-3 space-y-2">
              <Button
                variant={props.drawing ? 'primary' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={props.onStartDrawing}
                disabled={props.drawing}
              >
                <Hexagon className="h-3.5 w-3.5" />
                {props.drawing
                  ? 'Desenhando... clique no mapa'
                  : props.hasPolygon
                    ? 'Desenhar nova área'
                    : 'Desenhar área no mapa'}
              </Button>
              {(props.hasPolygon || props.hasDrawPoints) && (
                <Button variant="ghost" size="sm" className="w-full" onClick={props.onClearArea}>
                  <Eraser className="h-3.5 w-3.5" /> Limpar seleção
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] text-muted" htmlFor="bairro-ref">
                  Endereço de referência
                </label>
                <SearchableSelect
                  id="bairro-ref"
                  options={BAIRROS.map((b) => ({ value: b.nome, label: b.nome }))}
                  value={props.radiusBairro}
                  onChange={props.onRadiusBairroChange}
                  placeholder="Escolher referência..."
                  searchPlaceholder="Pesquisar bairro..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-muted" htmlFor="raio-km">
                  Raio: <span className="font-mono text-primary-strong">{props.radiusKm} km</span>
                </label>
                <input
                  id="raio-km"
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={props.radiusKm}
                  onChange={(e) => props.onRadiusKmChange(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line p-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full px-3 text-xs tracking-wider"
          onClick={props.onSearch}
          disabled={props.searching}
        >
          <Radar className={cn('h-4 w-4 shrink-0', props.searching && 'animate-spin')} />
          {props.searching ? 'ANALISANDO...' : 'ENCONTRAR OPORTUNIDADES'}
        </Button>
      </div>
    </div>
  )
}
