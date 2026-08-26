import type { RadarSourceResult } from '@/types'
import orgAPool from '@/data/companies.seed.orga.json'
import orgBPool from '@/data/companies.seed.orgb.json'

/**
 * Pool de empresas "descobríveis" por organização — simula uma fatia dos
 * Dados Abertos do CNPJ da Receita Federal. O Radar consulta este pool
 * (via `SeedDatabaseSourceAdapter`); as empresas só entram na tabela
 * `companies` da organização quando um job do Radar realmente as encontra.
 *
 * Contrato equivalente ao que uma fonte real (API paga, scraping autorizado
 * de dados públicos etc.) precisaria implementar: `RadarSourceAdapter`
 * (ver src/services/radarService.ts) — trocar a fonte não muda o restante
 * do pipeline.
 */

interface PoolItem extends RadarSourceResult {
  id: string
}

const POOLS: Record<string, { items: PoolItem[]; anchorCount: number; city: string; state: string }> = {
  'org-a': { items: orgAPool.companies as PoolItem[], anchorCount: 8, city: orgAPool.city, state: orgAPool.state },
  'org-b': { items: orgBPool.companies as PoolItem[], anchorCount: 3, city: orgBPool.city, state: orgBPool.state },
}

/** Reancora as datas do pool em relação a hoje (mesma lógica do app anterior). */
function shiftDiscoveredAt<T extends { discoveredAt: string }>(items: T[], generatedAt: string): T[] {
  const shift = Date.now() - new Date(generatedAt).getTime()
  return items.map((item) => ({
    ...item,
    discoveredAt: new Date(new Date(item.discoveredAt).getTime() + shift).toISOString(),
  }))
}

const ORG_A_ITEMS = shiftDiscoveredAt(POOLS['org-a'].items, orgAPool.generatedAt)
const ORG_B_ITEMS = shiftDiscoveredAt(POOLS['org-b'].items, orgBPool.generatedAt)

function itemsForOrg(organizationId: string): PoolItem[] {
  if (organizationId === 'org-a') return ORG_A_ITEMS
  if (organizationId === 'org-b') return ORG_B_ITEMS
  return []
}

/** As primeiras N empresas do pool servem de "já descobertas" para popular a demo. */
export function anchorPoolItems(organizationId: string): PoolItem[] {
  const config = POOLS[organizationId]
  if (!config) return []
  return itemsForOrg(organizationId).slice(0, config.anchorCount)
}

export function restOfPool(organizationId: string): PoolItem[] {
  const config = POOLS[organizationId]
  if (!config) return []
  return itemsForOrg(organizationId).slice(config.anchorCount)
}

export function poolCenter(organizationId: string): { latitude: number; longitude: number } | null {
  if (organizationId === 'org-a') return orgAPool.center
  if (organizationId === 'org-b') return orgBPool.center
  return null
}

export type { PoolItem }
