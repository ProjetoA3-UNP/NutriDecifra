// Acompanhamento nutricional: o paciente (consumidor) autoriza um nutricionista,
// e o nutricionista passa a ler o perfil, as leituras e os alertas desse paciente.
// Quem garante isso é a RLS do banco (função is_my_patient); aqui só fazemos as consultas.
import { supabase } from './supabase'
import type { AlertRow, CareLink, Grade, Profile, Scan } from './types'

/** Colunas leves das leituras (sem a cópia completa do Open Food Facts) */
const SCAN_COLS = 'id, user_id, barcode, product_name, brand, nutriscore, saved, replaced_scan_id, created_at, sugars_100g, sodium_100g'
const ALERT_COLS = 'id, user_id, scan_id, kind, severity, title, description, product_name, read, created_at'
const PROFILE_COLS = 'id, name, email, restrictions, goal, sugar_limit_g, sodium_limit_mg, created_at'

export type PatientProfile = Pick<
  Profile,
  'id' | 'name' | 'email' | 'restrictions' | 'goal' | 'sugar_limit_g' | 'sodium_limit_mg' | 'created_at'
>
export type LightScan = Pick<
  Scan,
  'id' | 'user_id' | 'barcode' | 'product_name' | 'brand' | 'saved' | 'replaced_scan_id' | 'created_at' | 'sugars_100g' | 'sodium_100g'
> & { nutriscore: Grade | null }

export interface PatientSummary {
  link: CareLink
  profile: PatientProfile | null
  scans30: number
  healthySaved: number
  critical30: number
  lastActivity: string | null
}

const DAY = 86_400_000
const since = (days: number) => new Date(Date.now() - days * DAY).toISOString()

export const isHealthyGrade = (g: Grade | null) => g === 'a' || g === 'b'

/** Resumo de cada paciente que autorizou o nutricionista logado */
export function summarize(
  links: CareLink[],
  profiles: PatientProfile[],
  scans: LightScan[],
  alerts: Pick<AlertRow, 'user_id' | 'severity' | 'created_at'>[],
  now = Date.now(),
): PatientSummary[] {
  const cutoff = now - 30 * DAY
  return links.map((link) => {
    const id = link.patient_id
    const ps = scans.filter((s) => s.user_id === id)
    const recent = ps.filter((s) => new Date(s.created_at).getTime() >= cutoff)
    return {
      link,
      profile: profiles.find((p) => p.id === id) ?? null,
      scans30: recent.length,
      healthySaved: recent.filter((s) => s.saved && isHealthyGrade(s.nutriscore)).length,
      critical30: alerts.filter(
        (a) => a.user_id === id && a.severity === 'critical' && new Date(a.created_at).getTime() >= cutoff,
      ).length,
      lastActivity: ps.reduce<string | null>((max, s) => (!max || s.created_at > max ? s.created_at : max), null),
    }
  })
}

export async function fetchMyPatients(nutritionistId: string): Promise<PatientSummary[]> {
  const { data: links, error } = await supabase
    .from('care_links')
    .select('*')
    .eq('nutritionist_id', nutritionistId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  const list = (links ?? []) as CareLink[]
  if (!list.length) return []
  const ids = list.map((l) => l.patient_id)
  const [p, s, a] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLS).in('id', ids),
    supabase.from('scans').select(SCAN_COLS).in('user_id', ids).gte('created_at', since(90)).limit(2000),
    supabase.from('alerts').select('user_id, severity, created_at').in('user_id', ids).gte('created_at', since(30)).limit(2000),
  ])
  if (p.error) throw p.error
  if (s.error) throw s.error
  if (a.error) throw a.error
  return summarize(list, (p.data ?? []) as PatientProfile[], (s.data ?? []) as LightScan[], a.data ?? [])
}

export async function fetchPatient(patientId: string) {
  const [p, s, a] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLS).eq('id', patientId).maybeSingle(),
    supabase.from('scans').select(SCAN_COLS).eq('user_id', patientId).order('created_at', { ascending: false }).limit(60),
    supabase.from('alerts').select(ALERT_COLS).eq('user_id', patientId).order('created_at', { ascending: false }).limit(40),
  ])
  if (p.error) throw p.error
  if (s.error) throw s.error
  if (a.error) throw a.error
  return {
    profile: p.data as PatientProfile | null,
    scans: (s.data ?? []) as LightScan[],
    alerts: (a.data ?? []) as AlertRow[],
  }
}

/** Nutricionista encerra o acompanhamento de um paciente */
export async function endLink(linkId: string) {
  const { error } = await supabase
    .from('care_links')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', linkId)
  if (error) throw error
}

// --------------------------------------------------------------------------
// Lado do paciente (consumidor)
// --------------------------------------------------------------------------
export interface MyNutritionist {
  link_id: string
  status: 'active' | 'revoked'
  created_at: string
  name: string | null
  email: string | null
}

export async function listMyNutritionists(): Promise<MyNutritionist[]> {
  const { data, error } = await supabase.rpc('my_nutritionists')
  if (error) throw error
  return (data ?? []) as MyNutritionist[]
}

export async function linkNutritionist(email: string) {
  const { data, error } = await supabase.rpc('link_nutritionist', { p_email: email })
  if (error) throw error
  return data as { name: string | null; email: string }
}

/** Paciente retira a autorização (o nutricionista deixa de ver os dados na hora) */
export const revokeNutritionist = endLink
