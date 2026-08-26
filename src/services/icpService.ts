import type { Icp, IcpVersion, ScoreWeights, Territory } from '@/types'
import { DEFAULT_SCORE_WEIGHTS } from '@/types'

/** Regras de criação e versionamento de ICPs (Ideal Customer Profile). */

let seq = 1
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${seq++}`
}

export interface IcpVersionInput {
  cnaes: { code: string; description: string }[]
  portes: IcpVersion['portes']
  keywords: string[]
  positiveCriteria: string[]
  negativeCriteria: string[]
  territory: Territory | null
  weights: ScoreWeights
}

export function getCurrentVersion(icp: Icp): IcpVersion {
  const version = icp.versions.find((v) => v.id === icp.currentVersionId)
  if (!version) throw new Error(`ICP ${icp.id} sem versão atual válida`)
  return version
}

export function createIcp(
  organizationId: string,
  input: { name: string; description: string; productService: string } & Partial<IcpVersionInput>,
): Icp {
  const now = new Date().toISOString()
  const icpId = nextId('icp')
  const version: IcpVersion = {
    id: nextId('icpv'),
    icpId,
    version: 1,
    cnaes: input.cnaes ?? [],
    portes: input.portes ?? [],
    keywords: input.keywords ?? [],
    positiveCriteria: input.positiveCriteria ?? [],
    negativeCriteria: input.negativeCriteria ?? [],
    territory: input.territory ?? null,
    weights: input.weights ?? DEFAULT_SCORE_WEIGHTS,
    createdAt: now,
  }
  return {
    id: icpId,
    organizationId,
    name: input.name,
    description: input.description,
    productService: input.productService,
    status: 'active',
    currentVersionId: version.id,
    versions: [version],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Publica uma nova versão do ICP preservando as anteriores imutáveis —
 * scores já calculados continuam referenciando a versão em que foram
 * gerados (`icpVersionId`), mesmo depois desta publicação.
 */
export function publishNewVersion(icp: Icp, changes: Partial<IcpVersionInput>): Icp {
  const current = getCurrentVersion(icp)
  const now = new Date().toISOString()
  const version: IcpVersion = {
    id: nextId('icpv'),
    icpId: icp.id,
    version: current.version + 1,
    cnaes: changes.cnaes ?? current.cnaes,
    portes: changes.portes ?? current.portes,
    keywords: changes.keywords ?? current.keywords,
    positiveCriteria: changes.positiveCriteria ?? current.positiveCriteria,
    negativeCriteria: changes.negativeCriteria ?? current.negativeCriteria,
    territory: changes.territory ?? current.territory,
    weights: changes.weights ?? current.weights,
    createdAt: now,
  }
  return {
    ...icp,
    currentVersionId: version.id,
    versions: [...icp.versions, version],
    updatedAt: now,
  }
}

export function weightsSum(weights: ScoreWeights): number {
  return Object.values(weights).reduce((s, v) => s + v, 0)
}
