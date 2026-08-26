// ─────────────────────────────────────────────────────────────────────────────
// Gerador determinístico das bases de demonstração do i9 Radar.
//
// Produz DOIS datasets de empresas fictícias plausíveis — um por organização
// de demonstração (Empresa A / Empresa B), em cidades diferentes, para tornar
// o isolamento multiempresa demonstrável de forma concreta. Os CNPJs são
// fictícios (raízes aleatórias com dígitos verificadores calculados) e NÃO
// correspondem a empresas reais.
//
// Executar: npm run seed
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ANCHOR = new Date('2026-08-12T08:00:00-03:00')

// RNG determinístico (mulberry32) para gerar sempre a mesma base.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

// Catálogo completo de segmentos/CNAEs — cada organização usa um subconjunto.
const ALL_SEGMENTS = [
  {
    slug: 'oficinas-mecanicas',
    cnaes: [
      { code: '4520-0/01', description: 'Serviços de manutenção e reparação mecânica de veículos automotores' },
      { code: '4520-0/02', description: 'Serviços de lanternagem ou funilaria e pintura de veículos automotores' },
      { code: '4520-0/05', description: 'Serviços de reparação elétrica de veículos automotores' },
    ],
    names: (pick, chance, sobrenomes, regionais) => {
      const kind = pick(['Auto Center', 'Mecânica', 'Auto Mecânica', 'Oficina', 'Auto Service', 'Centro Automotivo'])
      const suffix = pick([...sobrenomes, ...regionais, 'do Povo', 'Express', 'Norte', 'Sul'])
      return `${kind} ${suffix}`
    },
    razaoSuffix: 'Serviços Automotivos',
    siteChance: 0.35,
  },
  {
    slug: 'clinicas-odontologicas',
    cnaes: [{ code: '8630-5/04', description: 'Atividade odontológica' }],
    names: (pick, _c, sobrenomes) => {
      const kind = pick(['Odonto', 'Clínica Odontológica', 'Ortodontia', 'Odontologia'])
      const suffix = pick(['Prime', 'Sorriso', 'Excellence', 'Vida', 'Center', 'Mais', ...sobrenomes.slice(0, 10)])
      return `${kind} ${suffix}`
    },
    razaoSuffix: 'Serviços Odontológicos',
    siteChance: 0.55,
  },
  {
    slug: 'advocacia',
    cnaes: [{ code: '6911-7/01', description: 'Serviços advocatícios' }],
    names: (pick, chance, sobrenomes) => {
      const a = pick(sobrenomes)
      let b = pick(sobrenomes)
      while (b === a) b = pick(sobrenomes)
      return chance(0.6) ? `Advocacia ${a} & ${b}` : `${a} ${b} Advogados Associados`
    },
    razaoSuffix: 'Sociedade de Advogados',
    siteChance: 0.6,
  },
  {
    slug: 'contabilidades',
    cnaes: [{ code: '6920-6/01', description: 'Atividades de contabilidade' }],
    names: (pick, _c, sobrenomes, regionais) => {
      const suffix = pick([...sobrenomes, ...regionais, 'Exata', 'Real', 'Central'])
      return `${pick(['Contabilidade', 'Escritório Contábil', 'Assessoria Contábil'])} ${suffix}`
    },
    razaoSuffix: 'Serviços Contábeis',
    siteChance: 0.5,
  },
  {
    slug: 'restaurantes',
    cnaes: [{ code: '5611-2/01', description: 'Restaurantes e similares' }],
    names: (pick, _c, _s, regionais) => {
      const kind = pick(['Restaurante', 'Cantina', 'Churrascaria', 'Bistrô', 'Grill'])
      const suffix = pick(['do Centro', 'da Praça', 'Sabor & Arte', ...regionais])
      return `${kind} ${suffix}`
    },
    razaoSuffix: 'Alimentação',
    siteChance: 0.3,
  },
  {
    slug: 'academias',
    cnaes: [{ code: '9313-1/00', description: 'Atividades de condicionamento físico' }],
    names: (pick, _c, _s, regionais) => {
      const suffix = pick(['Force', 'Prime', 'Vital', 'Power', 'Movement', 'Alta Performance', ...regionais])
      return `${pick(['Academia', 'Studio Fitness', 'CT'])} ${suffix}`
    },
    razaoSuffix: 'Atividades Esportivas',
    siteChance: 0.4,
  },
  {
    slug: 'pet-shops',
    cnaes: [
      { code: '4789-0/04', description: 'Comércio varejista de animais vivos e de artigos e alimentos para animais de estimação' },
      { code: '9609-2/08', description: 'Higiene e embelezamento de animais domésticos' },
    ],
    names: (pick, _c, sobrenomes) => {
      const kind = pick(['Pet Shop', 'Pet Center', 'Espaço Pet', 'Mundo Pet'])
      const suffix = pick(['Amigo Fiel', 'Vida Animal', 'Cão & Cia', ...sobrenomes.slice(0, 8)])
      return `${kind} ${suffix}`
    },
    razaoSuffix: 'Comércio de Produtos para Animais',
    siteChance: 0.3,
  },
  {
    slug: 'imobiliarias',
    cnaes: [
      { code: '6821-8/01', description: 'Corretagem na compra e venda e avaliação de imóveis' },
      { code: '6822-6/00', description: 'Gestão e administração da propriedade imobiliária' },
    ],
    names: (pick, _c, sobrenomes, regionais) => {
      const suffix = pick([...sobrenomes, ...regionais, 'Horizonte', 'Cidade Jardim'])
      return `${pick(['Imobiliária', 'Imóveis', 'Corretora'])} ${suffix}`
    },
    razaoSuffix: 'Negócios Imobiliários',
    siteChance: 0.65,
  },
  {
    slug: 'clinicas-veterinarias',
    cnaes: [{ code: '7500-1/00', description: 'Atividades veterinárias' }],
    names: (pick, _c, sobrenomes) => {
      const suffix = pick(['Bicho Saudável', 'Vet Care', 'Amor Animal', 'São Francisco', ...sobrenomes.slice(0, 8)])
      return `${pick(['Clínica Veterinária', 'Hospital Veterinário', 'Vet'])} ${suffix}`
    },
    razaoSuffix: 'Serviços Veterinários',
    siteChance: 0.45,
  },
  {
    slug: 'farmacias',
    cnaes: [{ code: '4771-7/01', description: 'Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas' }],
    names: (pick, _c, sobrenomes, regionais) => {
      const suffix = pick(['Popular', 'Central', 'Saúde', 'Bem Estar', ...sobrenomes.slice(0, 10), ...regionais])
      return `${pick(['Farmácia', 'Drogaria'])} ${suffix}`
    },
    razaoSuffix: 'Comércio de Medicamentos',
    siteChance: 0.35,
  },
]

