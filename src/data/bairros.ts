/** Pontos de referência de bairros de Uberlândia usados na busca por raio. */
export interface BairroReference {
  nome: string
  latitude: number
  longitude: number
}

export const BAIRROS: BairroReference[] = [
  { nome: 'Centro', latitude: -18.9186, longitude: -48.2772 },
  { nome: 'Fundinho', latitude: -18.9231, longitude: -48.2799 },
  { nome: 'Martins', latitude: -18.9089, longitude: -48.2869 },
  { nome: 'Osvaldo Rezende', latitude: -18.9053, longitude: -48.2758 },
  { nome: 'Brasil', latitude: -18.9022, longitude: -48.265 },
  { nome: 'Umuarama', latitude: -18.8869, longitude: -48.2597 },
  { nome: 'Santa Mônica', latitude: -18.9377, longitude: -48.2436 },
  { nome: 'Segismundo Pereira', latitude: -18.945, longitude: -48.228 },
  { nome: 'Tibery', latitude: -18.9048, longitude: -48.2409 },
  { nome: 'Saraiva', latitude: -18.937, longitude: -48.268 },
  { nome: 'Lídice', latitude: -18.928, longitude: -48.272 },
  { nome: 'Tabajaras', latitude: -18.913, longitude: -48.265 },
  { nome: 'Daniel Fonseca', latitude: -18.904, longitude: -48.295 },
  { nome: 'Luizote de Freitas', latitude: -18.908, longitude: -48.325 },
  { nome: 'Planalto', latitude: -18.895, longitude: -48.315 },
  { nome: 'Jardim Karaíba', latitude: -18.96, longitude: -48.26 },
  { nome: 'Granada', latitude: -18.955, longitude: -48.28 },
  { nome: 'Cazeca', latitude: -18.926, longitude: -48.265 },
  { nome: 'Custódio Pereira', latitude: -18.895, longitude: -48.235 },
  { nome: 'Tubalina', latitude: -18.935, longitude: -48.295 },
]

export const UBERLANDIA_CENTER: [number, number] = [-18.9186, -48.2772]
