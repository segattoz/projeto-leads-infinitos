import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Building2, Copy, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useRadarStore } from '@/store/useRadarStore'
import { useIcpStore } from '@/store/useIcpStore'
import { useCompanyStore } from '@/store/useCompanyStore'
import { formatDateTime } from '@/lib/utils'
import { RADAR_STATUS_BADGE } from '@/components/radar/radarStatusMeta'
import type { RadarJobItemOutcome } from '@/types'

const OUTCOME_META: Record<RadarJobItemOutcome, { label: string; icon: typeof Plus; className: string }> = {
  new: { label: 'Nova', icon: Plus, className: 'text-success-strong' },
  duplicate: { label: 'Duplicata', icon: Copy, className: 'text-muted' },
  possible_duplicate: { label: 'Possível duplicata', icon: Search, className: 'text-warn-strong' },
  error: { label: 'Erro', icon: AlertCircle, className: 'text-danger' },
}

/** Detalhe de uma execução do Radar. */
export function RadarJobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const job = useRadarStore((s) => s.jobs.find((j) => j.id === jobId))
  const icp = useIcpStore((s) => s.icps.find((i) => i.id === job?.icpId))
  const companies = useCompanyStore((s) => s.companies)

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState icon={Search} title="Execução não encontrada" description="Esta execução do Radar não existe ou foi removida." />
      </div>
    )
  }

  const durationMs = job.finishedAt ? new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime() : null
  const durationLabel = durationMs !== null ? `${(durationMs / 1000).toFixed(1)}s` : 'em andamento'

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/radar')} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-ink">Execução do Radar</h1>
          <p className="mt-1 text-sm text-muted">
            {icp?.name ?? '—'} · {job.sourceName} · {formatDateTime(job.createdAt)}
          </p>
        </div>
      </div>

      {job.status === 'failed' && (
        <Card className="border-danger/30 bg-danger-dim p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-danger">
            <AlertCircle className="h-4 w-4" /> A execução do Radar foi interrompida.
          </p>
          <p className="mt-1 text-xs text-danger">
            {job.items.filter((i) => i.outcome !== 'error').length} de {job.items.length} empresas foram processadas.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Encontradas', value: job.counts.found },
          { label: 'Novas', value: job.counts.new, cls: 'text-success-strong' },
          { label: 'Duplicadas', value: job.counts.duplicates },
          { label: 'Possíveis dup.', value: job.counts.possibleDuplicates, cls: 'text-warn-strong' },
          { label: 'Erros', value: job.counts.errors, cls: 'text-danger' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-faint">{stat.label}</p>
            <p className={`mt-1 font-mono text-2xl font-bold ${stat.cls ?? 'text-ink'}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span>Duração: <span className="font-mono text-ink">{durationLabel}</span></span>
        <span>Território: <span className="text-ink">{job.territory.city}/{job.territory.state}</span></span>
      </div>

      <Card>
        <CardContent className="p-0">
          {job.items.length === 0 ? (
            <EmptyState icon={Building2} title="Nenhum item processado" className="border-0" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                    <th className="px-4 py-3 font-semibold">Empresa</th>
                    <th className="px-3 py-3 font-semibold">Resultado</th>
                    <th className="px-3 py-3 font-semibold">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {job.items.map((item) => {
                    const meta = OUTCOME_META[item.outcome]
                    const Icon = meta.icon
                    const company = item.companyId ? companies.find((c) => c.id === item.companyId) : undefined
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-line/60 last:border-0 ${company ? 'cursor-pointer hover:bg-surface-2' : ''}`}
                        onClick={() => company && navigate('/app/empresas')}
                      >
                        <td className="px-4 py-2.5 font-medium text-ink">{item.rawName}</td>
                        <td className={`px-3 py-2.5 ${meta.className}`}>
                          <span className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" /> {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted">{item.detail}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Badge variant={RADAR_STATUS_BADGE[job.status].variant}>Status: {RADAR_STATUS_BADGE[job.status].label}</Badge>
      </div>
    </div>
  )
}
