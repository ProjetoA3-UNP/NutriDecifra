import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BackSquare, Screen } from '../components/ui'
import { alertEmoji, alertTone } from '../lib/nutrition'
import { relativeTime } from '../lib/time'
import { markAlertsRead } from '../lib/actions'

type Filter = 'all' | 'critical' | 'attention'

/** 07 · Alertas inteligentes */
export default function Alerts() {
  const { alerts, session, setLocal } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const critical = alerts.filter((a) => a.severity === 'critical').length
  const attention = alerts.filter((a) => a.severity === 'attention').length
  const list = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter)

  // ao abrir a tela, os alertas passam a contar como vistos
  const unread = alerts.some((a) => !a.read)
  useEffect(() => {
    if (!session || !unread) return
    const t = setTimeout(() => {
      void markAlertsRead(session.user.id).then(() => setLocal.alerts((l) => l.map((a) => ({ ...a, read: true }))))
    }, 1500)
    return () => clearTimeout(t)
  }, [session, unread, setLocal])

  const chip = (id: Filter, label: string, w: number) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      aria-pressed={filter === id}
      className={`h-[34px] shrink-0 rounded-[17px] border-0 px-[15px] text-[12px] ${
        filter === id ? 'bg-brand font-bold text-white' : 'bg-white font-medium text-muted'
      }`}
      style={{ minWidth: w }}
    >
      {label}
    </button>
  )

  return (
    <Screen nav>
      <div className="px-[22px] pt-[58px]">
        <div className="flex items-start">
          <div className="-ml-[6px]">
            <BackSquare to="/inicio" />
          </div>
          <div className="ml-[12px] min-w-0 flex-1 pt-[2px]">
            <h1 className="m-0 text-[22px] font-bold leading-[normal] text-ink">Alertas inteligentes</h1>
            <p className="m-0 mt-[4px] text-[13px] leading-[normal] text-muted">Avisos personalizados pelo seu perfil</p>
          </div>
          <Link
            to="/alertas/personalizar"
            aria-label="Personalizar alertas"
            className="mt-[4px] flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-white text-[22px] text-ink no-underline"
          >
            ⚙
          </Link>
        </div>

        <div className="mt-[30px] flex gap-[8px]">
          {chip('all', 'Todos', 68)}
          {chip('critical', `Críticos · ${critical}`, 90)}
          {chip('attention', `Atenção · ${attention}`, 96)}
        </div>

        <div className="mt-[20px] flex flex-col gap-[12px]">
          {list.length === 0 && (
            <div className="rounded-[18px] bg-white px-[20px] py-[22px] text-[13px] leading-[1.5] text-muted">
              {alerts.length === 0
                ? 'Nenhum alerta por enquanto. Quando você ler um produto que não combina com o seu perfil, o aviso aparece aqui.'
                : 'Nenhum alerta neste filtro.'}
            </div>
          )}
          {list.map((a) => {
            const tone = alertTone(a.kind, a.severity)
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => a.scan_id && navigate(`/resultado/${a.scan_id}`)}
                className="relative block min-h-[110px] w-full overflow-hidden rounded-[18px] border-0 bg-white p-0 text-left"
              >
                <span className="absolute inset-y-0 left-0 w-[5px]" style={{ background: tone.stripe }} />
                <div className="flex px-[20px] pt-[16px]">
                  <span
                    className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px] text-[22px]"
                    style={{ background: tone.bg }}
                  >
                    {alertEmoji(a.kind, a.severity)}
                  </span>
                  <div className="ml-[14px] min-w-0 flex-1">
                    <div className="flex items-start gap-[8px]">
                      <p className="m-0 flex-1 text-[14px] font-bold leading-[normal] text-ink">{a.title}</p>
                      {a.severity === 'critical' && (
                        <span className="mt-[2px] flex h-[22px] shrink-0 items-center rounded-[11px] bg-danger-bg px-[8px] text-[9px] font-bold text-danger-ink">
                          CRÍTICO
                        </span>
                      )}
                    </div>
                    <p className="m-0 mt-[5px] text-[12px] leading-[1.25] text-muted">{a.description}</p>
                  </div>
                </div>
                <p className="m-0 px-[20px] pb-[14px] pt-[10px] text-[11px] font-medium leading-[normal] text-brand">
                  {a.product_name ?? 'NutriDecifra'} · {relativeTime(a.created_at)}
                  {!a.read && <span className="ml-[6px] inline-block size-[6px] rounded-full bg-score-e align-middle" />}
                </p>
              </button>
            )
          })}
        </div>

        <Link
          to="/alertas/personalizar"
          className="mt-[26px] flex min-h-[60px] items-center rounded-[14px] bg-brand-tint px-[20px] py-[12px] text-[12px] font-medium leading-[1.25] text-brand no-underline"
        >
          💡&nbsp;&nbsp;Personalize seus alertas no perfil para receber avisos mais precisos.
        </Link>
      </div>
    </Screen>
  )
}
