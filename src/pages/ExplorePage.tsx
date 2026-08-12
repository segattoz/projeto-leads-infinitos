import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import area from '@turf/area'
import { polygon as turfPolygon } from '@turf/helpers'
import { Flame, Hexagon, MousePointerClick } from 'lucide-react'
import type { AreaMode, CompanyWithScore, ProspectingQuery } from '@/types'
import { formatKm2 } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { FilterPanel } from '@/components/explore/FilterPanel'
import { ResultsPanel } from '@/components/explore/ResultsPanel'
import { SearchProgress } from '@/components/explore/SearchProgress'
import { ProspectingMap, type DrawPoint } from '@/components/map/ProspectingMap'
import { CompanyDrawer } from '@/components/companies/CompanyDrawer'
import { findOpportunities } from '@/services/prospectingService'
import { getSegment } from '@/data/segments'
import { BAIRROS } from '@/data/bairros'
import { usePipelineStore } from '@/store/usePipelineStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSettingsStore } from '@/store/useSettingsStore'

const MIN_SEARCH_DURATION_MS = 1300

function toGeoJsonPolygon(points: DrawPoint[]): GeoJSON.Polygon {
  const ring = points.map((p) => [p.lng, p.lat])
  ring.push(ring[0])
  return { type: 'Polygon', coordinates: [ring] }
}

function fromGeoJsonPolygon(poly: GeoJSON.Polygon): DrawPoint[] {
  return poly.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }))
}

