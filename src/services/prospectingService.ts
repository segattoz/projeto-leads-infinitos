import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import area from '@turf/area'
import distance from '@turf/distance'
import { point, polygon as turfPolygon } from '@turf/helpers'
import type {
  Company,
  CompanyWithScore,
  ProspectingQuery,
  ProspectingResult,
} from '@/types'
import { getSegment } from '@/data/segments'
import { companyRepository } from '@/services/repositories/CompanyRepository'
import {
  calculateOpportunityScore,
  isRecentlyDiscovered,
} from '@/services/opportunityScoreService'

/**
 * Motor de prospecção territorial da POC.
 *
 * A filtragem geoespacial é real: usa point-in-polygon (Turf.js) sobre as
 * coordenadas das empresas. Em produção, esta mesma consulta será resolvida
 * pelo PostGIS com ST_Within(location, território) / ST_DWithin(location,
 * ponto, raio) — o formato GeoJSON usado aqui é o mesmo aceito lá.
 */

function polygonCentroid(poly: GeoJSON.Polygon): [number, number] {
  const ring = poly.coordinates[0]
  const pts = ring.slice(0, ring.length - 1)
  const [sx, sy] = pts.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0])
  return [sx / pts.length, sy / pts.length]
}

export async function findOpportunities(
  query: ProspectingQuery,
): Promise<ProspectingResult> {
  const segment = getSegment(query.segmentSlug)
  if (!segment) {
    throw new Error(`Segmento desconhecido: ${query.segmentSlug}`)
  }

  const candidates = await companyRepository.findByCnaes(
    segment.cnaes.map((c) => c.code),
  )

  let inArea: Company[] = []
  let areaKm2: number | null = null
  let reference: [number, number] | null = null // [lng, lat]

  if (query.areaMode === 'polygon' && query.polygon) {
    const poly = turfPolygon(query.polygon.coordinates)
    inArea = candidates.filter((c) =>
      booleanPointInPolygon(
        point([c.endereco.longitude, c.endereco.latitude]),
        poly,
      ),
    )
    areaKm2 = area(poly) / 1_000_000
    reference = polygonCentroid(query.polygon)
  } else if (query.areaMode === 'radius' && query.center && query.radiusKm) {
    const center = point([query.center.longitude, query.center.latitude])
    inArea = candidates.filter(
      (c) =>
        distance(center, point([c.endereco.longitude, c.endereco.latitude]), {
          units: 'kilometers',
        }) <= query.radiusKm!,
    )
    areaKm2 = Math.PI * query.radiusKm * query.radiusKm
    reference = [query.center.longitude, query.center.latitude]
  }

  let results = inArea
  if (query.onlyActive) {
    results = results.filter((c) => c.situacao === 'ATIVA')
  }

  const withScore: CompanyWithScore[] = results.map((company) => {
    const opportunity = calculateOpportunityScore(company)
    const distanceKm = reference
      ? distance(
          point(reference),
          point([company.endereco.longitude, company.endereco.latitude]),
          { units: 'kilometers' },
        )
      : undefined
    return {
      ...company,
      opportunity,
      distanceKm,
      isNew: isRecentlyDiscovered(company),
    }
  })

  withScore.sort((a, b) => b.opportunity.score - a.opportunity.score)

  return {
    companies: withScore,
    areaKm2,
    searchedAt: new Date().toISOString(),
  }
}

export type SortOption = 'score' | 'recent' | 'nearest' | 'oldest'

export function sortResults(
  companies: CompanyWithScore[],
  by: SortOption,
): CompanyWithScore[] {
  const sorted = [...companies]
  switch (by) {
    case 'score':
      sorted.sort((a, b) => b.opportunity.score - a.opportunity.score)
      break
    case 'recent':
      sorted.sort(
        (a, b) =>
          new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime(),
      )
      break
    case 'nearest':
      sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      break
    case 'oldest':
      sorted.sort(
        (a, b) =>
          new Date(a.dataAbertura).getTime() - new Date(b.dataAbertura).getTime(),
      )
      break
  }
  return sorted
}
