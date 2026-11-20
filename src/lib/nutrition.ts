// Cálculos nutricionais do NutriDecifra.
// Todas as contas usam os valores declarados no Open Food Facts.
//
// Referências usadas:
// - 1 colher de chá de açúcar = 4 g (medida caseira usada pela OMS e pelo Ministério da Saúde)
// - Limite diário de açúcar padrão = 25 g (recomendação da OMS: idealmente < 5% das calorias
//   diárias, ~25 g). O usuário pode mudar esse limite em "Personalizar alertas".
// - "Alto em" açúcar / gordura saturada / sal: classificação nutrient_levels do Open Food Facts.
import type { AlertKind, Grade, OffProduct, Profile, Severity } from './types'

export const SUGAR_SPOON_G = 4

export function num(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function gradeOf(p: Pick<OffProduct, 'nutriscore_grade'>): Grade | null {
  const g = (p.nutriscore_grade ?? '').toLowerCase()
  return ['a', 'b', 'c', 'd', 'e'].includes(g) ? (g as Grade) : null
}

export function productName(p: OffProduct): string {
  return (p.product_name_pt || p.product_name || p.generic_name_pt || 'Produto sem nome').trim()
}

export function productBrand(p: OffProduct): string | null {
  const b = (p.brands ?? '').split(',')[0]?.trim()
  return b || null
}

export function isLiquid(p: OffProduct): boolean {
  const q = `${p.quantity ?? ''} ${p.serving_size ?? ''}`.toLowerCase()
  return /\d\s*(ml|l|cl)\b/.test(q)
}

/** Base de cálculo: a porção declarada no rótulo ou, na falta dela, 100 g/ml. */
export function basisOf(p: OffProduct): { grams: number; label: string } {
  const unit = isLiquid(p) ? 'ml' : 'g'
  const serving = num(p.serving_quantity)
  if (serving && serving > 0 && serving <= 1000) {
    return { grams: serving, label: `por porção de ${fmt(serving)} ${unit}` }
  }
  return { grams: 100, label: `em 100 ${unit}` }
}

export function nutrient100(p: OffProduct, key: string): number | null {
  return num(p.nutriments?.[`${key}_100g`])
}

export interface Analysis {
  grade: Grade | null
  sugar100: number | null
  satFat100: number | null
  sodium100mg: number | null
  fiber100: number | null
  basis: { grams: number; label: string }
  sugarBasis: number | null
  spoons: number | null
  sugarQuotaPct: number | null
  sodiumBasisMg: number | null
  additives: number | null
  nova: number | null
}

export function analyze(p: OffProduct, profile: Pick<Profile, 'sugar_limit_g'> | null): Analysis {
  const sugar100 = nutrient100(p, 'sugars')
  const sodium100 = nutrient100(p, 'sodium') // gramas
  const salt100 = nutrient100(p, 'salt')
  const sodium100mg = sodium100 !== null ? sodium100 * 1000 : salt100 !== null ? (salt100 / 2.5) * 1000 : null
  const basis = basisOf(p)
  const sugarBasis = sugar100 !== null ? (sugar100 * basis.grams) / 100 : null
  const limit = profile?.sugar_limit_g ?? 25
  return {
    grade: gradeOf(p),
    sugar100,
    satFat100: nutrient100(p, 'saturated-fat'),
    sodium100mg,
    fiber100: nutrient100(p, 'fiber'),
    basis,
    sugarBasis,
    spoons: sugarBasis !== null ? sugarBasis / SUGAR_SPOON_G : null,
    sugarQuotaPct: sugarBasis !== null ? (sugarBasis / limit) * 100 : null,
    sodiumBasisMg: sodium100mg !== null ? (sodium100mg * basis.grams) / 100 : null,
    additives: typeof p.additives_n === 'number' ? p.additives_n : p.additives_tags ? p.additives_tags.length : null,
    nova: typeof p.nova_group === 'number' ? p.nova_group : null,
  }
}

/** "7 colheres de açúcar" — arredonda para o inteiro mais próximo. */
export function spoonsText(spoons: number | null): string {
  if (spoons === null) return 'Açúcar não informado'
  if (spoons === 0) return 'Nenhum açúcar'
  if (spoons < 0.5) return 'Menos de 1 colher de açúcar'
  const n = Math.round(spoons)
  return `${n} ${n === 1 ? 'colher' : 'colheres'} de açúcar`
}

export function fmt(n: number, digits = 1): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: digits })
}

