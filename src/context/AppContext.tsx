import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { AccessibilityPrefs, AlertRow, PointsEvent, Profile, Role, Scan } from '../lib/types'
import { roleOf } from '../lib/roles'

interface AppState {
  ready: boolean
  session: Session | null
  profile: Profile | null
  /** perfil de acesso da conta logada (consumer quando ainda não carregou) */
  role: Role
  /** true quando os dados da sessão atual já foram carregados do banco */
  loaded: boolean
  scans: Scan[]
  alerts: AlertRow[]
  points: PointsEvent[]
  refresh: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  setLocal: {
    scans: (fn: (s: Scan[]) => Scan[]) => void
    alerts: (fn: (a: AlertRow[]) => AlertRow[]) => void
    points: (fn: (p: PointsEvent[]) => PointsEvent[]) => void
  }
  a11y: AccessibilityPrefs
  setA11y: (prefs: AccessibilityPrefs) => void
}

const Ctx = createContext<AppState | null>(null)

const A11Y_KEY = 'nd.a11y'
function readLocalA11y(): AccessibilityPrefs {
  try {
    return JSON.parse(localStorage.getItem(A11Y_KEY) ?? '{}') as AccessibilityPrefs
  } catch {
    return {}
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [points, setPoints] = useState<PointsEvent[]>([])
  const [a11y, setA11yState] = useState<AccessibilityPrefs>(readLocalA11y)

  const loadUser = useCallback(async (s: Session, uid: string) => {
    const [p, sc, al, pt] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('scans').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(500),
      supabase.from('alerts').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(300),
      supabase.from('points_events').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ])
    let prof = p.data as Profile | null
    if (!prof && !p.error) {
      // perfil ainda não existe (ex.: usuário criado antes do gatilho) — cria agora
      const name =
        (s.user.user_metadata?.full_name as string | undefined) ??
        (s.user.user_metadata?.name as string | undefined) ??
        (s.user.email ?? '').split('@')[0]
      const ins = await supabase
        .from('profiles')
        .insert({ id: uid, email: s.user.email, name: name ? name.charAt(0).toUpperCase() + name.slice(1) : null })
        .select('*')
        .single()
      prof = ins.data as Profile | null
    }
    setProfile(prof)
    setScans((sc.data as Scan[]) ?? [])
    setAlerts((al.data as AlertRow[]) ?? [])
    setPoints((pt.data as PointsEvent[]) ?? [])
    if (prof?.accessibility && Object.keys(prof.accessibility).length) {
      setA11yState(prof.accessibility)
      try {
        localStorage.setItem(A11Y_KEY, JSON.stringify(prof.accessibility))
      } catch {
        /* armazenamento indisponível */
      }
    }
  }, [])

  const load = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null)
      setScans([])
      setAlerts([])
      setPoints([])
      setLoadedFor(null)
      return
    }
    const uid = s.user.id
    try {
      await loadUser(s, uid)
    } finally {
      setLoadedFor(uid)
    }
  }, [loadUser])

  useEffect(() => {
    if (!supabaseConfigured) {
      setReady(true)
      return
    }
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      try {
        await load(data.session)
      } finally {
        if (active) setReady(true)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // adiado para fora do callback, como recomenda o supabase-js
        setTimeout(() => void load(s), 0)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [load])

  const refresh = useCallback(() => load(session), [load, session])

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!profile) return
      setProfile({ ...profile, ...patch })
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', profile.id).select('*').single()
      if (error) {
        setProfile(profile)
        throw error
      }
      setProfile(data as Profile)
    },
    [profile],
  )

  const setA11y = useCallback(
    (prefs: AccessibilityPrefs) => {
      setA11yState(prefs)
      try {
        localStorage.setItem(A11Y_KEY, JSON.stringify(prefs))
      } catch {
        /* armazenamento indisponível */
      }
    },
    [],
  )

  const value = useMemo<AppState>(
    () => ({
      ready,
      session,
      profile,
      role: roleOf(profile),
      loaded: Boolean(session && loadedFor === session.user.id),
      scans,
      alerts,
      points,
      refresh,
      updateProfile,
      setLocal: { scans: setScans, alerts: setAlerts, points: setPoints },
      a11y,
      setA11y,
    }),
    [ready, session, profile, loadedFor, scans, alerts, points, refresh, updateProfile, a11y, setA11y],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp fora do AppProvider')
  return v
}
