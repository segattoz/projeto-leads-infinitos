import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import 'leaflet/dist/leaflet.css'
import type { CompanyWithScore } from '@/types'
import { UBERLANDIA_CENTER } from '@/data/bairros'

export interface DrawPoint {
  lat: number
  lng: number
}

interface ProspectingMapProps {
  companies: CompanyWithScore[]
  drawing: boolean
  drawPoints: DrawPoint[]
  onAddDrawPoint: (p: DrawPoint) => void
  onClosePolygon: () => void
  closedPolygon: DrawPoint[] | null
  radiusPreview?: { center: [number, number]; radiusKm: number } | null
  heatmapEnabled: boolean
  selectedCompanyId: string | null
  onSelectCompany: (id: string) => void
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

/**
 * Mapa de prospecção baseado em Leaflet + OpenStreetMap (tiles CARTO dark,
 * sem token). Toda a camada geográfica é gerenciada de forma imperativa e
 * sincronizada com o estado React via effects.
 */
export function ProspectingMap({
  companies,
  drawing,
  drawPoints,
  onAddDrawPoint,
  onClosePolygon,
  closedPolygon,
  radiusPreview,
  heatmapEnabled,
  selectedCompanyId,
  onSelectCompany,
}: ProspectingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const drawLayerRef = useRef<L.LayerGroup | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const heatRef = useRef<L.HeatLayer | null>(null)

  // Callbacks em refs para não recriar handlers do Leaflet.
  const handlersRef = useRef({ onAddDrawPoint, onClosePolygon, onSelectCompany, drawing })
  handlersRef.current = { onAddDrawPoint, onClosePolygon, onSelectCompany, drawing }

  // ── Inicialização do mapa ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: UBERLANDIA_CENTER,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    })
    map.zoomControl.setPosition('bottomright')

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)
    drawLayerRef.current = L.layerGroup().addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (handlersRef.current.drawing) {
        handlersRef.current.onAddDrawPoint({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Cursor de desenho ────────────────────────────────────────────────────
  useEffect(() => {
    const el = mapRef.current?.getContainer()
    if (!el) return
    el.classList.toggle('is-drawing', drawing)
  }, [drawing])

  // ── Vértices e linha do desenho em andamento ─────────────────────────────
  useEffect(() => {
    const layer = drawLayerRef.current
    if (!layer) return
    layer.clearLayers()

    if (drawPoints.length === 0) return

    if (drawPoints.length >= 2) {
      L.polyline(
        drawPoints.map((p) => [p.lat, p.lng]),
        { color: 'var(--color-lime)', weight: 2, dashArray: '6 6', opacity: 0.9 },
      ).addTo(layer)
    }

    drawPoints.forEach((p, i) => {
      const isFirst = i === 0
      const marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: 'draw-vertex',
          html: `<div class="v ${isFirst ? 'first' : ''}"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
        keyboard: false,
      }).addTo(layer)

      // Clicar no primeiro vértice fecha o polígono (com 3+ pontos).
      if (isFirst) {
        marker.on('click', () => {
          if (drawPoints.length >= 3) handlersRef.current.onClosePolygon()
        })
      }
    })
  }, [drawPoints])

  // ── Polígono fechado ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (polygonRef.current) {
      polygonRef.current.remove()
      polygonRef.current = null
    }

    if (closedPolygon && closedPolygon.length >= 3) {
      polygonRef.current = L.polygon(
        closedPolygon.map((p) => [p.lat, p.lng]),
        {
          color: 'var(--color-primary)',
          weight: 2,
          fillColor: 'var(--color-primary)',
          fillOpacity: 0.08,
          dashArray: undefined,
        },
      ).addTo(map)
      map.fitBounds(polygonRef.current.getBounds(), { padding: [48, 48], maxZoom: 15 })
    }
  }, [closedPolygon])

  // ── Pré-visualização de raio ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (circleRef.current) {
      circleRef.current.remove()
      circleRef.current = null
    }

    if (radiusPreview) {
      circleRef.current = L.circle(radiusPreview.center, {
        radius: radiusPreview.radiusKm * 1000,
        color: 'var(--color-primary)',
        weight: 2,
        fillColor: 'var(--color-primary)',
        fillOpacity: 0.07,
      }).addTo(map)
      map.fitBounds(circleRef.current.getBounds(), { padding: [48, 48] })
    }
  }, [radiusPreview])

  // ── Marcadores de empresas (aparecimento progressivo) ────────────────────
  useEffect(() => {
    const layer = markersRef.current
    if (!layer) return
    layer.clearLayers()

    const timeouts: number[] = []
    companies.forEach((company, index) => {
      const timeout = window.setTimeout(() => {
        const isHigh = company.opportunity.level === 'ALTO'
        const marker = L.marker(
          [company.endereco.latitude, company.endereco.longitude],
          {
            icon: L.divIcon({
              className: `company-marker ${isHigh ? 'is-high' : ''}`,
              html: `
                <div style="position:relative">
                  ${isHigh ? '<div class="pulse"></div>' : ''}
                  ${company.isNew ? '<div class="new-badge">NOVA</div>' : ''}
                  <div class="dot"></div>
                </div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            }),
            title: company.nomeFantasia,
            riseOnHover: true,
          },
        )
        marker.on('click', () => handlersRef.current.onSelectCompany(company.id))
        marker.addTo(layer)
      }, Math.min(index * 28, 900))
      timeouts.push(timeout)
    })

    return () => timeouts.forEach(clearTimeout)
  }, [companies])

  // ── Destaque do marcador selecionado ─────────────────────────────────────
  useEffect(() => {
    const layer = markersRef.current
    if (!layer) return
    layer.eachLayer((l) => {
      const marker = l as L.Marker
      const el = marker.getElement()
      if (!el) return
      const company = companies.find(
        (c) =>
          c.endereco.latitude === marker.getLatLng().lat &&
          c.endereco.longitude === marker.getLatLng().lng,
      )
      el.classList.toggle('is-selected', company?.id === selectedCompanyId)
    })
  }, [selectedCompanyId, companies])

  // ── Camada de calor ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (heatRef.current) {
      heatRef.current.remove()
      heatRef.current = null
    }

    if (heatmapEnabled && companies.length > 0) {
      heatRef.current = L.heatLayer(
        companies.map((c) => [
          c.endereco.latitude,
          c.endereco.longitude,
          0.5 + c.opportunity.score / 200,
        ]),
        {
          radius: 42,
          blur: 32,
          maxZoom: 15,
          gradient: {
            0.2: '#123524',
            0.45: '#1d7a44',
            0.7: '#2ed573',
            0.9: '#b8f542',
          },
        },
      ).addTo(map)
    }
  }, [heatmapEnabled, companies])

  return <div ref={containerRef} className="h-full w-full" role="application" aria-label="Mapa de prospecção" />
}