const SOBRENOMES = [
  'Oliveira', 'Silva', 'Martins', 'Souza', 'Pereira', 'Ferreira', 'Almeida',
  'Ribeiro', 'Carvalho', 'Rezende', 'Nogueira', 'Barbosa', 'Cardoso', 'Teixeira',
  'Mendes', 'Rocha', 'Moraes', 'Freitas', 'Campos', 'Duarte',
]

function buildDataset(config) {
  const rand = mulberry32(config.seed)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const chance = (p) => rand() < p
  const between = (min, max) => min + rand() * (max - min)
  const intBetween = (min, max) => Math.floor(between(min, max + 1))

  function generateCnpj() {
    const digits = []
    for (let i = 0; i < 8; i++) digits.push(intBetween(0, 9))
    digits.push(0, 0, 0, 1)
    const calcDv = (nums) => {
      const weights =
        nums.length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0)
      const rest = sum % 11
      return rest < 2 ? 0 : 11 - rest
    }
    digits.push(calcDv(digits))
    digits.push(calcDv(digits))
    const s = digits.join('')
    return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`
  }
  function phone() {
    return `(${config.areaCode}) 3${intBetween(200, 259)}-${String(intBetween(1000, 9999)).padStart(4, '0')}`
  }
  function cellphone() {
    return `(${config.areaCode}) 9${intBetween(8100, 9999)}-${String(intBetween(1000, 9999)).padStart(4, '0')}`
  }
  const daysAgoIso = (days) => new Date(ANCHOR.getTime() - days * 86400000).toISOString()
  const dateOnly = (iso) => iso.slice(0, 10)

  const segments = ALL_SEGMENTS.filter((s) => config.segmentCounts[s.slug])
  const usedNames = new Set()
  const companies = []
  let seq = 1

  function buildCompany({ segment, nomeFantasia, bairro, opts = {} }) {
    const cnae = opts.cnae ?? pick(segment.cnaes)
    const jitter = () => between(-0.008, 0.008)
    const lat = opts.lat ?? bairro.lat + jitter()
    const lng = opts.lng ?? bairro.lng + jitter()

    const ageYears = opts.ageYears ?? between(0.2, 22)
    const openedDaysAgo = Math.round(ageYears * 365)
    const discoveredDaysAgo = opts.discoveredDaysAgo ?? (chance(0.14) ? intBetween(0, 6) : intBetween(10, 240))

    const justDiscovered = discoveredDaysAgo <= 6
    const hasPhone = opts.hasPhone ?? chance(0.78)
    const hasWhats = opts.hasWhats ?? (hasPhone ? chance(0.7) : chance(0.25))
    const hasSite = opts.hasSite ?? (justDiscovered ? false : chance(segment.siteChance))
    const hasEmail = opts.hasEmail ?? (justDiscovered ? false : chance(0.38))

    const slug = slugify(nomeFantasia)
    const razaoSocial = opts.razaoSocial ?? `${nomeFantasia.replace(/&/g, 'e')} ${segment.razaoSuffix} Ltda`

    const company = {
      id: `${config.idPrefix}-${String(seq++).padStart(3, '0')}`,
      cnpj: generateCnpj(),
      razaoSocial,
      nomeFantasia,
      cnaePrincipal: cnae.code,
      cnaeDescricao: cnae.description,
      cnaesSecundarios:
        segment.cnaes.length > 1 && chance(0.4)
          ? segment.cnaes.filter((c) => c.code !== cnae.code).map((c) => c.code)
          : undefined,
      situacao: opts.situacao ?? (chance(0.93) ? 'ATIVA' : 'INATIVA'),
      dataAbertura: opts.dataAbertura ?? dateOnly(daysAgoIso(openedDaysAgo)),
      porte: opts.porte ?? pick(['MEI', 'ME', 'ME', 'ME', 'EPP', 'EPP', 'DEMAIS']),
      matrizFilial: chance(0.92) ? 'MATRIZ' : 'FILIAL',
      telefone: hasPhone ? phone() : undefined,
      whatsapp: hasWhats ? cellphone() : undefined,
      email: hasEmail ? `contato@${slug}.com.br` : undefined,
      website: hasSite ? `https://www.${slug}.com.br` : undefined,
      endereco: {
        logradouro: opts.logradouro ?? pick(config.logradouros),
        numero: String(intBetween(50, 4800)),
        bairro: bairro.nome,
        cidade: config.city,
        uf: config.state,
        cep: bairro.cep,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      },
      discoveredAt: daysAgoIso(discoveredDaysAgo),
      segmentSlug: segment.slug,
    }
    companies.push(company)
    return company
  }

  for (const anchor of config.anchors) {
    buildCompany({
      segment: segments.find((s) => s.slug === anchor.slug),
      nomeFantasia: anchor.nome,
      bairro: config.bairros.find((b) => b.nome === anchor.bairroNome),
      opts: { situacao: 'ATIVA', ...anchor.opts },
    })
  }
  for (const c of companies) usedNames.add(c.nomeFantasia)

  for (const segment of segments) {
    const target = config.segmentCounts[segment.slug]
    const existing = companies.filter((c) => c.segmentSlug === segment.slug).length
    for (let i = existing; i < target; i++) {
      let nome = segment.names(pick, chance, SOBRENOMES, config.regionais)
      let attempts = 0
      while (usedNames.has(nome) && attempts++ < 30) nome = segment.names(pick, chance, SOBRENOMES, config.regionais)
      if (usedNames.has(nome)) nome = `${nome} ${intBetween(2, 9)}`
      usedNames.add(nome)
      buildCompany({ segment, nomeFantasia: nome, bairro: pick(config.bairros) })
    }
  }

  return {
    generatedAt: ANCHOR.toISOString(),
    city: config.city,
    state: config.state,
    center: config.center,
    companies: companies.map(({ segmentSlug: _segmentSlug, ...rest }) => rest),
  }
}

