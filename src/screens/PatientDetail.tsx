import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Target } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BackArrow, ErrorBox, Loading, ScoreBadge, Spinner } from '../components/ui'
import { AlertIcon } from '../components/icons'
import { StatCard } from '../components/staff'
import { endLink, fetchPatient, isHealthyGrade, type LightScan, type PatientProfile } from '../lib/care'
import { supabase } from '../lib/supabase'
import { GOALS, RESTRICTION_LABEL } from '../lib/labels'
import { alertTone, fmt } from '../lib/nutrition'
import { relativeTime } from '../lib/time'
import type { AlertRow } from '../lib/types'

const DAY = 86_400_000

/** Nutricionista · Ficha do paciente (somente leitura) */
export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useApp()
  const [data, setData] = useState<{ profile: PatientProfile | null; scans: LightScan[]; alerts: AlertRow[]; at: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    fetchPatient(id)
      .then((d) => alive && setData({ ...d, at: Date.now() }))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [id])

  async function stop() {
    if (!session || !id) return
    if (!window.confirm('Encerrar o acompanhamento? Você deixa de ver os dados deste paciente.')) return
    setBusy(true)
    try {
      const { data: link } = await supabase
        .from('care_links')
        .select('id')
        .eq('nutritionist_id', session.user.id)
        .eq('patient_id', id)
        .eq('status', 'active')
        .maybeSingle()
      if (link) await endLink(link.id as string)
      navigate('/profissional', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  if (error && !data) {
    return (
      <div className="flex h-full flex-col gap-[16px] bg-page p-[22px] pt-[62px]">
        <BackArrow to="/profissional" />
        <ErrorBox>{error}</ErrorBox>
      </div>
    )
  }
  if (!data) return <Loading />
  // sem perfil = a RLS não liberou (o paciente retirou a autorização ou nunca autorizou)
  if (!data.profile) {
    return (
      <div className="flex h-full flex-col gap-[16px] bg-page p-[22px] pt-[62px]">
        <BackArrow to="/profissional" />
        <ErrorBox>Você não tem acesso a este paciente. O acesso depende da autorização dele no app.</ErrorBox>
      </div>
    )
  }

  const { profile, scans, alerts } = data
  const name = profile.name || profile.email || 'Paciente'
  const cutoff = data.at - 30 * DAY
  const recent = scans.filter((s) => new Date(s.created_at).getTime() >= cutoff)
  const healthy = recent.filter((s) => s.saved && isHealthyGrade(s.nutriscore)).length
  const critical = alerts.filter((a) => a.severity === 'critical' && new Date(a.created_at).getTime() >= cutoff).length
  const grades = ['a', 'b', 'c', 'd', 'e'] as const
  const byGrade = grades.map((g) => ({ g, n: recent.filter((s) => s.nutriscore === g).length }))
  const maxGrade = Math.max(1, ...byGrade.map((b) => b.n))

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-page px-[22px] pb-[40px]">
      <div className="flex h-[110px] items-start justify-between pt-[62px]">
        <BackArrow to="/profissional" />
        <h1 className="m-0 mt-[4px] text-[16px] font-bold leading-[normal] text-ink">Ficha do paciente</h1>
        <span className="w-[24px]" />
      </div>

      <div className="flex items-center rounded-[20px] bg-white px-[16px] py-[16px]">
        <span className="flex size-[56px] shrink-0 items-center justify-center rounded-full bg-brand text-[22px] font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="ml-[14px] min-w-0">
          <p className="m-0 truncate text-[17px] font-bold text-ink">{name}</p>
          <p className="m-0 mt-[3px] truncate text-[12px] text-muted">{profile.email}</p>
          <div className="mt-[8px] flex flex-wrap gap-[6px]">
            {profile.restrictions.length === 0 && <span className="text-[11px] text-faint">Sem restrições marcadas</span>}
            {profile.restrictions.map((r) => (
              <span key={r} className="rounded-[10px] bg-brand-tint px-[8px] py-[2px] text-[11px] font-bold text-brand">
                {RESTRICTION_LABEL[r]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-[12px] flex items-center gap-[12px] rounded-[16px] bg-white px-[16px] py-[12px]">
        <Target size={22} className="shrink-0 text-brand" aria-hidden />
        <div>
          <p className="m-0 text-[13px] font-bold text-ink">{GOALS[profile.goal] ?? GOALS.reduce_sugar}</p>
          <p className="m-0 mt-[3px] text-[11px] text-muted">
            Limite de açúcar {profile.sugar_limit_g} g/dia · alerta de sódio acima de {profile.sodium_limit_mg} mg
          </p>
        </div>
      </div>

      <div className="mt-[14px] flex gap-[10px]">
        <StatCard value={recent.length} label="leituras em 30 dias" />
        <StatCard value={healthy} label="escolhas A/B salvas" tone="brand" />
        <StatCard value={critical} label="alertas críticos" tone={critical ? 'danger' : 'ink'} />
      </div>

      {/* distribuição do Nutri-Score */}
      <div className="mt-[14px] rounded-[18px] bg-white px-[16px] py-[14px]">
        <p className="m-0 text-[13px] font-bold text-ink">Nutri-Score dos produtos lidos (30 dias)</p>
        <div className="mt-[12px] flex flex-col gap-[7px]">
          {byGrade.map(({ g, n }) => (
            <div key={g} className="flex items-center gap-[10px]">
              <ScoreBadge grade={g} w={26} h={22} radius={6} size={12} />
              <div className="h-[10px] flex-1 rounded-[5px] bg-track">
                <div
                  className="h-full rounded-[5px]"
                  style={{ width: `${(n / maxGrade) * 100}%`, background: `var(--color-score-${g})` }}
                />
              </div>
              <span className="w-[22px] text-right text-[12px] font-bold text-ink">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="m-0 mt-[22px] text-[15px] font-bold text-ink">Últimas leituras</h2>
      <div className="mt-[10px] flex flex-col gap-[8px]">
        {scans.length === 0 && <p className="m-0 text-[13px] text-muted">Nenhuma leitura ainda.</p>}
        {scans.slice(0, 15).map((s) => (
          <div key={s.id} className="flex min-h-[60px] items-center rounded-[14px] bg-white px-[14px] py-[8px]">
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[13px] font-bold text-ink">{s.product_name}</p>
              <p className="m-0 mt-[3px] truncate text-[11px] text-muted">
                {relativeTime(s.created_at, 'day')}
                {s.sugars_100g !== null && ` · açúcar ${fmt(s.sugars_100g)} g/100 g`}
                {s.replaced_scan_id ? ' · trocou por alternativa' : s.saved ? ' · salvou' : ''}
              </p>
            </div>
            <ScoreBadge grade={s.nutriscore} w={30} h={26} radius={8} size={13} />
          </div>
        ))}
      </div>

      <h2 className="m-0 mt-[22px] text-[15px] font-bold text-ink">Alertas recentes</h2>
      <div className="mt-[10px] flex flex-col gap-[8px]">
        {alerts.length === 0 && <p className="m-0 text-[13px] text-muted">Nenhum alerta.</p>}
        {alerts.slice(0, 10).map((a) => {
          const tone = alertTone(a.kind, a.severity)
          return (
            <div key={a.id} className="flex items-start gap-[12px] rounded-[14px] px-[14px] py-[10px]" style={{ background: tone.bg }}>
              <span className="mt-[1px] flex shrink-0" style={{ color: tone.ink }}>
                <AlertIcon kind={a.kind} severity={a.severity} size={18} />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[12px] font-bold" style={{ color: tone.ink }}>
                  {a.title}
                </p>
                <p className="m-0 mt-[2px] text-[11px] text-muted">
                  {a.product_name ?? 'NutriDecifra'} · {relativeTime(a.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mt-[14px]">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}
      <button
        type="button"
        onClick={stop}
        disabled={busy}
        className="mt-[24px] flex h-[48px] w-full items-center justify-center rounded-[14px] border-0 bg-danger-bg text-[14px] font-bold text-danger-ink"
      >
        {busy ? <Spinner /> : 'Encerrar acompanhamento'}
      </button>
    </div>
  )
}
