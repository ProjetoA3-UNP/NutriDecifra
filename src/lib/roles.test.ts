import { describe, expect, it } from 'vitest'
import { canAccess, homeFor, roleOf } from './roles'
import { summarize, type LightScan, type PatientProfile } from './care'
import { matchesAccount } from './admin'
import type { CareLink } from './types'

describe('perfis de acesso', () => {
  it('sem perfil definido (ou valor desconhecido) a conta é Consumidor', () => {
    expect(roleOf(null)).toBe('consumer')
    expect(roleOf({})).toBe('consumer')
    expect(roleOf({ role: 'nutritionist' })).toBe('nutritionist')
  })

  it('cada perfil tem a sua tela inicial', () => {
    expect(homeFor('consumer')).toBe('/inicio')
    expect(homeFor('nutritionist')).toBe('/profissional')
    expect(homeFor('admin')).toBe('/admin')
  })

  it('consumidor não abre as áreas do nutricionista nem do admin', () => {
    expect(canAccess('consumer', '/inicio')).toBe(true)
    expect(canAccess('consumer', '/resultado/123')).toBe(true)
    expect(canAccess('consumer', '/profissional')).toBe(false)
    expect(canAccess('consumer', '/admin')).toBe(false)
  })

  it('nutricionista só abre a área profissional', () => {
    expect(canAccess('nutritionist', '/profissional')).toBe(true)
    expect(canAccess('nutritionist', '/profissional/paciente/abc')).toBe(true)
    expect(canAccess('nutritionist', '/inicio')).toBe(false)
    expect(canAccess('nutritionist', '/admin')).toBe(false)
  })

  it('administrador só abre a área de administração', () => {
    expect(canAccess('admin', '/admin')).toBe(true)
    expect(canAccess('admin', '/profissional')).toBe(false)
    expect(canAccess('admin', '/scanner')).toBe(false)
  })

  it('não confunde rotas parecidas', () => {
    expect(canAccess('consumer', '/administrar')).toBe(true)
    expect(canAccess('admin', '/administrar')).toBe(false)
  })
})

describe('resumo dos pacientes (nutricionista)', () => {
  const now = new Date('2026-11-20T12:00:00Z').getTime()
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString()
  const link = { id: 'l1', patient_id: 'p1', nutritionist_id: 'n1', status: 'active', created_at: iso(40), revoked_at: null } as CareLink
  const profile = { id: 'p1', name: 'Bia', email: 'bia@x.com', restrictions: ['gluten'] } as PatientProfile
  const s = (daysAgo: number, patch: Partial<LightScan> = {}) =>
    ({ id: `${daysAgo}`, user_id: 'p1', created_at: iso(daysAgo), saved: false, nutriscore: null, ...patch }) as LightScan

  it('conta leituras e escolhas A/B dos últimos 30 dias e alertas críticos', () => {
    const scans = [s(1, { saved: true, nutriscore: 'a' }), s(2, { saved: true, nutriscore: 'e' }), s(45, { saved: true, nutriscore: 'b' })]
    const alerts = [
      { user_id: 'p1', severity: 'critical' as const, created_at: iso(3) },
      { user_id: 'p1', severity: 'attention' as const, created_at: iso(3) },
      { user_id: 'outro', severity: 'critical' as const, created_at: iso(3) },
    ]
    const [r] = summarize([link], [profile], scans, alerts, now)
    expect(r.profile?.name).toBe('Bia')
    expect(r.scans30).toBe(2)
    expect(r.healthySaved).toBe(1)
    expect(r.critical30).toBe(1)
    expect(r.lastActivity).toBe(iso(1))
  })

  it('paciente sem leituras aparece sem atividade', () => {
    const [r] = summarize([link], [profile], [], [], now)
    expect(r.scans30).toBe(0)
    expect(r.lastActivity).toBeNull()
  })
})

describe('busca de contas (administrador)', () => {
  it('encontra por nome ou e-mail, sem diferenciar acentos e maiúsculas', () => {
    const a = { name: 'João Gonçalves', email: 'joao@exemplo.com' }
    expect(matchesAccount(a, 'joao')).toBe(true)
    expect(matchesAccount(a, 'GONÇA')).toBe(true)
    expect(matchesAccount(a, 'exemplo.com')).toBe(true)
    expect(matchesAccount(a, 'maria')).toBe(false)
    expect(matchesAccount(a, '  ')).toBe(true)
  })
})
