// Área do administrador. Só números agregados e a lista de contas:
// o administrador não lê as leituras nem os alertas de ninguém (regra do banco).
import { supabase } from './supabase'
import type { Profile, Role } from './types'

export interface Overview {
  users: number
  consumers: number
  nutritionists: number
  admins: number
  new_users_7d: number
  scans: number
  scans_7d: number
  saved: number
  healthy_saved: number
  swaps: number
  alerts_critical: number
  alerts_attention: number
  active_links: number
  grades: Record<string, number>
  scans_by_day: { day: string; n: number }[]
  top_products: { name: string; n: number }[]
}

export type AccountRow = Pick<Profile, 'id' | 'name' | 'email' | 'created_at'> & { role: Role }

export async function fetchOverview(): Promise<Overview> {
  const { data, error } = await supabase.rpc('admin_overview')
  if (error) throw error
  return data as Overview
}

export async function fetchAccounts(): Promise<AccountRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as AccountRow[]
}

export async function setAccountRole(userId: string, role: Role) {
  const { error } = await supabase.rpc('admin_set_role', { p_user: userId, p_role: role })
  if (error) throw error
}

/** filtro da lista de contas (nome ou e-mail, sem diferenciar maiúsculas e acentos) */
export function matchesAccount(a: Pick<AccountRow, 'name' | 'email'>, query: string): boolean {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const q = norm(query.trim())
  if (!q) return true
  return norm(`${a.name ?? ''} ${a.email ?? ''}`).includes(q)
}
