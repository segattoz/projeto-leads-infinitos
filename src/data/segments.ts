import type { Segment } from '@/types'

/**
 * Catálogo de segmentos comerciais.
 * Cada nicho agrupa um ou mais CNAEs oficiais — estrutura equivalente às
 * tabelas `segments` e `segment_cnaes` previstas para o PostgreSQL.
 */
export const SEGMENTS: Segment[] = [
  {
    id: 'seg-01',
    slug: 'oficinas-mecanicas',
    name: 'Oficinas Mecânicas',
    description: 'Manutenção e reparação de veículos automotores',
    cnaes: [
      { code: '4520-0/01', description: 'Manutenção e reparação mecânica de veículos' },
      { code: '4520-0/02', description: 'Lanternagem, funilaria e pintura de veículos' },
      { code: '4520-0/05', description: 'Reparação elétrica de veículos' },
    ],
  },
  {
    id: 'seg-02',
    slug: 'clinicas-odontologicas',
    name: 'Clínicas Odontológicas',
    description: 'Atividades odontológicas',
    cnaes: [{ code: '8630-5/04', description: 'Atividade odontológica' }],
  },
  {
    id: 'seg-03',
    slug: 'advocacia',
    name: 'Escritórios de Advocacia',
    description: 'Serviços advocatícios',
    cnaes: [{ code: '6911-7/01', description: 'Serviços advocatícios' }],
  },
  {
    id: 'seg-04',
    slug: 'contabilidades',
    name: 'Contabilidades',
    description: 'Atividades de contabilidade',
    cnaes: [{ code: '6920-6/01', description: 'Atividades de contabilidade' }],
  },
  {
    id: 'seg-05',
    slug: 'restaurantes',
    name: 'Restaurantes',
    description: 'Restaurantes e similares',
    cnaes: [{ code: '5611-2/01', description: 'Restaurantes e similares' }],
  },
  {
    id: 'seg-06',
    slug: 'academias',
    name: 'Academias',
    description: 'Atividades de condicionamento físico',
    cnaes: [{ code: '9313-1/00', description: 'Atividades de condicionamento físico' }],
  },
  {
    id: 'seg-07',
    slug: 'pet-shops',
    name: 'Pet Shops',
    description: 'Comércio e serviços para animais de estimação',
    cnaes: [
      { code: '4789-0/04', description: 'Comércio de artigos e alimentos para animais' },
      { code: '9609-2/08', description: 'Higiene e embelezamento de animais domésticos' },
    ],
  },
  {
    id: 'seg-08',
    slug: 'imobiliarias',
    name: 'Imobiliárias',
    description: 'Corretagem e administração de imóveis',
    cnaes: [
      { code: '6821-8/01', description: 'Corretagem na compra, venda e avaliação de imóveis' },
      { code: '6822-6/00', description: 'Gestão e administração da propriedade imobiliária' },
    ],
  },
  {
    id: 'seg-09',
    slug: 'clinicas-veterinarias',
    name: 'Clínicas Veterinárias',
    description: 'Atividades veterinárias',
    cnaes: [{ code: '7500-1/00', description: 'Atividades veterinárias' }],
  },
  {
    id: 'seg-10',
    slug: 'farmacias',
    name: 'Farmácias',
    description: 'Comércio varejista de produtos farmacêuticos',
    cnaes: [{ code: '4771-7/01', description: 'Comércio varejista de produtos farmacêuticos' }],
  },
]

export function getSegment(slug: string): Segment | undefined {
  return SEGMENTS.find((s) => s.slug === slug)
}
