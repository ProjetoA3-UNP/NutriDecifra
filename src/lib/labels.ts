import type { Goal, Restriction } from './types'

export const GOALS: Record<Goal, string> = {
  reduce_sugar: 'Reduzir consumo de açúcar',
  reduce_sodium: 'Reduzir consumo de sódio',
  eat_better: 'Comer de forma mais saudável',
  avoid_ultra: 'Evitar ultraprocessados',
}

export const RESTRICTION_LABEL: Record<Restriction, string> = {
  gluten: 'Glúten',
  lactose: 'Lactose',
  sugar: 'Açúcar',
  sodium: 'Sódio',
}
