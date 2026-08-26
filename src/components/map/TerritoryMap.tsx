import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface DrawPoint {
  lat: number
  lng: number
}

interface TerritoryMapProps {
  center: [number, number]
  drawing: boolean
  drawPoints: DrawPoint[]
  onAddDrawPoint: (p: DrawPoint) => void
  onClosePolygon: () => void
  closedPolygon: DrawPoint[] | null
  radiusPreview?: { center: [number, number]; radiusKm: number } | null
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

/**
 * Mapa de configuração de território — desenho de polígono ou raio, usado no
 * editor de ICP e no wizard do Radar. Baseado em Leaflet + OpenStreetMap
 * (tiles CARTO escuros, sem token pago).
 */
export function TerritoryMap({
  center,
  drawing,
  drawPoints,
  onAddDrawPoint,
  onClosePolygon,
  closedPolygon,
  radiusPreview,
}: TerritoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const drawLayerRef = useRef<L.LayerGroup | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  const handlersRef = useRef({ onAddDrawPoint, onClosePolygon, drawing })
  handlersRef.current = { onAddDrawPoint, onClosePolygon, drawing }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    })
    map.zoomControl.setPosition('bottomright')

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19, subdomains: 'abcd' }).addTo(map)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = mapRef.current?.getContainer()
    if (!el) return
    el.classList.toggle('is-drawing', drawing)
  }, [drawing])

  useEffect(() => {
    const layer = drawLayerRef.current
    if (!layer) return
    layer.clearLayers()
    if (drawPoints.length === 0) return

    if (drawPoints.length >= 2) {
      L.polyline(
        drawPoints.map((p) => [p.lat, p.lng]),
        { color: 'var(--color-primary)', weight: 2, dashArray: '6 6', opacity: 0.9 },
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

      if (isFirst) {
        marker.on('click', () => {
          if (drawPoints.length >= 3) handlersRef.current.onClosePolygon()
        })
      }
    })
  }, [drawPoints])

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
        { color: 'var(--color-primary)', weight: 2, fillColor: 'var(--color-primary)', fillOpacity: 0.1 },
      ).addTo(map)
      map.fitBounds(polygonRef.current.getBounds(), { padding: [48, 48], maxZoom: 15 })
    }
  }, [closedPolygon])

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
        fillOpacity: 0.08,
      }).addTo(map)
      map.fitBounds(circleRef.current.getBounds(), { padding: [48, 48] })
    }
  }, [radiusPreview])

  return <div ref={containerRef} className="h-full w-full" role="application" aria-label="Mapa de território" />
}
