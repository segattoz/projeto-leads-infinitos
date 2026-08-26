import type { Icp } from '@/types'
import { DEFAULT_SCORE_WEIGHTS } from '@/types'
import { createIcp } from '@/services/icpService'
import { SEGMENT_PRESETS } from '@/data/segments'

// Polígono aproximado da região central de Uberlândia (GeoJSON [lng, lat]).
const UBERLANDIA_CENTRO: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-48.295, -18.905],
      [-48.262, -18.9],
      [-48.255, -18.925],
      [-48.278, -18.935],
      [-48.298, -18.926],
      [-48.295, -18.905],
    ],
  ],
}

const RIBEIRAO_PRETO_CENTRO: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-47.83, -21.16],
      [-47.79, -21.155],
      [-47.785, -21.19],
      [-47.815, -21.2],
      [-47.835, -21.185],
      [-47.83, -21.16],
    ],
  ],
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString()
}

function seedIcp(
  organizationId: string,
  name: string,
  description: string,
  segmentSlug: string,
  territoryPolygon: GeoJSON.Polygon,
  city: string,
  state: string,
  createdDaysAgo: number,
): Icp {
  const preset = SEGMENT_PRESETS.find((s) => s.slug === segmentSlug)
  const icp = createIcp(organizationId, {
    name,
    description,
    productService: description,
    cnaes: preset?.cnaes ?? [],
    portes: [],
    keywords: [],
    positiveCriteria: [],
    negativeCriteria: [],
    territory: { city, state, areaMode: 'polygon', polygon: territoryPolygon },
    weights: DEFAULT_SCORE_WEIGHTS,
  })
  const createdAt = daysAgo(createdDaysAgo)
  return { ...icp, createdAt, updatedAt: createdAt, versions: icp.versions.map((v) => ({ ...v, createdAt })) }
}

export function buildDemoIcps(): Icp[] {
  return [
    seedIcp(
      'org-a',
      'Oficinas Mecânicas — Uberlândia',
      'Prospecção de oficinas mecânicas na região central de Uberlândia para venda de software de gestão.',
      'oficinas-mecanicas',
      UBERLANDIA_CENTRO,
      'Uberlândia',
      'MG',
      45,
    ),
    seedIcp(
      'org-a',
      'Clínicas Odontológicas — Uberlândia',
      'Consultórios e clínicas odontológicas com potencial para adoção de sistema de agendamento.',
      'clinicas-odontologicas',
      UBERLANDIA_CENTRO,
      'Uberlândia',
      'MG',
      30,
    ),
    seedIcp(
      'org-b',
      'Oficinas Mecânicas — Ribeirão Preto',
      'Prospecção de oficinas mecânicas na região central de Ribeirão Preto.',
      'oficinas-mecanicas',
      RIBEIRAO_PRETO_CENTRO,
      'Ribeirão Preto',
      'SP',
      20,
    ),
  ]
}
