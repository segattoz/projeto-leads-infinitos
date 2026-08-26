import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, History, Save } from 'lucide-react'
import type { Porte, ScoreWeights, Territory } from '@/types'
import { SCORE_GROUP_LABELS, DEFAULT_SCORE_WEIGHTS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { TagInput } from '@/components/ui/tag-input'
import { Badge } from '@/components/ui/badge'
import { TerritoryEditor } from '@/components/icp/TerritoryEditor'
import { SEGMENT_PRESETS } from '@/data/segments'
import { getCurrentVersion, weightsSum } from '@/services/icpService'
import { useIcpStore } from '@/store/useIcpStore'
import { useOrganizationStore } from '@/store/useOrganizationStore'
import { getOrganization } from '@/data/organizations'

const PORTE_OPTIONS: Porte[] = ['MEI', 'ME', 'EPP', 'DEMAIS']

/** Editor de ICP — criação e edição com versionamento. */
export function IcpEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const orgId = useOrganizationStore((s) => s.activeOrganizationId)
  const org = getOrganization(orgId)
  const icps = useIcpStore((s) => s.icps)
  const createIcp = useIcpStore((s) => s.createIcp)
  const updateIcpMeta = useIcpStore((s) => s.updateIcpMeta)
  const publishVersion = useIcpStore((s) => s.publishVersion)

  const existing = id ? icps.find((i) => i.id === id) : undefined
  const existingVersion = existing ? getCurrentVersion(existing) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [productService, setProductService] = useState(existing?.productService ?? '')
  const [selectedCnaes, setSelectedCnaes] = useState<{ code: string; description: string }[]>(
    existingVersion?.cnaes ?? [],
  )
  const [portes, setPortes] = useState<Porte[]>(existingVersion?.portes ?? [])
  const [keywords, setKeywords] = useState<string[]>(existingVersion?.keywords ?? [])
  const [positiveCriteria, setPositiveCriteria] = useState<string[]>(existingVersion?.positiveCriteria ?? [])
  const [negativeCriteria, setNegativeCriteria] = useState<string[]>(existingVersion?.negativeCriteria ?? [])
  const [territory, setTerritory] = useState<Territory | null>(
    existingVersion?.territory ??
      (org ? { city: org.city, state: org.state, areaMode: 'polygon' } : null),
  )
  const [weights, setWeights] = useState<ScoreWeights>(existingVersion?.weights ?? DEFAULT_SCORE_WEIGHTS)

  const defaultCenter = useMemo<[number, number]>(() => {
    if (orgId === 'org-b') return [-21.1775, -47.8103]
    return [-18.9186, -48.2772]
  }, [orgId])

  const sum = weightsSum(weights)
  const weightsValid = sum === 100

  const toggleCnae = (preset: (typeof SEGMENT_PRESETS)[number]) => {
    setSelectedCnaes((prev) => {
      const exists = prev.some((c) => preset.cnaes.some((pc) => pc.code === c.code))
      if (exists) return prev.filter((c) => !preset.cnaes.some((pc) => pc.code === c.code))
      return [...prev, ...preset.cnaes]
    })
  }

  const togglePorte = (porte: Porte) => {
    setPortes((prev) => (prev.includes(porte) ? prev.filter((p) => p !== porte) : [...prev, porte]))
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Dê um nome ao ICP antes de salvar.')
      return
    }
    if (!weightsValid) {
      toast.error(`Os pesos precisam somar 100% (atual: ${sum}%).`)
      return
    }

    const versionInput = { cnaes: selectedCnaes, portes, keywords, positiveCriteria, negativeCriteria, territory, weights }

    if (existing) {
      updateIcpMeta(existing.id, { name, description, productService })
      publishVersion(existing.id, versionInput)
      toast.success(`Nova versão publicada para "${name}".`)
      navigate('/app/icps')
    } else {
      createIcp(orgId, { name, description, productService, ...versionInput })
      toast.success(`ICP "${name}" criado.`)
      navigate('/app/icps')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/icps')} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-ink">{existing ? `Editar ${existing.name}` : 'Novo ICP'}</h1>
          <p className="mt-1 text-sm text-muted">
            {existing
              ? 'Alterações criam uma nova versão — scores já calculados continuam explicáveis pela versão anterior.'
              : 'Defina quem é o cliente ideal para este produto ou serviço.'}
          </p>
        </div>
      </div>

      {existing && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <History className="h-3.5 w-3.5" />
            Versão atual: <Badge variant="outline">v{existingVersion?.version}</Badge>
            <span>· {existing.versions.length} {existing.versions.length === 1 ? 'versão' : 'versões'} no histórico</span>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="icp-name">
              Nome do ICP
            </label>
            <Input id="icp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Oficinas Mecânicas — Uberlândia" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="icp-desc">
              Descrição
            </label>
            <Textarea id="icp-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que serve este ICP?" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="icp-product">
              Produto / serviço vendido
            </label>
            <Input id="icp-product" value={productService} onChange={(e) => setProductService(e.target.value)} placeholder="Ex.: Software de gestão para oficinas" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segmentos e CNAEs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted">Sugestões de segmento — ajuste livremente os CNAEs incluídos.</p>
          <div className="flex flex-wrap gap-2">
            {SEGMENT_PRESETS.map((preset) => {
              const active = preset.cnaes.some((pc) => selectedCnaes.some((c) => c.code === pc.code))
              return (
                <button
                  key={preset.slug}
                  type="button"
                  onClick={() => toggleCnae(preset)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'border-primary bg-primary-dim text-primary-strong' : 'border-line-strong text-muted hover:text-ink'
                  }`}
                >
                  {preset.name}
                </button>
              )
            })}
          </div>
          {selectedCnaes.length > 0 && (
            <p className="font-mono text-[11px] text-faint">
              CNAEs selecionados: {selectedCnaes.map((c) => c.code).join(', ')}
            </p>
          )}

          <div className="pt-2">
            <p className="mb-1.5 text-xs font-medium text-muted">Porte (opcional — vazio = qualquer porte)</p>
            <div className="flex flex-wrap gap-3">
              {PORTE_OPTIONS.map((porte) => (
                <Checkbox key={porte} checked={portes.includes(porte)} onChange={() => togglePorte(porte)} label={porte} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critérios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Palavras-chave</p>
            <TagInput value={keywords} onChange={setKeywords} placeholder="Digite e pressione Enter..." />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Critérios positivos</p>
            <TagInput value={positiveCriteria} onChange={setPositiveCriteria} placeholder="Ex.: possui frota própria" tagClassName="border-success/30 bg-success-dim text-success-strong" />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Critérios negativos</p>
            <TagInput value={negativeCriteria} onChange={setNegativeCriteria} placeholder="Ex.: franquia" tagClassName="border-danger/30 bg-danger-dim text-danger" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Território</CardTitle>
        </CardHeader>
        <CardContent>
          <TerritoryEditor value={territory} onChange={setTerritory} defaultCenter={defaultCenter} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pesos do score</span>
            <span className={`font-mono text-xs ${weightsValid ? 'text-success-strong' : 'text-danger'}`}>{sum}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(weights) as (keyof ScoreWeights)[]).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-52 shrink-0 text-xs text-ink">{SCORE_GROUP_LABELS[key]}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full accent-[var(--color-primary)]"
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs text-muted">{weights[key]}</span>
            </div>
          ))}
          {!weightsValid && (
            <p className="text-[11px] text-danger">Os pesos devem somar exatamente 100% para salvar.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate('/app/icps')}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <Save className="h-4 w-4" /> {existing ? 'Publicar nova versão' : 'Criar ICP'}
        </Button>
      </div>
    </div>
  )
}
