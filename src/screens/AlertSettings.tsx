import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BackArrow, ErrorBox, Loading, Spinner, Switch } from '../components/ui'
import type { Restriction } from '../lib/types'
import { analyze, fmt } from '../lib/nutrition'
import { isToday } from '../lib/time'
import { Check, Plus } from 'lucide-react'

const CHIPS: { id: Restriction; label: string; offBg: string; offInk: string }[] = [
  { id: 'gluten', label: 'Glúten', offBg: '#f0f4f1', offInk: '#5c6b63' },
  { id: 'lactose', label: 'Lactose', offBg: '#f0f4f1', offInk: '#5c6b63' },
  { id: 'sugar', label: 'Açúcar', offBg: '#fdecec', offInk: '#9b1c1c' },
  { id: 'sodium', label: 'Sódio', offBg: '#fff4ec', offInk: '#7a5c00' },
]

function Stepper({ onMinus, onPlus, label }: { onMinus: () => void; onPlus: () => void; label: string }) {
  const btn = 'flex size-[28px] items-center justify-center rounded-full border-0 bg-track text-[16px] font-bold text-brand'
  return (
    <span className="flex shrink-0 gap-[6px]">
      <button type="button" className={btn} onClick={onMinus} aria-label={`Diminuir ${label}`}>
        −
      </button>
      <button type="button" className={btn} onClick={onPlus} aria-label={`Aumentar ${label}`}>
        +
      </button>
    </span>
  )
}

/** 14 · Personalizar alertas */
export default function AlertSettings() {
  const navigate = useNavigate()
  const { profile, updateProfile, scans } = useApp()
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [sugar, setSugar] = useState(25)
  const [sodium, setSodium] = useState(400)
  const [realtime, setRealtime] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setRestrictions(profile.restrictions)
    setSugar(profile.sugar_limit_g)
    setSodium(profile.sodium_limit_mg)
    setRealtime(profile.realtime_alerts)
  }, [profile])

  if (!profile) return <Loading />

  const sugarToday = scans
    .filter((s) => s.saved && isToday(s.created_at))
    .reduce((sum, s) => sum + (analyze(s.product, profile).sugarBasis ?? 0), 0)
  const fill = Math.min(sugarToday / sugar, 1)

  const toggle = (r: Restriction) =>
    setRestrictions((list) => (list.includes(r) ? list.filter((x) => x !== r) : [...list, r]))

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await updateProfile({ restrictions, sugar_limit_g: sugar, sodium_limit_mg: sodium, realtime_alerts: realtime })
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
      navigate(idx > 0 ? '/alertas' : '/inicio', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-page">
      <div className="no-scrollbar flex-1 overflow-y-auto px-[22px]">
        <div className="flex items-start pt-[58px]">
          <div className="pt-[2px]">
            <BackArrow />
          </div>
          <div className="ml-[16px]">
            <h1 className="m-0 text-[23px] font-bold leading-[normal] text-ink">Personalizar alertas</h1>
            <p className="m-0 mt-[6px] text-[13px] leading-[normal] text-muted">Defina restrições e metas para os alertas</p>
          </div>
        </div>

        <section className="mt-[24px] rounded-[22px] bg-white px-[20px] pb-[24px] pt-[22px]">
          <h2 className="m-0 text-[17px] font-bold leading-[normal] text-ink">Restrições alimentares</h2>
          <div className="mt-[18px] flex flex-wrap gap-x-[12px] gap-y-[16px]">
            {CHIPS.map((c) => {
              const on = restrictions.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className="inline-flex h-[36px] items-center gap-[5px] rounded-[18px] border-0 px-[20px] text-[13px] font-bold"
                  style={{ background: on ? '#1f7a4d' : c.offBg, color: on ? '#fff' : c.offInk }}
                >
                  {on ? <Check size={14} strokeWidth={3} aria-hidden /> : <Plus size={14} strokeWidth={2.6} aria-hidden />}
                  {c.label}
                </button>
              )
            })}
          </div>
          <p className="m-0 mt-[14px] text-[11px] leading-[1.4] text-faint">
            Glúten e lactose: alerta crítico quando o produto contém. Açúcar e sódio: alertas desses nutrientes viram críticos.
          </p>
        </section>

        <section className="mt-[18px] rounded-[22px] bg-white px-[20px] pb-[22px] pt-[22px]">
          <h2 className="m-0 text-[17px] font-bold leading-[normal] text-ink">Objetivo do dia</h2>
          <div className="mt-[20px] flex items-center justify-between">
            <p className="m-0 text-[14px] font-medium leading-[normal] text-ink">Açúcar: até {sugar} g</p>
            <Stepper label="limite de açúcar" onMinus={() => setSugar((v) => Math.max(5, v - 5))} onPlus={() => setSugar((v) => Math.min(200, v + 5))} />
          </div>
          <div className="mt-[8px] h-[8px] w-full rounded-[4px] bg-track" title="Açúcar dos produtos salvos hoje">
            <div className="h-full rounded-[4px] bg-score-c" style={{ width: `${fill * 100}%` }} />
          </div>
          <p className="m-0 mt-[6px] text-[11px] text-faint">Hoje: {fmt(sugarToday)} g nos produtos salvos</p>
          <div className="mt-[16px] flex items-center justify-between">
            <p className="m-0 text-[14px] font-medium leading-[normal] text-ink">Sódio: alerta acima de {sodium} mg</p>
            <Stepper label="limite de sódio" onMinus={() => setSodium((v) => Math.max(50, v - 50))} onPlus={() => setSodium((v) => Math.min(5000, v + 50))} />
          </div>
        </section>

        <section className="mt-[18px] flex min-h-[100px] items-center rounded-[22px] bg-white px-[20px] py-[20px]">
          <div className="flex-1">
            <h2 className="m-0 text-[16px] font-bold leading-[normal] text-ink">Alertas em tempo real</h2>
            <p className="m-0 mt-[8px] text-[12px] leading-[normal] text-muted">Avisar antes de salvar produtos críticos</p>
          </div>
          <Switch on={realtime} onChange={setRealtime} label="Alertas em tempo real" />
        </section>
        {error && (
          <div className="mt-[16px]">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </div>
      <div className="shrink-0 px-[22px] pb-[56px] pt-[16px]">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex h-[56px] w-full items-center justify-center rounded-[16px] border-0 bg-brand text-[15px] font-bold text-white"
        >
          {busy ? <Spinner light /> : 'Salvar preferências'}
        </button>
      </div>
    </div>
  )
}
