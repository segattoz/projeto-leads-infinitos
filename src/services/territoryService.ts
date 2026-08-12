import type { Territory } from '@/types'

/**
 * Territórios monitorados da demonstração.
 * Em produção, correspondem à tabela `territories` (geometry armazenada como
 * geography(Polygon, 4326)) com atualização periódica a partir da base oficial.
 */

// Polígono aproximado da região central de Uberlândia (formato GeoJSON [lng, lat]).
const CENTRO_POLYGON: GeoJSON.Polygon = {
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

export function buildDemoTerritories(): Territory[] {
  const today = new Date()
  const at8am = new Date(today)
  at8am.setHours(8, 0, 0, 0)

  const daysAgo = (d: number) =>
    new Date(Date.now() - d * 86_400_000).toISOString()

  return [
    {
      id: 'ter-demo-01',
      name: 'Oficinas — Uberlândia',
      city: 'Uberlândia',
      state: 'MG',
      segmentSlug: 'oficinas-mecanicas',
      geometry: CENTRO_POLYGON,
      companiesCount: 84,
      newCompaniesCount: 7,
      active: true,
      lastUpdatedAt: at8am.toISOString(),
      createdAt: daysAgo(45),
    },
    {
      id: 'ter-demo-02',
      name: 'Clínicas Odontológicas — Uberlândia',
      city: 'Uberlândia',
      state: 'MG',
      segmentSlug: 'clinicas-odontologicas',
      geometry: null,
      companiesCount: 63,
      newCompaniesCount: 4,
      active: true,
      lastUpdatedAt: at8am.toISOString(),
      createdAt: daysAgo(30),
    },
    {
      id: 'ter-demo-03',
      name: 'Escritórios de Advocacia — Uberlândia',
      city: 'Uberlândia',
      state: 'MG',
      segmentSlug: 'advocacia',
      geometry: null,
      companiesCount: 100,
      newCompaniesCount: 7,
      active: true,
      lastUpdatedAt: at8am.toISOString(),
      createdAt: daysAgo(21),
    },
  ]
}
