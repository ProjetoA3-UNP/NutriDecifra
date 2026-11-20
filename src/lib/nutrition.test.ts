import { describe, expect, it } from 'vitest'
import { analyze, gradeOf, productAlerts, spoonsText } from './nutrition'
import type { OffProduct, Profile } from './types'

const profile = (patch: Partial<Profile> = {}): Profile => ({
  id: 'u1',
  name: 'Ana',
  email: 'ana@exemplo.com',
  restrictions: [],
  goal: 'reduce_sugar',
  sugar_limit_g: 25,
  sodium_limit_mg: 400,
  realtime_alerts: true,
  notifications: true,
  accessibility: {},
  plan: 'free',
  created_at: '2026-01-01T00:00:00Z',
  ...patch,
})

const biscoito: OffProduct = {
  code: '7891000100103',
  product_name: 'Biscoito recheado',
  quantity: '140 g',
  serving_quantity: 30,
  nutriscore_grade: 'E',
  nutriments: { sugars_100g: 40, sodium_100g: 0.3, 'saturated-fat_100g': 9 },
  nutrient_levels: { sugars: 'high', 'saturated-fat': 'high', salt: 'moderate' },
  allergens_tags: ['en:gluten', 'en:milk'],
  additives_n: 3,
  nova_group: 4,
}

describe('analyze', () => {
  it('usa a porção declarada para calcular colheres e cota diária', () => {
    const a = analyze(biscoito, profile())
    expect(a.basis.grams).toBe(30)
    expect(a.sugarBasis).toBe(12) // 40 g/100 g × 30 g
    expect(a.spoons).toBe(3) // 12 g ÷ 4 g
    expect(a.sugarQuotaPct).toBe(48) // 12 g ÷ 25 g
  })

  it('usa 100 g quando não há porção e respeita o limite do perfil', () => {
    const a = analyze({ ...biscoito, serving_quantity: undefined }, profile({ sugar_limit_g: 50 }))
    expect(a.basis.grams).toBe(100)
    expect(a.sugarQuotaPct).toBe(80)
  })

  it('converte sal em sódio quando o sódio não foi informado', () => {
    const a = analyze({ code: '1', nutriments: { salt_100g: 1 } }, null)
    expect(a.sodium100mg).toBe(400)
  })

  it('não inventa açúcar quando o rótulo não informa', () => {
    const a = analyze({ code: '1', nutriments: {} }, null)
    expect(a.sugarBasis).toBeNull()
    expect(a.spoons).toBeNull()
  })
})

describe('spoonsText', () => {
  it('arredonda e usa singular/plural', () => {
    expect(spoonsText(null)).toBe('Açúcar não informado')
    expect(spoonsText(0)).toBe('Nenhum açúcar')
    expect(spoonsText(0.3)).toBe('Menos de 1 colher de açúcar')
    expect(spoonsText(1.2)).toBe('1 colher de açúcar')
    expect(spoonsText(6.6)).toBe('7 colheres de açúcar')
  })
})

describe('gradeOf', () => {
  it('aceita só notas de A a E', () => {
    expect(gradeOf({ nutriscore_grade: 'B' })).toBe('b')
    expect(gradeOf({ nutriscore_grade: 'unknown' })).toBeNull()
    expect(gradeOf({})).toBeNull()
  })
})

describe('productAlerts', () => {
  it('marca glúten e lactose como críticos só para quem tem a restrição', () => {
    const sem = productAlerts(biscoito, profile()).map((a) => a.kind)
    expect(sem).not.toContain('gluten')
    const com = productAlerts(biscoito, profile({ restrictions: ['gluten', 'lactose'] }))
    expect(com.find((a) => a.kind === 'gluten')?.severity).toBe('critical')
    expect(com.find((a) => a.kind === 'lactose')?.severity).toBe('critical')
  })

  it('açúcar alto vira crítico quando o usuário marcou a restrição de açúcar', () => {
    expect(productAlerts(biscoito, profile()).find((a) => a.kind === 'sugar')?.severity).toBe('attention')
    expect(productAlerts(biscoito, profile({ restrictions: ['sugar'] })).find((a) => a.kind === 'sugar')?.severity).toBe('critical')
  })

  it('avisa sódio acima do limite pessoal e aditivos de ultraprocessado', () => {
    const list = productAlerts(biscoito, profile({ sodium_limit_mg: 50 }))
    expect(list.find((a) => a.kind === 'sodium')?.title).toBe('Sódio acima do seu limite')
    expect(list.find((a) => a.kind === 'additives')?.title).toBe('Aditivos ultraprocessados')
  })

  it('não gera alertas para um produto sem problemas', () => {
    const agua: OffProduct = { code: '2', nutriments: { sugars_100g: 0, sodium_100g: 0 }, nutrient_levels: {} }
    expect(productAlerts(agua, profile({ restrictions: ['gluten'] }))).toEqual([])
  })
})
