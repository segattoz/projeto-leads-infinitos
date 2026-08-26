import type { ReactNode } from 'react'
import { MapPin, Radar as RadarIcon, Sparkles } from 'lucide-react'
import type { Company, Icp, RadarJob } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentVersion } from '@/services/icpService'
import { isRecentlyDiscovered } from '@/services/companyService'
import { formatRelative } from '@/lib/utils'

interface IcpMonitorCardProps {
  icp: Icp
  companies: Company[]
  radarJobs: RadarJob[]
  onClick?: () => void
  footer?: ReactNode
}

/** Card de ICP monitorado — usado na Visão Geral e na landing do Radar. */
export function IcpMonitorCard({ icp, companies, radarJobs, onClick, footer }: IcpMonitorCardProps) {
  const version = getCurrentVersion(icp)
  const icpCompanies = companies.filter((c) => c.icpId === icp.id)
  const newCompanies = icpCompanies.filter((c) => isRecentlyDiscovered(c))
  const jobs = radarJobs.filter((j) => j.icpId === icp.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const lastJob = jobs[0]

  return (
    <Card
      className={`p-5 transition-all ${onClick ? 'cursor-pointer hover:border-primary/40 hover:bg-surface-2' : ''} ${icp.status !== 'active' ? 'opacity-60' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && e.key === 'Enter') onClick()
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">{icp.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
            <MapPin className="h-3 w-3" />
            {version.territory?.city ?? 'Sem território'}/{version.territory?.state ?? '—'}
          </p>
        </div>
        <Badge variant="outline">v{version.version}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-2xl font-bold tabular-nums text-ink">{icpCompanies.length}</p>
          <p className="text-[11px] text-faint">empresas</p>
        </div>
        {newCompanies.length > 0 && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-success-strong">
            <Sparkles className="h-3 w-3" />
            {newCompanies.length} novas
          </p>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
        <RadarIcon className="h-3 w-3" />
        {lastJob ? `Última execução ${formatRelative(lastJob.createdAt)}` : 'Nenhuma execução ainda'}
      </p>

      {footer}
    </Card>
  )
}
