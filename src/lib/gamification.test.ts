import { describe, expect, it } from 'vitest'
import { badges, healthyChoices, levelInfo, maxStreak, streakDays, totalPoints, weeklyChallenge, WEEKLY_GOAL } from './gamification'
import type { PointsEvent, Scan } from './types'

const daysAgo = (n: number) => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

let seq = 0
const scan = (patch: Partial<Scan> = {}): Scan =>
  ({
    id: `s${++seq}`,
    user_id: 'u1',
    barcode: `code-${seq}`,
    product_name: 'Produto',
    nutriscore: null,
    saved: false,
    replaced_scan_id: null,
    created_at: daysAgo(0),
    product: { code: 'x' },
    ...patch,
  }) as Scan

describe('níveis e pontos', () => {
  it('começa no nível 1 e sobe ao atingir o mínimo do próximo', () => {
    expect(levelInfo(0)).toMatchObject({ number: 1, name: 'Iniciante' })
    expect(levelInfo(150).number).toBe(2)
    expect(levelInfo(149).progress).toBeCloseTo(149 / 150)
  })

  it('soma os eventos de pontos', () => {
    const ev = [{ points: 10 }, { points: 30 }] as PointsEvent[]
    expect(totalPoints(ev)).toBe(40)
  })
})

describe('sequência de dias', () => {
  it('conta dias seguidos até hoje', () => {
    const list = [scan({ created_at: daysAgo(0) }), scan({ created_at: daysAgo(1) }), scan({ created_at: daysAgo(2) })]
    expect(streakDays(list)).toBe(3)
  })

  it('continua valendo se a última leitura foi ontem, e quebra com um dia sem leitura', () => {
    expect(streakDays([scan({ created_at: daysAgo(1) }), scan({ created_at: daysAgo(2) })])).toBe(2)
    expect(streakDays([scan({ created_at: daysAgo(3) })])).toBe(0)
  })

  it('guarda a maior sequência já feita', () => {
    const list = [daysAgo(10), daysAgo(9), daysAgo(8), daysAgo(1)].map((d) => scan({ created_at: d }))
    expect(maxStreak(list)).toBe(3)
  })
})

describe('escolhas saudáveis e conquistas', () => {
  it('conta só produtos A/B que foram salvos', () => {
    const list = [scan({ nutriscore: 'a', saved: true }), scan({ nutriscore: 'b', saved: false }), scan({ nutriscore: 'e', saved: true })]
    expect(healthyChoices(list)).toBe(1)
  })

  it('libera "Iniciante" na primeira leitura e "Troca certa" ao trocar por alternativa', () => {
    const b = badges([scan({ replaced_scan_id: 's0' })], [], null)
    expect(b.find((x) => x.id === 'first')?.unlocked).toBe(true)
    expect(b.find((x) => x.id === 'swap')?.unlocked).toBe(true)
    expect(b.find((x) => x.id === 'ten')?.unlocked).toBe(false)
  })
})

describe('desafio da semana', () => {
  it(`conclui com ${WEEKLY_GOAL} produtos diferentes na semana`, () => {
    const list = Array.from({ length: WEEKLY_GOAL }, () => scan({ created_at: new Date().toISOString() }))
    expect(weeklyChallenge(list)).toMatchObject({ done: WEEKLY_GOAL, complete: true })
  })

  it('o mesmo produto lido duas vezes conta uma vez só', () => {
    const list = [scan({ barcode: 'igual' }), scan({ barcode: 'igual' })]
    expect(weeklyChallenge(list).done).toBe(1)
  })
})
