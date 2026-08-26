import type { RadarJob } from '@/types'

export const RADAR_STATUS_BADGE: Record<
  RadarJob['status'],
  { label: string; variant: 'default' | 'success' | 'danger' | 'warn' | 'outline' }
> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  running: { label: 'Em execução', variant: 'warn' },
  partial: { label: 'Parcial', variant: 'warn' },
  completed: { label: 'Concluído', variant: 'success' },
  failed: { label: 'Falhou', variant: 'danger' },
  cancelled: { label: 'Cancelado', variant: 'default' },
}