// ── Organização A — Comercial Triângulo Ltda (Uberlândia/MG) ───────────────
const ORG_A = buildDataset({
  seed: 20260812,
  idPrefix: 'cmp-a',
  city: 'Uberlândia',
  state: 'MG',
  areaCode: 34,
  center: { latitude: -18.9186, longitude: -48.2772 },
  regionais: ['Triângulo', 'Uberlândia', 'Cerrado', 'Minas', 'Araguari', 'Paranaíba', 'Alto Uberaba'],
  bairros: [
    { nome: 'Centro', lat: -18.9186, lng: -48.2772, cep: '38400-100' },
    { nome: 'Fundinho', lat: -18.9231, lng: -48.2799, cep: '38400-192' },
    { nome: 'Martins', lat: -18.9089, lng: -48.2869, cep: '38400-368' },
    { nome: 'Osvaldo Rezende', lat: -18.9053, lng: -48.2758, cep: '38400-612' },
    { nome: 'Brasil', lat: -18.9022, lng: -48.265, cep: '38400-650' },
    { nome: 'Umuarama', lat: -18.8869, lng: -48.2597, cep: '38405-302' },
    { nome: 'Santa Mônica', lat: -18.9377, lng: -48.2436, cep: '38408-100' },
    { nome: 'Segismundo Pereira', lat: -18.945, lng: -48.228, cep: '38408-244' },
    { nome: 'Tibery', lat: -18.9048, lng: -48.2409, cep: '38405-030' },
    { nome: 'Saraiva', lat: -18.937, lng: -48.268, cep: '38408-054' },
    { nome: 'Lídice', lat: -18.928, lng: -48.272, cep: '38400-278' },
    { nome: 'Tabajaras', lat: -18.913, lng: -48.265, cep: '38400-186' },
    { nome: 'Daniel Fonseca', lat: -18.904, lng: -48.295, cep: '38400-436' },
    { nome: 'Luizote de Freitas', lat: -18.908, lng: -48.325, cep: '38414-018' },
    { nome: 'Planalto', lat: -18.895, lng: -48.315, cep: '38413-018' },
    { nome: 'Jardim Karaíba', lat: -18.96, lng: -48.26, cep: '38411-186' },
    { nome: 'Granada', lat: -18.955, lng: -48.28, cep: '38411-050' },
    { nome: 'Cazeca', lat: -18.926, lng: -48.265, cep: '38400-554' },
    { nome: 'Custódio Pereira', lat: -18.895, lng: -48.235, cep: '38405-142' },
    { nome: 'Tubalina', lat: -18.935, lng: -48.295, cep: '38412-034' },
  ],
  logradouros: [
    'Av. João Naves de Ávila', 'Av. Rondon Pacheco', 'Av. Afonso Pena', 'Av. Floriano Peixoto',
    'Av. Cesário Alvim', 'Av. Segismundo Pereira', 'Rua Duque de Caxias', 'Rua Machado de Assis',
    'Rua Santos Dumont', 'Rua Quintino Bocaiúva', 'Rua Bernardo Guimarães', 'Rua Olegário Maciel',
    'Av. Brasil', 'Av. Getúlio Vargas', 'Rua Rio Grande do Sul', 'Rua das Acácias',
  ],
  segmentCounts: {
    'oficinas-mecanicas': 26, 'clinicas-odontologicas': 18, advocacia: 16, contabilidades: 14,
    restaurantes: 12, academias: 8, 'pet-shops': 10, imobiliarias: 9, 'clinicas-veterinarias': 7, farmacias: 8,
  },
  anchors: [
    { slug: 'oficinas-mecanicas', nome: 'Auto Center Oliveira', bairroNome: 'Centro', opts: { lat: -18.9162, lng: -48.2748, logradouro: 'Av. Floriano Peixoto', hasPhone: true, hasWhats: true, hasSite: true, hasEmail: false, dataAbertura: '2019-05-14', porte: 'ME', discoveredDaysAgo: 120 } },
    { slug: 'oficinas-mecanicas', nome: 'Mecânica Avenida', bairroNome: 'Centro', opts: { lat: -18.9205, lng: -48.2791, logradouro: 'Av. João Naves de Ávila', hasPhone: true, hasWhats: true, hasSite: true, hasEmail: true, dataAbertura: '2026-06-02', porte: 'MEI', discoveredDaysAgo: 2 } },
    { slug: 'oficinas-mecanicas', nome: 'Triângulo Auto Service', bairroNome: 'Martins', opts: { lat: -18.9102, lng: -48.2843, hasPhone: true, hasWhats: false, hasSite: false, hasEmail: false, dataAbertura: '2012-09-20', porte: 'EPP', discoveredDaysAgo: 200 } },
    { slug: 'clinicas-odontologicas', nome: 'Odonto Prime', bairroNome: 'Centro', opts: { hasPhone: true, hasWhats: true, hasSite: true, dataAbertura: '2017-03-10', discoveredDaysAgo: 90 } },
    { slug: 'clinicas-odontologicas', nome: 'Clínica Sorriso', bairroNome: 'Santa Mônica', opts: { hasPhone: true, hasWhats: true, hasSite: false, dataAbertura: '2021-08-01', discoveredDaysAgo: 4 } },
    { slug: 'contabilidades', nome: 'Master Contabilidade', bairroNome: 'Fundinho', opts: { hasPhone: true, hasWhats: true, hasSite: true, hasEmail: true, dataAbertura: '2010-02-18', porte: 'EPP', discoveredDaysAgo: 300 } },
    { slug: 'advocacia', nome: 'Advocacia Martins & Silva', bairroNome: 'Centro', opts: { hasPhone: true, hasWhats: false, hasSite: true, hasEmail: true, dataAbertura: '2014-11-05', discoveredDaysAgo: 150 } },
    { slug: 'pet-shops', nome: 'Pet Center Triângulo', bairroNome: 'Brasil', opts: { hasPhone: true, hasWhats: true, hasSite: false, dataAbertura: '2023-01-25', discoveredDaysAgo: 3 } },
  ],
})

