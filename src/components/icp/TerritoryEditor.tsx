import { useCallback, useState } from 'react'
import area from '@turf/area'
import { polygon as turfPolygon } from '@turf/helpers'
import { Circle as CircleIcon, Eraser, Hexagon, MousePointerClick } from 'lucide-react'
import type { AreaMode, Territory } from '@/types'
import { cn, formatKm2 } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TerritoryMap, type DrawPoint } from '@/components/map/TerritoryMap'

interface TerritoryEditorProps {
  value: Territory | null
  onChange: (territory: Territory) => void
  defaultCenter: [number, number]
}

function toGeoJsonPolygon(points: DrawPoint[]): GeoJSON.Polygon {
  const ring = points.map((p) => [p.lng, p.lat])
  ring.push(ring[0])
  return { type: 'Polygon', coordinates: [ring] }
}

function fromGeoJsonPolygon(poly: GeoJSON.Polygon): DrawPoint[] {
  return poly.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }))
}

/** Editor de território reutilizado pelo editor de ICP e pelo wizard do Radar. */
export function TerritoryEditor({ value, onChange, defaultCenter }: TerritoryEditorProps) {
  const [city, setCity] = useState(value?.city ?? '')
  const [state, setState] = useState(value?.state ?? '')
  const [areaMode, setAreaMode] = useState<AreaMode>(value?.areaMode ?? 'polygon')
  const [radiusKm, setRadiusKm] = useState(value?.radiusKm ?? 3)
  const [drawing, setDrawing] = useState(false)
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([])
  const [closedPolygon, setClosedPolygon] = useState<DrawPoint[] | null>(
    value?.polygon ? fromGeoJsonPolygon(value.polygon) : null,
  )

  const commit = useCallback(
    (changes: Partial<Territory>) => {
      onChange({
        city,
        state,
        areaMode,
        polygon: closedPolygon && closedPolygon.length >= 3 ? toGeoJsonPolygon(closedPolygon) : undefined,
        center: value?.center,
        radiusKm,
        ...changes,
      })
    },
    [city, state, areaMode, closedPolygon, radiusKm, value?.center, onChange],
  )

  const handleClosePolygon = useCallback(() => {
    setDrawPoints((prev) => {
      if (prev.length >= 3) {
        setClosedPolygon(prev)
        setDrawing(false)
        onChange({ city, state, areaMode: 'polygon', polygon: toGeoJsonPolygon(prev) })
        return []
      }
      return prev
    })
  }, [city, state, onChange])

  const areaKm2 =
    closedPolygon && closedPolygon.length >= 3
      ? area(turfPolygon(toGeoJsonPolygon(closedPolygon).coordinates)) / 1_000_000
      : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="terr-city">
            Cidade
          </label>
          <Input
            id="terr-city"
            value={city}
            onChange={(e) => {
              setCity(e.target.value)
              commit({ city: e.target.value })
            }}
            placeholder="Ex.: Uberlândia"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="terr-state">
            UF
          </label>
          <Input
            id="terr-state"
            value={state}
            maxLength={2}
            onChange={(e) => {
              const v = e.target.value.toUpperCase()
              setState(v)
              commit({ state: v })
            }}
            placeholder="MG"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-line bg-surface-2 p-1">
        {(
          [
            { mode: 'polygon' as const, label: 'Desenhar no mapa', icon: Hexagon },
            { mode: 'radius' as const, label: 'Raio', icon: CircleIcon },
          ]
        ).map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setAreaMode(mode)
              commit({ areaMode: mode })
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[11px] font-medium transition-colors',
              areaMode === mode ? 'bg-primary-dim text-primary-strong' : 'text-muted hover:text-ink',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {areaMode === 'polygon' ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={drawing ? 'primary' : 'secondary'}
            size="sm"
            disabled={drawing}
            onClick={() => {
              setClosedPolygon(null)
              setDrawPoints([])
              setDrawing(true)
            }}
          >
            <Hexagon className="h-3.5 w-3.5" />
            {drawing ? 'Desenhando... clique no mapa' : closedPolygon ? 'Desenhar nova área' : 'Desenhar área no mapa'}
          </Button>
          {closedPolygon && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setClosedPolygon(null)
                setDrawing(false)
                setDrawPoints([])
              }}
            >
              <Eraser className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
          {areaKm2 !== null && (
            <span className="font-mono text-xs text-primary-strong">{formatKm2(areaKm2)}</span>
          )}
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-[11px] text-muted" htmlFor="terr-radius">
            Raio: <span className="font-mono text-primary-strong">{radiusKm} km</span>
          </label>
          <input
            id="terr-radius"
            type="range"
            min={1}
            max={15}
            step={0.5}
            value={radiusKm}
            onChange={(e) => {
              const v = Number(e.target.value)
              setRadiusKm(v)
              commit({ radiusKm: v, center: { latitude: defaultCenter[0], longitude: defaultCenter[1] } })
            }}
            className="w-full accent-[var(--color-primary)]"
          />
        </div>
      )}

      <div className="relative h-72 overflow-hidden rounded-lg border border-line">
        <TerritoryMap
          center={defaultCenter}
          drawing={drawing}
          drawPoints={drawPoints}
          onAddDrawPoint={(p) => setDrawPoints((prev) => [...prev, p])}
          onClosePolygon={handleClosePolygon}
          closedPolygon={closedPolygon}
          radiusPreview={
            areaMode === 'radius'
              ? { center: value?.center ? [value.center.latitude, value.center.longitude] : defaultCenter, radiusKm }
              : null
          }
        />
        {drawing && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-center">
            <div className="max-w-full rounded-lg border border-line-strong bg-surface/95 px-3 py-2 text-center text-[11px] text-ink shadow-lg shadow-black/10">
              <MousePointerClick className="mr-1 inline-block h-3 w-3 align-[-1px] text-primary" />
              {drawPoints.length === 0
                ? 'Clique no mapa para começar a desenhar o território.'
                : drawPoints.length < 3
                  ? `${drawPoints.length} pontos marcados — continue clicando.`
                  : 'Clique no primeiro ponto para fechar a área.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
