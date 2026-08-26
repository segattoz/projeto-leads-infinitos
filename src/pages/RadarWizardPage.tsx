import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Database, FileUp, Radar as RadarIcon, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { RadarJobProgress } from '@/components/radar/RadarJobProgress'
import { TerritoryMap } from '@/components/map/TerritoryMap'
import { getCurrentVersion } from '@/services/icpService'
import { CSV_IMPORT_COLUMNS } from '@/services/radarService'
import { useIcpStore, icpsForOrg } from '@/store/useIcpStore'
import { useRadarStore } from '@/store/useRadarStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'
import { getOrganization } from '@/data/organizations'
import { cn } from '@/lib/utils'
import type { DataSourceType } from '@/types'

const STEPS = ['Objetivo', 'Território', 'Critérios', 'Fonte', 'Executar']
const MIN_RUN_MS = 1300

export function RadarWizardPage() {
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const org = getOrganization(orgId)
  const icps = icpsForOrg(useIcpStore((s) => s.icps), orgId)
  const runJob = useRadarStore((s) => s.runJob)

  const [step, setStep] = useState(0)
  const [icpId, setIcpId] = useState<string | null>(icps[0]?.id ?? null)
  const [sourceType, setSourceType] = useState<DataSourceType>('seed_database')
  const [csvText, setCsvText] = useState('')
  const [csvFileName, setCsvFileName] = useState('')
  const [running, setRunning] = useState(false)

  const icp = icps.find((i) => i.id === icpId)
  const version = icp ? getCurrentVersion(icp) : undefined

  const defaultCenter = useMemo<[number, number]>(() => {
    if (orgId === 'org-b') return [-21.1775, -47.8103]
    return [-18.9186, -48.2772]
  }, [orgId])

  if (icps.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={Target}
          title="Você precisa de um ICP para executar o Radar"
          description="Crie um ICP com território e critérios antes de rodar sua primeira busca."
          action={
            <Button variant="primary" onClick={() => navigate('/app/icps/novo')}>
              Criar ICP
            </Button>
          }
        />
      </div>
    )
  }

  const canAdvance = () => {
    if (step === 0) return !!icpId
    if (step === 3) return sourceType === 'seed_database' || (sourceType === 'csv_import' && csvText.trim().length > 0)
    return true
  }

  const handleExecute = async () => {
    if (!icp || !version) return
    setRunning(true)
    try {
      const [job] = await Promise.all([
        runJob({
          organizationId: orgId,
          icp,
          icpVersion: version,
          territory: version.territory ?? { city: org?.city ?? '', state: org?.state ?? '', areaMode: 'polygon' },
          sourceType,
          csvText: sourceType === 'csv_import' ? csvText : undefined,
          createdBy: 'Você',
        }),
        new Promise((resolve) => setTimeout(resolve, MIN_RUN_MS)),
      ])
      toast.success(`Radar concluído: ${job.counts.new} novas empresas encontradas.`)
      navigate(`/app/radar/${job.id}`)
    } catch {
      toast.error('Não foi possível concluir a execução do Radar.')
      setRunning(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/radar')} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-ink">Novo Radar</h1>
          <p className="mt-1 text-sm text-muted">Configure e execute uma busca de mercado.</p>
        </div>
      </div>

      {/* Indicador de etapas */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                i < step ? 'bg-success text-on-brand' : i === step ? 'bg-primary text-on-brand' : 'bg-surface-3 text-faint',
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn('hidden text-[11px] font-medium sm:inline', i === step ? 'text-ink' : 'text-faint')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-line" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Qual ICP este Radar deve procurar?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {icps.map((option) => {
              const v = getCurrentVersion(option)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setIcpId(option.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                    icpId === option.id ? 'border-primary bg-primary-dim' : 'border-line hover:border-primary/40',
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">{option.name}</span>
                    <span className="block text-xs text-faint">
                      {v.territory?.city ?? 'Sem território'}/{v.territory?.state ?? '—'} · v{v.version}
                    </span>
                  </span>
                  {icpId === option.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              )
            })}
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/icps/novo')}>
              + Criar novo ICP
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && version && (
        <Card>
          <CardHeader>
            <CardTitle>Território configurado no ICP</CardTitle>
          </CardHeader>
          <CardContent>
            {version.territory ? (
              <>
                <p className="mb-3 text-xs text-muted">
                  {version.territory.city}/{version.territory.state} — para alterar a área, edite o ICP.
                </p>
                <div className="h-64 overflow-hidden rounded-lg border border-line">
                  <TerritoryMap
                    center={defaultCenter}
                    drawing={false}
                    drawPoints={[]}
                    onAddDrawPoint={() => {}}
                    onClosePolygon={() => {}}
                    closedPolygon={
                      version.territory.polygon
                        ? version.territory.polygon.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }))
                        : null
                    }
                    radiusPreview={
                      version.territory.areaMode === 'radius' && version.territory.center && version.territory.radiusKm
                        ? { center: [version.territory.center.latitude, version.territory.center.longitude], radiusKm: version.territory.radiusKm }
                        : null
                    }
                  />
                </div>
              </>
            ) : (
              <EmptyState icon={Target} title="Este ICP não tem território definido" description="Edite o ICP para adicionar uma área antes de continuar." />
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && version && (
        <Card>
          <CardHeader>
            <CardTitle>Critérios configurados no ICP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted">CNAEs</p>
              <p className="font-mono text-xs text-ink">
                {version.cnaes.length > 0 ? version.cnaes.map((c) => c.code).join(', ') : 'Nenhum CNAE restrito (todos aceitos)'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted">Porte</p>
              <p className="text-xs text-ink">{version.portes.length > 0 ? version.portes.join(', ') : 'Qualquer porte'}</p>
            </div>
            {version.keywords.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted">Palavras-chave</p>
                <div className="flex flex-wrap gap-1.5">
                  {version.keywords.map((k) => (
                    <Badge key={k} variant="outline">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11px] text-faint">Para alterar critérios, edite o ICP — isso publica uma nova versão.</p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Fonte de dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              onClick={() => setSourceType('seed_database')}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                sourceType === 'seed_database' ? 'border-primary bg-primary-dim' : 'border-line hover:border-primary/40',
              )}
            >
              <Database className="h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-semibold text-ink">Base de dados monitorada</span>
                <span className="block text-xs text-faint">Consulta o pool de empresas ainda não descobertas pela organização</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('csv_import')}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                sourceType === 'csv_import' ? 'border-primary bg-primary-dim' : 'border-line hover:border-primary/40',
              )}
            >
              <FileUp className="h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-semibold text-ink">Importação CSV</span>
                <span className="block text-xs text-faint">Envie uma lista própria de empresas</span>
              </span>
            </button>

            {sourceType === 'csv_import' && (
              <div className="space-y-2 rounded-lg border border-line bg-surface-2 p-4">
                <p className="text-[11px] text-faint">
                  Colunas aceitas (cabeçalho obrigatório): <span className="font-mono">{CSV_IMPORT_COLUMNS.join(', ')}</span>
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setCsvFileName(file.name)
                    setCsvText(await file.text())
                  }}
                  className="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-on-brand"
                />
                {csvFileName && <p className="text-[11px] text-success-strong">Arquivo carregado: {csvFileName}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && icp && version && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-faint">ICP:</span> <span className="text-ink">{icp.name}</span></p>
            <p><span className="text-faint">Território:</span> <span className="text-ink">{version.territory?.city ?? '—'}/{version.territory?.state ?? '—'}</span></p>
            <p><span className="text-faint">Fonte:</span> <span className="text-ink">{sourceType === 'seed_database' ? 'Base de dados monitorada' : `Importação CSV (${csvFileName || 'arquivo carregado'})`}</span></p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pb-8">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canAdvance()}>
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="primary" onClick={handleExecute} disabled={running}>
            <RadarIcon className={cn('h-4 w-4', running && 'animate-spin')} /> Executar Radar
          </Button>
        )}
      </div>

      {running && <RadarJobProgress />}
    </div>
  )
}