// ── Organização B — Distribuidora Alfa Ltda (Ribeirão Preto/SP) ────────────
const ORG_B = buildDataset({
  seed: 20260919,
  idPrefix: 'cmp-b',
  city: 'Ribeirão Preto',
  state: 'SP',
  areaCode: 16,
  center: { latitude: -21.1775, longitude: -47.8103 },
  regionais: ['Alta Mogiana', 'Ribeirão', 'Interior', 'São Paulo', 'Sertãozinho'],
  bairros: [
    { nome: 'Centro', lat: -21.1775, lng: -47.8103, cep: '14010-100' },
    { nome: 'Jardim Paulista', lat: -21.1841, lng: -47.7936, cep: '14025-350' },
    { nome: 'Ribeirânia', lat: -21.1622, lng: -47.7912, cep: '14096-580' },
    { nome: 'Jardim Botânico', lat: -21.1592, lng: -47.8365, cep: '14021-609' },
    { nome: 'Higienópolis', lat: -21.1953, lng: -47.8148, cep: '14055-200' },
    { nome: 'Campos Elíseos', lat: -21.1965, lng: -47.7967, cep: '14085-000' },
    { nome: 'Sumarezinho', lat: -21.1857, lng: -47.8442, cep: '14025-660' },
    { nome: 'Vila Tibério', lat: -21.1731, lng: -47.7969, cep: '14050-050' },
  ],
  logradouros: [
    'Av. Presidente Vargas', 'Av. Nove de Julho', 'Av. Costábile Romano', 'Rua Duque de Caxias',
    'Rua General Osório', 'Av. Independência', 'Rua São Sebastião', 'Av. Portugal',
  ],
  segmentCounts: {
    'oficinas-mecanicas': 8, 'clinicas-odontologicas': 6, contabilidades: 5, restaurantes: 6, farmacias: 5,
  },
  anchors: [
    { slug: 'oficinas-mecanicas', nome: 'Alfa Auto Center', bairroNome: 'Centro', opts: { hasPhone: true, hasWhats: true, hasSite: true, dataAbertura: '2020-04-11', porte: 'ME', discoveredDaysAgo: 3 } },
    { slug: 'clinicas-odontologicas', nome: 'Odonto Ribeirânia', bairroNome: 'Ribeirânia', opts: { hasPhone: true, hasWhats: true, hasSite: true, dataAbertura: '2016-07-22', discoveredDaysAgo: 60 } },
    { slug: 'contabilidades', nome: 'Alfa Contabilidade', bairroNome: 'Jardim Paulista', opts: { hasPhone: true, hasWhats: true, hasSite: true, hasEmail: true, dataAbertura: '2011-09-05', porte: 'EPP', discoveredDaysAgo: 400 } },
  ],
})

for (const [org, data] of [['A', ORG_A], ['B', ORG_B]]) {
  const outPath = path.resolve(__dirname, `../src/data/companies.seed.org${org.toLowerCase()}.json`)
  mkdirSync(path.dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(data, null, 2))
  console.log(`✔ Org ${org}: ${data.companies.length} empresas em ${path.relative(process.cwd(), outPath)} (${data.city}/${data.state})`)
}
