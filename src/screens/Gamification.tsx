import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BackSquare } from '../components/ui'
import { badges, healthyChoices, levelInfo, streakDays, totalPoints, weeklyChallenge, POINTS } from '../lib/gamification'

const nf = (n: number) => n.toLocaleString('pt-BR')

/** 09 · Gamificação (Suas conquistas) */
export default function Gamification() {
  const { scans, points, profile } = useApp()
  const [selected, setSelected] = useState<string | null>(null)
  const total = totalPoints(points)
  const level = levelInfo(total)
  const streak = streakDays(scans)
  const healthy = healthyChoices(scans)
  const all = badges(scans, points, profile)
  const list = [...all.filter((b) => b.unlocked), ...all.filter((b) => !b.unlocked)]
  const unlocked = all.filter((b) => b.unlocked).length
  const ch = weeklyChallenge(scans)
  const sel = all.find((b) => b.id === selected)

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-page px-[22px] pb-[40px]">
      <div className="flex items-start pt-[54px]">
        <div className="-ml-[6px]">
          <BackSquare />
        </div>
        <div className="ml-[12px] pt-[4px]">
          <h1 className="m-0 text-[22px] font-bold leading-[normal] text-ink">Suas conquistas</h1>
          <p className="m-0 mt-[7px] text-[13px] leading-[normal] text-muted">Continue assim e ganhe mais badges 🌱</p>
        </div>
      </div>

      {/* nível */}
      <div className="relative mt-[24px] h-[160px] overflow-hidden rounded-[22px] bg-brand px-[20px] pt-[20px]">
        <span className="decor absolute right-[8px] top-[5px] size-[100px] rounded-full bg-[#2e8b57]/55" />
        <span className="decor absolute right-[24px] top-[20px] flex size-[64px] items-center justify-center rounded-full bg-brand-light/55 text-[40px]">
          🏆
        </span>
        <p className="relative m-0 text-[11px] font-bold leading-[normal] text-brand-soft">NÍVEL {level.number}</p>
        <p className="relative m-0 mt-[5px] text-[22px] font-bold leading-[normal] text-white">{level.name}</p>
        <p className="relative m-0 mt-[8px] text-[12px] font-medium leading-[normal] text-[#e8f5ee]">
          {level.next ? `${nf(total)} / ${nf(level.next.min)} XP` : `${nf(total)} XP`}
        </p>
        <div className="relative mt-[9px] h-[10px] w-full rounded-[5px] bg-[#155c39]">
          <div
            className="h-full rounded-[5px] bg-brand-light"
            style={{ width: `${Math.max(level.progress * 100, total > 0 ? 3 : 0)}%` }}
          />
        </div>
        <p className="relative m-0 mt-[14px] text-[11px] leading-[normal] text-brand-soft">
          {level.next ? `Faltam ${nf(level.next.min - total)} XP para o próximo nível` : 'Você chegou ao nível máximo!'}
        </p>
      </div>

      {/* estatísticas */}
      <div className="mt-[18px] flex gap-[11px]">
        <div className="h-[82px] flex-1 rounded-[18px] bg-white px-[16px] pt-[14px]">
          <span className="block text-[18px] leading-[22px]">🔥</span>
          <span className="mt-[4px] block text-[18px] font-bold leading-[22px] text-ink">
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
          <span className="block text-[12px] leading-[15px] text-muted">Sequência</span>
        </div>
        <div className="h-[82px] flex-1 rounded-[18px] bg-white px-[16px] pt-[14px]">
          <span className="block text-[18px] leading-[22px]">🥗</span>
          <span className="mt-[4px] block text-[18px] font-bold leading-[22px] text-ink">{healthy}</span>
          <span className="block text-[12px] leading-[15px] text-muted">Escolhas saudáveis</span>
        </div>
      </div>

      {/* badges */}
      <div className="mt-[22px] flex items-center justify-between">
        <h2 className="m-0 text-[15px] font-bold leading-[normal] text-ink">Conquistas</h2>
        <span className="mr-[8px] text-[12px] font-medium text-muted">
          {unlocked} / {all.length}
        </span>
      </div>
      <div className="mt-[14px] grid grid-cols-4 gap-y-[14px]">
        {list.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelected(b.id === selected ? null : b.id)}
            className="flex flex-col items-center border-0 bg-transparent p-0"
            aria-label={`${b.label}: ${b.description}${b.unlocked ? ' (conquistada)' : ' (bloqueada)'}`}
          >
            <span
              className="flex size-[62px] items-center justify-center rounded-full text-[28px]"
              style={{
                background: b.unlocked ? b.bg : '#eef1ef',
                outline: selected === b.id ? '2px solid #1f7a4d' : 'none',
              }}
            >
              {b.unlocked ? b.icon : <span className="opacity-60">🔒</span>}
            </span>
            <span className={`mt-[6px] text-[10px] leading-[12px] ${b.unlocked ? 'font-medium text-ink' : 'text-faint'}`}>
              {b.unlocked ? b.label : 'Bloqueado'}
            </span>
          </button>
        ))}
      </div>
      {sel && (
        <p className="animate-fadeup m-0 mt-[12px] rounded-[12px] bg-white px-[14px] py-[10px] text-[12px] text-muted">
          <b className="text-ink">{sel.icon} {sel.label}:</b> {sel.description}. {sel.unlocked ? '✓ Conquistada' : 'Ainda bloqueada'}
        </p>
      )}

      {/* desafio da semana */}
      <div className="mt-[22px] min-h-[128px] rounded-[20px] bg-white px-[16px] pb-[18px] pt-[16px]">
        <p className="m-0 text-[10px] font-bold leading-[normal] text-score-d">DESAFIO DA SEMANA</p>
        <p className="m-0 mt-[6px] text-[15px] font-bold leading-[normal] text-ink">Escaneie {ch.goal} produtos diferentes</p>
        <p className="m-0 mt-[6px] text-[12px] leading-[normal] text-muted">
          🎁 Recompensa: {POINTS.weeklyChallenge} XP + badge especial
        </p>
        <div className="mt-[12px] flex items-center gap-[14px]">
          <div className="h-[10px] flex-1 rounded-[5px] bg-track">
            <div className="h-full rounded-[5px] bg-score-d" style={{ width: `${(ch.done / ch.goal) * 100}%` }} />
          </div>
          <span className="text-[14px] font-bold text-ink">
            {ch.done} / {ch.goal}
          </span>
        </div>
      </div>

      <p className="m-0 mt-[14px] text-[11px] leading-[1.5] text-faint">
        Como ganhar XP: salvar um produto (+{POINTS.save}), salvar um produto nota A ou B (+{POINTS.healthySave}), trocar por uma
        alternativa melhor (+{POINTS.alternative}), completar o desafio da semana (+{POINTS.weeklyChallenge}).
      </p>
    </div>
  )
}
