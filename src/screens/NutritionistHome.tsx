import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Info, TriangleExclamationPoint, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ErrorBox, Spinner } from '../components/ui'
import { StaffScreen, StatCard } from '../components/staff'
import { fetchMyPatients, type PatientSummary } from '../lib/care'
import { RESTRICTION_LABEL } from '../lib/labels'
import { relativeTime } from '../lib/time'

/** Nutricionista · Painel de pacientes */
export default function NutritionistHome() {
  const { session } = useApp()
  const [list, setList] = useState<PatientSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let alive = true
    fetchMyPatients(userId)
      .then((l) => alive && setList(l))
      .catch((e: Error) => {
        if (!alive) return
        setError(e.message)
        setList([])
      })
    return () => {
      alive = false
    }
  }, [userId])

  const total = list?.length ?? 0
  const critical = list?.reduce((s, p) => s + p.critical30, 0) ?? 0
  const scans = list?.reduce((s, p) => s + p.scans30, 0) ?? 0

  return (
    <StaffScreen title="Meus pacientes" subtitle="Acompanhe as escolhas de quem autorizou o compartilhamento.">
      <div className="mt-[20px] flex gap-[10px]">
        <StatCard value={list ? total : '—'} label={total === 1 ? 'paciente ativo' : 'pacientes ativos'} tone="brand" />
        <StatCard value={list ? scans : '—'} label="leituras em 30 dias" />
        <StatCard value={list ? critical : '—'} label="alertas críticos em 30 dias" tone={critical ? 'danger' : 'ink'} />
      </div>

      {error && (
        <div className="mt-[16px]">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}

      <h2 className="m-0 mt-[24px] text-[16px] font-bold leading-[normal] text-ink">Pacientes</h2>
      <div className="mt-[12px] flex flex-col gap-[12px]">
        {!list && (
          <div className="flex justify-center py-[24px]">
            <Spinner />
          </div>
        )}
        {list?.length === 0 && !error && (
          <div className="rounded-[18px] bg-white px-[18px] py-[18px] text-[13px] leading-[1.5] text-muted">
            <span className="flex items-center gap-[8px] font-bold text-ink">
              <Users size={18} className="text-brand" aria-hidden /> Nenhum paciente vinculado ainda
            </span>
            <span className="mt-[6px] block">
              Peça ao paciente para abrir o NutriDecifra em <b>Perfil → Meu nutricionista</b> e informar o seu e-mail
              <b className="text-brand"> {session?.user.email}</b>. O acesso só começa depois que ele autorizar.
            </span>
          </div>
        )}
        {list?.map((p) => {
          const name = p.profile?.name || p.profile?.email || 'Paciente'
          return (
            <Link
              key={p.link.id}
              to={`/profissional/paciente/${p.link.patient_id}`}
              className="flex min-h-[86px] items-center rounded-[18px] bg-white px-[14px] py-[12px] no-underline"
            >
              <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-brand-tint text-[18px] font-bold text-brand">
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="ml-[12px] min-w-0 flex-1">
                <p className="m-0 truncate text-[14px] font-bold leading-[normal] text-ink">{name}</p>
                <p className="m-0 mt-[4px] truncate text-[12px] leading-[normal] text-muted">
                  {p.scans30} {p.scans30 === 1 ? 'leitura' : 'leituras'} em 30 dias · {p.healthySaved} escolhas A/B
                </p>
                <p className="m-0 mt-[4px] flex flex-wrap items-center gap-[6px] text-[11px] leading-[normal] text-faint">
                  {p.lastActivity ? `Ativo ${relativeTime(p.lastActivity)}` : 'Sem leituras ainda'}
                  {(p.profile?.restrictions ?? []).map((r) => (
                    <span key={r} className="rounded-[8px] bg-page px-[6px] py-[1px] font-medium text-muted">
                      {RESTRICTION_LABEL[r]}
                    </span>
                  ))}
                </p>
              </div>
              {p.critical30 > 0 && (
                <span
                  className="ml-[8px] flex h-[24px] shrink-0 items-center gap-[4px] rounded-[12px] bg-danger-bg px-[8px] text-[11px] font-bold text-danger-ink"
                  title="Alertas críticos em 30 dias"
                >
                  <TriangleExclamationPoint size={13} aria-hidden />
                  {p.critical30}
                </span>
              )}
              <ChevronRight size={18} className="ml-[6px] shrink-0 text-faint" aria-hidden />
            </Link>
          )
        })}
      </div>

      <p className="m-0 mt-[22px] flex gap-[8px] rounded-[14px] bg-brand-tint px-[14px] py-[12px] text-[12px] leading-[1.45] text-brand">
        <Info size={16} className="mt-[1px] shrink-0" aria-hidden />
        Você vê os dados só para leitura e apenas enquanto o paciente mantiver a autorização. O NutriDecifra é
        informativo e não substitui a sua avaliação profissional.
      </p>
    </StaffScreen>
  )
}
