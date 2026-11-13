import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import savedBg from '../assets/figma/saved-icon-bg.svg'
import type { SaveResult } from '../lib/actions'
import { POINTS, levelInfo, streakDays, totalPoints } from '../lib/gamification'

/** 15 · Produto salvo */
export default function Saved() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: SaveResult | null }
  const { scans, points } = useApp()
  if (!state?.scan) return <Navigate to="/historico" replace />

  const streak = streakDays(scans)
  const total = totalPoints(points)
  const level = levelInfo(total)
  const sugarAlert = state.newAlerts.find((a) => a.kind === 'daily_sugar')
  const swapped = Boolean(state.scan.replaced_scan_id)

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto bg-page px-[22px]">
      <div className="flex shrink-0 flex-col items-center pt-[96px]">
        <div className="relative flex size-[132px] items-center justify-center">
          <img src={savedBg} alt="" width={132} height={132} className="absolute inset-0" />
          <span className="relative text-[72px] font-bold leading-none text-white">✓</span>
        </div>
        <h1 className="m-0 mt-[32px] text-[28px] font-bold leading-[normal] text-ink">
          {swapped ? 'Alternativa escolhida' : 'Produto salvo'}
        </h1>
        <p className="m-0 mt-[6px] text-center text-[14px] leading-[normal] text-muted">A decisão foi registrada no histórico.</p>
      </div>

      <div className="mt-[34px] flex min-h-[128px] shrink-0 items-center rounded-[22px] bg-white px-[20px] py-[20px]">
        <span className="text-[40px] leading-none">🏆</span>
        <div className="ml-[16px]">
          <p className="m-0 text-[22px] font-bold leading-[normal] text-ink">
            {state.pointsEarned > 0 ? `+${state.pointsEarned} pontos` : 'Produto já pontuado'}
          </p>
          <p className="m-0 mt-[8px] text-[13px] leading-[1.35] text-muted">
            {state.challengeCompleted
              ? `Desafio da semana concluído! (+${POINTS.weeklyChallenge})`
              : streak > 0
                ? `Sequência de ${streak} ${streak === 1 ? 'dia' : 'dias'} atualizada`
                : 'Pontos registrados'}
          </p>
        </div>
      </div>

      <div className="mt-[20px] flex min-h-[82px] shrink-0 items-center rounded-[18px] bg-brand-tint px-[20px] py-[14px]">
        <p className="m-0 text-[13px] font-medium leading-[1.4] text-brand">
          {sugarAlert
            ? `${sugarAlert.title}: ${sugarAlert.description}`
            : `Total acumulado: ${total} pontos · nível ${level.number} (${level.name}).`}
        </p>
      </div>

      <div className="min-h-[24px] flex-1" />
      <div className="shrink-0 pb-[66px]">
        <button
          type="button"
          onClick={() => navigate('/historico', { replace: true })}
          className="h-[54px] w-full rounded-[16px] border-0 bg-brand text-[15px] font-bold text-white"
        >
          Ver histórico
        </button>
        <div className="mt-[16px] flex gap-[16px]">
          <button
            type="button"
            onClick={() => navigate('/inicio', { replace: true })}
            className="h-[50px] flex-1 rounded-[14px] border-0 bg-white text-[14px] font-bold text-brand"
          >
            Início
          </button>
          <button
            type="button"
            onClick={() => navigate('/conquistas', { replace: true })}
            className="h-[50px] flex-1 rounded-[14px] border-0 bg-white text-[14px] font-bold text-brand"
          >
            Conquistas
          </button>
        </div>
      </div>
    </div>
  )
}
