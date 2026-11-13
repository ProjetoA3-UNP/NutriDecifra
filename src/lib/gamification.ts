// Gamificação: tudo é calculado a partir das ações reais do usuário
// (leituras, produtos salvos, trocas por alternativas e pontos registrados).
// XP = pontos.
import type { PointsEvent, Profile, Scan } from './types'
import { dayKey, startOfDay, startOfWeek, weekKey } from './time'

export const POINTS = {
  save: 10,
  healthySave: 20,
  alternative: 30,
  weeklyChallenge: 200,
}

export const LEVELS = [
  { min: 0, name: 'Iniciante' },
  { min: 150, name: 'Curioso dos rótulos' },
  { min: 400, name: 'Explorador' },
  { min: 800, name: 'Decifrador atento' },
  { min: 1800, name: 'Decifrador expert' },
  { min: 3500, name: 'Mestre dos rótulos' },
  { min: 6000, name: 'Lenda NutriDecifra' },
]

export function levelInfo(points: number) {
  let idx = 0
  LEVELS.forEach((l, i) => {
    if (points >= l.min) idx = i
  })
  const level = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  return {
    number: idx + 1,
    name: level.name,
    points,
    floor: level.min,
    next,
    progress: next ? (points - level.min) / (next.min - level.min) : 1,
  }
}

export function totalPoints(events: PointsEvent[]) {
  return events.reduce((s, e) => s + e.points, 0)
}

/** dias seguidos (até hoje ou ontem) com pelo menos um produto lido */
export function streakDays(scans: Scan[]): number {
  const days = new Set(scans.map((s) => dayKey(new Date(s.created_at))))
  const cursor = startOfDay(new Date())
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let n = 0
  while (days.has(dayKey(cursor))) {
    n++
    cursor.setDate(cursor.getDate() - 1)
  }
  return n
}

export function maxStreak(scans: Scan[]): number {
  const days = [...new Set(scans.map((s) => dayKey(new Date(s.created_at))))].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const k of days) {
    const d = new Date(`${k}T00:00:00`)
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86_400_000) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

export const isHealthy = (s: Scan) => s.nutriscore === 'a' || s.nutriscore === 'b'

/** escolhas saudáveis = produtos A/B salvos (inclui trocas por alternativas) */
export function healthyChoices(scans: Scan[]) {
  return scans.filter((s) => s.saved && isHealthy(s)).length
}

export interface Badge {
  id: string
  icon: string
  label: string
  description: string
  bg: string
  unlocked: boolean
}

export function badges(scans: Scan[], points: PointsEvent[], _profile: Profile | null): Badge[] {
  const distinct = new Set(scans.map((s) => s.barcode)).size
  const best = maxStreak(scans)
  return [
    { id: 'first', icon: '🏆', label: 'Iniciante', description: 'Leia seu primeiro rótulo', bg: '#ffeccc', unlocked: scans.length >= 1 },
    { id: 'green', icon: '🌱', label: 'Verde', description: 'Salve um produto com nota A ou B', bg: '#e8f5ee', unlocked: healthyChoices(scans) >= 1 },
    { id: 'streak3', icon: '🔥', label: 'Sequência', description: 'Leia rótulos 3 dias seguidos', bg: '#fde3e3', unlocked: best >= 3 },
    { id: 'ten', icon: '📚', label: 'Estudioso', description: 'Leia 10 produtos diferentes', bg: '#e3eefc', unlocked: distinct >= 10 },
    { id: 'swap', icon: '🔄', label: 'Troca certa', description: 'Troque um produto por uma alternativa melhor', bg: '#e8f5ee', unlocked: scans.some((s) => s.replaced_scan_id) },
    { id: 'challenge', icon: '🎯', label: 'Desafiante', description: 'Complete um desafio da semana', bg: '#fff4ec', unlocked: points.some((p) => p.reason === 'weekly_challenge') },
    { id: 'streak7', icon: '⚡', label: 'Maratona', description: 'Leia rótulos 7 dias seguidos', bg: '#fff8e0', unlocked: best >= 7 },
    { id: 'explorer', icon: '🧭', label: 'Explorador', description: 'Leia 25 produtos diferentes', bg: '#e3eefc', unlocked: distinct >= 25 },
  ]
}

/** Desafio da semana: escanear 5 produtos diferentes entre segunda e domingo */
export const WEEKLY_GOAL = 5
export function weeklyChallenge(scans: Scan[]) {
  const from = startOfWeek(new Date()).getTime()
  const done = new Set(scans.filter((s) => new Date(s.created_at).getTime() >= from).map((s) => s.barcode)).size
  return { done: Math.min(done, WEEKLY_GOAL), goal: WEEKLY_GOAL, key: weekKey(new Date()), complete: done >= WEEKLY_GOAL }
}