// ---------------------------------------------------------------------------
// Nutri-Score
// ---------------------------------------------------------------------------
export const GRADE_COLORS: Record<Grade, string> = {
  a: '#43a047',
  b: '#7cb342',
  c: '#ffb300',
  d: '#ff8a3d',
  e: '#e84141',
}
export const GRADE_WORD: Record<Grade, string> = {
  a: 'Ótimo',
  b: 'Bom',
  c: 'Atenção',
  d: 'Ruim',
  e: 'Ruim',
}
/** cor de fundo do quadradinho do produto (igual ao Figma) */
export const GRADE_TINT: Record<Grade, string> = {
  a: '#e8f5ee',
  b: '#fff8e0',
  c: '#fff4ec',
  d: '#fdecec',
  e: '#fdecec',
}
export function gradeColor(g: Grade | null) {
  return g ? GRADE_COLORS[g] : '#9aa89f'
}
export function gradeTint(g: Grade | null) {
  return g ? GRADE_TINT[g] : '#f0f4f1'
}
export function gradeGroup(g: Grade | null): 'good' | 'attention' | 'bad' | 'unknown' {
  if (g === 'a' || g === 'b') return 'good'
  if (g === 'c') return 'attention'
  if (g === 'd' || g === 'e') return 'bad'
  return 'unknown'
}

// ---------------------------------------------------------------------------
// Alertas personalizados
// ---------------------------------------------------------------------------
export interface ProductAlert {
  kind: AlertKind
  severity: Severity
  /** frase curta usada na tela de resultado */
  short: string
  /** título e descrição usados na tela de alertas */
  title: string
  description: string
}

const has = (tags: string[] | undefined, tag: string) => (tags ?? []).includes(tag)

