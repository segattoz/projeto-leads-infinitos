import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MiniMapProps {
  latitude: number
  longitude: number
}

/** Mini mapa estático usado no drawer de detalhes da empresa. */
export function MiniMap({ latitude, longitude }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'company-marker is-high',
        html: '<div style="position:relative"><div class="pulse"></div><div class="dot"></div></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
      keyboard: false,
      interactive: false,
    }).addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      className="h-36 w-full overflow-hidden rounded-lg border border-line"
      aria-hidden
    />
  )
}