/** Tela principal: explorar território, desenhar área e encontrar oportunidades. */
export function ExplorePage() {
  const navigate = useNavigate()

  // Filtros
  const [city, setCity] = useState('Uberlândia - MG')
  const [segmentSlug, setSegmentSlug] = useState<string | null>('oficinas-mecanicas')
  const [onlyActive, setOnlyActive] = useState(true)
  const [areaMode, setAreaMode] = useState<AreaMode>('polygon')
  const [radiusBairro, setRadiusBairro] = useState('Centro')
  const [radiusKm, setRadiusKm] = useState(3)

  // Desenho de polígono
  const lastSearch = useSearchStore((s) => s.query)
  const [drawing, setDrawing] = useState(false)
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([])
  const [closedPolygon, setClosedPolygon] = useState<DrawPoint[] | null>(() =>
    lastSearch?.polygon ? fromGeoJsonPolygon(lastSearch.polygon) : null,
  )

  // Busca
  const [searching, setSearching] = useState(false)
  const result = useSearchStore((s) => s.result)
  const setSearch = useSearchStore((s) => s.setSearch)
  const clearSearch = useSearchStore((s) => s.clear)
  const [resultsPanelOpen, setResultsPanelOpen] = useState(result !== null)

  // Seleção / drawer
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Heatmap
  const heatmapEnabled = useSettingsStore((s) => s.heatmapEnabled)
  const setHeatmapEnabled = useSettingsStore((s) => s.setHeatmapEnabled)

  // Pipeline
  const leads = usePipelineStore((s) => s.leads)
  const addCompany = usePipelineStore((s) => s.addCompany)
  const pipelineCompanyIds = useMemo(
    () => new Set(leads.map((l) => l.companyId)),
    [leads],
  )

  const companies = useMemo(() => result?.companies ?? [], [result])

  const selectedAreaKm2 = useMemo(() => {
    if (areaMode === 'polygon' && closedPolygon && closedPolygon.length >= 3) {
      return area(turfPolygon(toGeoJsonPolygon(closedPolygon).coordinates)) / 1_000_000
    }
    if (areaMode === 'radius') {
      return Math.PI * radiusKm * radiusKm
    }
    return null
  }, [areaMode, closedPolygon, radiusKm])

  const radiusPreview = useMemo(() => {
    if (areaMode !== 'radius') return null
    const bairro = BAIRROS.find((b) => b.nome === radiusBairro)
    if (!bairro) return null
    return { center: [bairro.latitude, bairro.longitude] as [number, number], radiusKm }
  }, [areaMode, radiusBairro, radiusKm])

  // ── Desenho ──────────────────────────────────────────────────────────────
  const handleStartDrawing = useCallback(() => {
    setClosedPolygon(null)
    setDrawPoints([])
    setDrawing(true)
  }, [])

  const handleAddDrawPoint = useCallback((p: DrawPoint) => {
    setDrawPoints((prev) => [...prev, p])
  }, [])

  const handleClosePolygon = useCallback(() => {
    setDrawPoints((prev) => {
      if (prev.length >= 3) {
        setClosedPolygon(prev)
        setDrawing(false)
        return []
      }
      return prev
    })
  }, [])

  const handleClearArea = useCallback(() => {
    setDrawing(false)
    setDrawPoints([])
    setClosedPolygon(null)
    clearSearch()
    setResultsPanelOpen(false)
  }, [clearSearch])

  // ── Busca ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!segmentSlug) {
      toast.error('Escolha um segmento para começar.')
      return
    }
    const query: ProspectingQuery = {
      segmentSlug,
      city,
      onlyActive,
      areaMode,
    }
    if (areaMode === 'polygon') {
      if (!closedPolygon || closedPolygon.length < 3) {
        toast.error('Desenhe uma área no mapa antes de buscar.', {
          description: 'Clique em "Desenhar área no mapa" e marque pelo menos 3 pontos.',
        })
        return
      }
      query.polygon = toGeoJsonPolygon(closedPolygon)
    } else {
      const bairro = BAIRROS.find((b) => b.nome === radiusBairro)
      if (!bairro) {
        toast.error('Escolha um endereço de referência para o raio.')
        return
      }
      query.center = { latitude: bairro.latitude, longitude: bairro.longitude }
      query.radiusKm = radiusKm
    }

    setSearching(true)
    setResultsPanelOpen(false)
    setSelectedCompany(null)

    try {
      const [searchResult] = await Promise.all([
        findOpportunities(query),
        new Promise((resolve) => setTimeout(resolve, MIN_SEARCH_DURATION_MS)),
      ])
      setSearch(query, searchResult)
      setResultsPanelOpen(true)
      const count = searchResult.companies.length
      if (count > 0) {
        toast.success(
          `${count} ${count === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'} nesta região.`,
        )
      }
    } catch {
      toast.error('Não foi possível concluir a análise.', {
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setSearching(false)
    }
  }, [segmentSlug, city, onlyActive, areaMode, closedPolygon, radiusBairro, radiusKm, setSearch])

  // ── Pipeline / drawer ────────────────────────────────────────────────────
  const handleAddToPipeline = useCallback(
    (company: CompanyWithScore) => {
      const lead = addCompany(company)
      if (lead) {
        toast.success(`${company.nomeFantasia} adicionada ao Pipeline.`, {
          action: { label: 'Ver pipeline', onClick: () => navigate('/app/pipeline') },
        })
      } else {
        toast.info(`${company.nomeFantasia} já está no pipeline.`)
      }
      setDrawerOpen(false)
    },
    [addCompany, navigate],
  )

  const handleSelectCompany = useCallback(
    (id: string) => {
      const company = companies.find((c) => c.id === id)
      if (company) {
        setSelectedCompany(company)
        setDrawerOpen(true)
      }
    },
    [companies],
  )

  const handleViewDetails = useCallback((company: CompanyWithScore) => {
    setSelectedCompany(company)
    setDrawerOpen(true)
  }, [])

  const segment = segmentSlug ? getSegment(segmentSlug) : undefined

  return (
    <div className="flex h-full">
      <FilterPanel
        city={city}
        onCityChange={setCity}
        segmentSlug={segmentSlug}
        onSegmentChange={setSegmentSlug}
        onlyActive={onlyActive}
        onOnlyActiveChange={setOnlyActive}
        areaMode={areaMode}
        onAreaModeChange={setAreaMode}
        radiusBairro={radiusBairro}
        onRadiusBairroChange={setRadiusBairro}
        radiusKm={radiusKm}
        onRadiusKmChange={setRadiusKm}
        drawing={drawing}
        hasPolygon={closedPolygon !== null}
        hasDrawPoints={drawPoints.length > 0}
        onStartDrawing={handleStartDrawing}
        onClearArea={handleClearArea}
        onSearch={handleSearch}
        searching={searching}
      />

      <div className="relative min-w-0 flex-1">
        <ProspectingMap
          companies={companies}
          drawing={drawing}
          drawPoints={drawPoints}
          onAddDrawPoint={handleAddDrawPoint}
          onClosePolygon={handleClosePolygon}
          closedPolygon={closedPolygon}
          radiusPreview={radiusPreview}
          heatmapEnabled={heatmapEnabled}
          selectedCompanyId={selectedCompany?.id ?? null}
          onSelectCompany={handleSelectCompany}
        />

        {/* Tooltip de desenho */}
        {drawing && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2 animate-slide-up">
            <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-surface/95 px-4 py-2.5 text-xs text-ink shadow-xl shadow-black/40">
              <MousePointerClick className="h-3.5 w-3.5 text-lime" />
              {drawPoints.length === 0
                ? 'Clique no mapa para começar a desenhar sua área de prospecção.'
                : drawPoints.length < 3
                  ? `${drawPoints.length} ${drawPoints.length === 1 ? 'ponto marcado' : 'pontos marcados'} — continue clicando.`
                  : 'Clique no primeiro ponto para fechar a área.'}
            </div>
          </div>
        )}

        {/* Botão fechar área */}
        {drawing && drawPoints.length >= 3 && (
          <div className="absolute left-1/2 top-16 z-[1000] -translate-x-1/2">
            <Button variant="primary" size="sm" onClick={handleClosePolygon}>
              <Hexagon className="h-3.5 w-3.5" /> Fechar área
            </Button>
          </div>
        )}

        {/* Chip de área selecionada */}
        {selectedAreaKm2 !== null && !drawing && (
          <div className="absolute left-4 top-4 z-[1000] animate-fade-in">
            <div className="rounded-lg border border-line-strong bg-surface/95 px-3.5 py-2 shadow-xl shadow-black/40">
              <p className="text-[10px] uppercase tracking-wider text-faint">Área selecionada</p>
              <p className="font-mono text-sm font-semibold text-primary-strong">
                {formatKm2(selectedAreaKm2)}
              </p>
            </div>
          </div>
        )}

        {/* Controle do mapa de calor */}
        <div className="absolute right-4 top-4 z-[1000]">
          <div className="rounded-lg border border-line-strong bg-surface/95 px-3.5 py-2.5 shadow-xl shadow-black/40">
            <Switch
              checked={heatmapEnabled}
              onChange={setHeatmapEnabled}
              label={
                <span className="flex items-center gap-1.5 text-xs">
                  <Flame className="h-3.5 w-3.5 text-primary" /> Mapa de calor
                </span>
              }
            />
            {heatmapEnabled && (
              <div className="mt-2 animate-fade-in">
                <div
                  className="h-1.5 w-full rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, #123524, #1d7a44, #2ed573, #b8f542)',
                  }}
                />
                <div className="mt-1 flex justify-between text-[9px] text-faint">
                  <span>Menor concentração</span>
                  <span>Maior</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contexto da busca atual */}
        {result && segment && !drawing && (
          <div className="absolute bottom-6 left-4 z-[1000] animate-fade-in">
            <div className="rounded-lg border border-line-strong bg-surface/95 px-3.5 py-2 text-xs shadow-xl shadow-black/40">
              <span className="font-semibold text-ink">{companies.length}</span>{' '}
              <span className="text-muted">
                {companies.length === 1 ? 'oportunidade' : 'oportunidades'} · {segment.name} ·{' '}
                {city}
              </span>
            </div>
          </div>
        )}

        {searching && <SearchProgress />}
      </div>

      {resultsPanelOpen && result && (
        <ResultsPanel
          companies={companies}
          pipelineCompanyIds={pipelineCompanyIds}
          selectedCompanyId={selectedCompany?.id ?? null}
          onViewDetails={handleViewDetails}
          onAddToPipeline={handleAddToPipeline}
          onClose={() => setResultsPanelOpen(false)}
        />
      )}

      <CompanyDrawer
        company={selectedCompany}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        inPipeline={selectedCompany ? pipelineCompanyIds.has(selectedCompany.id) : false}
        onAddToPipeline={handleAddToPipeline}
        contextReasons={[
          'Está dentro do território selecionado',
          'Segmento compatível com sua busca',
        ]}
      />
    </div>
  )
}