export function productAlerts(p: OffProduct, profile: Profile | null): ProductAlert[] {
  const r = new Set(profile?.restrictions ?? [])
  const a = analyze(p, profile)
  const out: ProductAlert[] = []

  if (r.has('gluten') && has(p.allergens_tags, 'en:gluten')) {
    out.push({
      kind: 'gluten', severity: 'critical',
      short: 'Contém glúten · você marcou intolerância',
      title: 'Glúten detectado',
      description: 'Produto contém ingrediente que você marcou como restrição alimentar.',
    })
  } else if (r.has('gluten') && has(p.traces_tags, 'en:gluten')) {
    out.push({
      kind: 'gluten_traces', severity: 'attention',
      short: 'Pode conter traços de glúten',
      title: 'Pode conter glúten',
      description: 'O fabricante informa que o produto pode conter traços de glúten.',
    })
  }
  if (r.has('lactose') && has(p.allergens_tags, 'en:milk')) {
    out.push({
      kind: 'lactose', severity: 'critical',
      short: 'Contém leite (lactose) · você marcou intolerância',
      title: 'Lactose detectada',
      description: 'Produto contém leite ou derivados, que você marcou como restrição alimentar.',
    })
  } else if (r.has('lactose') && has(p.traces_tags, 'en:milk')) {
    out.push({
      kind: 'lactose_traces', severity: 'attention',
      short: 'Pode conter traços de leite',
      title: 'Pode conter leite',
      description: 'O fabricante informa que o produto pode conter traços de leite.',
    })
  }
  if (a.sugar100 !== null && p.nutrient_levels?.sugars === 'high') {
    out.push({
      kind: 'sugar', severity: r.has('sugar') ? 'critical' : 'attention',
      short: `Alto teor de açúcar (${fmt(a.sugar100)} g em 100 ${isLiquid(p) ? 'ml' : 'g'})`,
      title: 'Alto teor de açúcar',
      description: `Contém ${fmt(a.sugar100)} g de açúcar a cada 100 ${isLiquid(p) ? 'ml' : 'g'}.`,
    })
  }
  if (a.satFat100 !== null && p.nutrient_levels?.['saturated-fat'] === 'high') {
    out.push({
      kind: 'sat_fat', severity: 'attention',
      short: `Alto teor de gordura saturada (${fmt(a.satFat100)}g)`,
      title: 'Alto teor de gordura saturada',
      description: `Contém ${fmt(a.satFat100)} g de gordura saturada a cada 100 ${isLiquid(p) ? 'ml' : 'g'}.`,
    })
  }
  const sodiumLimit = profile?.sodium_limit_mg ?? 400
  if (a.sodiumBasisMg !== null && (a.sodiumBasisMg > sodiumLimit || p.nutrient_levels?.salt === 'high')) {
    const over = a.sodiumBasisMg > sodiumLimit
    out.push({
      kind: 'sodium', severity: r.has('sodium') ? 'critical' : 'attention',
      short: over
        ? `Sódio acima do seu limite (${fmt(a.sodiumBasisMg, 0)} mg ${a.basis.label})`
        : `Alto teor de sódio (${fmt(a.sodium100mg ?? 0, 0)} mg em 100 g)`,
      title: over ? 'Sódio acima do seu limite' : 'Alto teor de sódio',
      description: over
        ? `${fmt(a.sodiumBasisMg, 0)} mg de sódio ${a.basis.label}. Seu alerta é acima de ${sodiumLimit} mg.`
        : `Contém ${fmt(a.sodium100mg ?? 0, 0)} mg de sódio a cada 100 g.`,
    })
  }
  if (a.additives !== null && a.additives > 0) {
    const ultra = a.nova === 4
    out.push({
      kind: 'additives', severity: 'attention',
      short: `Possui ${a.additives} ${a.additives === 1 ? 'aditivo' : 'aditivos'}${ultra ? ' · ultraprocessado' : ''}`,
      title: ultra ? 'Aditivos ultraprocessados' : 'Aditivos alimentares',
      description: `Produto possui ${a.additives} ${a.additives === 1 ? 'aditivo alimentar' : 'aditivos alimentares'}${
        ultra ? ' e é classificado como ultraprocessado (NOVA 4).' : '.'
      }`,
    })
  }
  return out
}

/** Acessibilidade → "Linguagem simples": o mesmo alerta, sem termos técnicos */
export function simpleAlertText(alert: ProductAlert, p: OffProduct): string {
  const a = analyze(p, null)
  switch (alert.kind) {
    case 'gluten':
      return 'Tem glúten. Você disse que não pode comer glúten.'
    case 'gluten_traces':
      return 'Pode ter um pouco de glúten.'
    case 'lactose':
      return 'Tem leite. Você disse que não pode consumir lactose.'
    case 'lactose_traces':
      return 'Pode ter um pouco de leite.'
    case 'sugar':
      return 'Tem muito açúcar.'
    case 'sat_fat':
      return 'Tem muita gordura que faz mal ao coração (gordura saturada).'
    case 'sodium':
      return 'Tem muito sal (sódio).'
    case 'additives':
      return `Tem ${a.additives ?? 'alguns'} ${a.additives === 1 ? 'ingrediente artificial' : 'ingredientes artificiais'}${
        a.nova === 4 ? ' e é muito industrializado' : ''
      }.`
    default:
      return alert.short
  }
}

/** cores de fundo / texto de cada alerta (iguais ao Figma) */
export function alertTone(kind: AlertKind, severity: Severity) {
  if (severity === 'positive') return { bg: '#e8f5ee', ink: '#1f7a4d', stripe: '#43a047' }
  if (severity === 'critical') return { bg: '#fdecec', ink: '#9b1c1c', stripe: '#e84141' }
  if (kind === 'additives') return { bg: '#fff8e0', ink: '#7a5c00', stripe: '#ffb300' }
  return { bg: '#fff4ec', ink: '#9a4a18', stripe: '#ff8a3d' }
}
