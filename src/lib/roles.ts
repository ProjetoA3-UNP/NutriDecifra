// Perfis de acesso do NutriDecifra e o que cada um pode abrir.
// A regra de verdade fica no banco (RLS + funções em supabase/migrations/002_perfis_e_permissoes.sql);
// aqui o app só decide qual tela mostrar para cada perfil.
import type { Profile, Role } from './types'

export const ROLE_LABEL: Record<Role, string> = {
  consumer: 'Consumidor',
  nutritionist: 'Nutricionista',
  admin: 'Administrador',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  consumer: 'Lê rótulos, recebe alertas e acompanha as próprias escolhas.',
  nutritionist: 'Acompanha, só para leitura, os pacientes que autorizaram o acesso.',
  admin: 'Vê números gerais da plataforma e define o perfil de cada conta.',
}

export function roleOf(profile: Pick<Profile, 'role'> | null | undefined): Role {
  const r = profile?.role
  return r === 'nutritionist' || r === 'admin' ? r : 'consumer'
}

/** Tela inicial (dashboard) de cada perfil */
export function homeFor(role: Role): string {
  if (role === 'nutritionist') return '/profissional'
  if (role === 'admin') return '/admin'
  return '/inicio'
}

/** Rotas protegidas e quais perfis podem abrir cada uma */
const AREAS: { prefix: string; roles: Role[] }[] = [
  { prefix: '/profissional', roles: ['nutritionist'] },
  { prefix: '/admin', roles: ['admin'] },
]

/** Perfis que podem abrir uma rota. Tudo que não é área de nutricionista ou admin é do consumidor. */
export function rolesFor(path: string): Role[] {
  const area = AREAS.find((a) => path === a.prefix || path.startsWith(`${a.prefix}/`))
  return area ? area.roles : ['consumer']
}

export function canAccess(role: Role, path: string): boolean {
  return rolesFor(path).includes(role)
}
