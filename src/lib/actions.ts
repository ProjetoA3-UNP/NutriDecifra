// Operações que gravam dados no Supabase.
import { supabase } from './supabase'
import type { AlertRow, OffProduct, PointsEvent, Profile, Scan } from './types'
import { analyze, fmt, gradeOf, num, productAlerts, productBrand, productName } from './nutrition'
import { POINTS, isHealthy, weeklyChallenge } from './gamification'
import { isToday } from './time'

function scanRow(userId: string, p: OffProduct) {
  const a = analyze(p, null)
  return {
    user_id: userId,
    barcode: p.code,
    product_name: productName(p),
    brand: productBrand(p),
    quantity: p.quantity ?? null,
    image_url: p.image_front_small_url ?? p.image_front_url ?? null,
    nutriscore: gradeOf(p),
    nova_group: a.nova,
    sugars_100g: a.sugar100,
    sat_fat_100g: a.satFat100,
    sodium_100g: a.sodium100mg !== null ? a.sodium100mg / 1000 : null,
    fiber_100g: a.fiber100,
    additives_count: a.additives,
    serving_g: num(p.serving_quantity),
    category: (p.categories_hierarchy ?? p.categories_tags ?? []).slice(-1)[0] ?? null,
    product: p,
  }
}

/** Desafio da semana: dá os pontos uma única vez por semana quando concluído. */
async function awardChallenge(userId: string, allScans: Scan[]) {
  const ch = weeklyChallenge(allScans)
  if (!ch.complete) return null
  return addPoints(userId, POINTS.weeklyChallenge, 'weekly_challenge', ch.key)
}

/** Registra uma leitura e os alertas do produto para o perfil do usuário. */
export async function recordScan(userId: string, profile: Profile | null, p: OffProduct, allScans: Scan[]) {
  const { data, error } = await supabase.from('scans').insert(scanRow(userId, p)).select('*').single()
  if (error) throw error
  const scan = data as Scan
  const list = productAlerts(p, profile)
  let alerts: AlertRow[] = []
  if (list.length) {
    const res = await supabase
      .from('alerts')
      .insert(
        list.map((a) => ({
          user_id: userId,
          scan_id: scan.id,
          kind: a.kind,
          severity: a.severity,
          title: a.title,
          description: a.description,
          product_name: scan.product_name,
        })),
      )
      .select('*')
    if (res.error) throw res.error
    alerts = res.data as AlertRow[]
  }
  const bonus = await awardChallenge(userId, [scan, ...allScans]).catch(() => null)
  return { scan, alerts, bonus }
}

async function addPoints(userId: string, points: number, reason: string, ref: string) {
  const { data, error } = await supabase
    .from('points_events')
    .insert({ user_id: userId, points, reason, ref })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') return null // já pontuado por esta ação
    throw error
  }
  return data as PointsEvent
}

export interface SaveResult {
  scan: Scan
  pointsEarned: number
  newPoints: PointsEvent[]
  newAlerts: AlertRow[]
  challengeCompleted: boolean
}

/** Pós-salvamento: pontos, alerta de boa escolha, cota diária de açúcar e desafio da semana. */
async function afterSave(
  userId: string,
  profile: Profile | null,
  scan: Scan,
  allScans: Scan[],
  reason: 'save' | 'alternative',
): Promise<SaveResult> {
  const healthy = isHealthy(scan)
  const pts = reason === 'alternative' ? POINTS.alternative : healthy ? POINTS.healthySave : POINTS.save
  const newPoints: PointsEvent[] = []
  const ev = await addPoints(userId, pts, reason, scan.id)
  if (ev) newPoints.push(ev)

  const alertsToInsert: Omit<AlertRow, 'id' | 'created_at' | 'read'>[] = []
  if (healthy || reason === 'alternative') {
    alertsToInsert.push({
      user_id: userId,
      scan_id: scan.id,
      kind: 'good_choice',
      severity: 'positive',
      title: 'Boa escolha registrada!',
      description:
        reason === 'alternative'
          ? `Você ganhou ${pts} pontos por trocar por uma alternativa com Nutri-Score ${scan.nutriscore?.toUpperCase() ?? '?'}.`
          : `Você ganhou ${pts} pontos por escolher um produto com Nutri-Score ${scan.nutriscore?.toUpperCase()}.`,
      product_name: scan.product_name,
    })
  }

  // soma do açúcar dos produtos salvos hoje (na porção declarada ou em 100 g)
  const todaySaved = [scan, ...allScans.filter((s) => s.id !== scan.id && s.saved && isToday(s.created_at))]
  const limit = profile?.sugar_limit_g ?? 25
  const sugarToday = todaySaved.reduce((sum, s) => sum + (analyze(s.product, profile).sugarBasis ?? 0), 0)
  const pct = (sugarToday / limit) * 100
  const before = sugarToday - (analyze(scan.product, profile).sugarBasis ?? 0)
  if (pct >= 80 && (before / limit) * 100 < 80) {
    alertsToInsert.push({
      user_id: userId,
      scan_id: scan.id,
      kind: 'daily_sugar',
      severity: pct >= 100 ? 'critical' : 'attention',
      title: pct >= 100 ? 'Açúcar acima do limite diário' : 'Açúcar perto do limite diário',
      description: `Os produtos salvos hoje somam ${fmt(sugarToday)} g de açúcar — ${fmt(pct, 0)}% da sua cota de ${limit} g.`,
      product_name: 'Histórico do dia',
    })
  }

  let newAlerts: AlertRow[] = []
  if (alertsToInsert.length) {
    const res = await supabase.from('alerts').insert(alertsToInsert).select('*')
    if (res.error) throw res.error
    newAlerts = res.data as AlertRow[]
  }

  let challengeCompleted = false
  const bonus = await awardChallenge(userId, [scan, ...allScans.filter((s) => s.id !== scan.id)])
  if (bonus) {
    newPoints.push(bonus)
    challengeCompleted = true
  }

  return {
    scan,
    pointsEarned: newPoints.reduce((s, p) => s + p.points, 0),
    newPoints,
    newAlerts,
    challengeCompleted,
  }
}

export async function saveScan(userId: string, profile: Profile | null, scan: Scan, allScans: Scan[]) {
  const { data, error } = await supabase.from('scans').update({ saved: true }).eq('id', scan.id).select('*').single()
  if (error) throw error
  return afterSave(userId, profile, data as Scan, allScans, 'save')
}

export async function chooseAlternative(
  userId: string,
  profile: Profile | null,
  original: Scan,
  alt: OffProduct,
  allScans: Scan[],
) {
  const { data, error } = await supabase
    .from('scans')
    .insert({ ...scanRow(userId, alt), saved: true, replaced_scan_id: original.id })
    .select('*')
    .single()
  if (error) throw error
  return afterSave(userId, profile, data as Scan, allScans, 'alternative')
}

export async function toggleFavorite(scan: Scan) {
  const { data, error } = await supabase
    .from('scans')
    .update({ favorite: !scan.favorite })
    .eq('id', scan.id)
    .select('*')
    .single()
  if (error) throw error
  return data as Scan
}

export async function markAlertsRead(userId: string) {
  await supabase.from('alerts').update({ read: true }).eq('user_id', userId).eq('read', false)
}
