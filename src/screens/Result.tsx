import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BackArrow, ErrorBox, Loading, ProductThumb, Spinner } from '../components/ui'
import { goBack, useScan } from '../lib/useScan'
import {
  GRADE_WORD,
  alertTone,
  analyze,
  fmt,
  gradeColor,
  productAlerts,
  simpleAlertText,
  spoonsText,
} from '../lib/nutrition'
import { saveScan, toggleFavorite } from '../lib/actions'

/** 06 · Resultado (análise do produto) */
export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile, scans, setLocal, a11y } = useApp()
  const { scan, missing } = useScan(id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const spoken = useRef(false)

  const analysis = scan ? analyze(scan.product, profile) : null
  const alerts = scan ? productAlerts(scan.product, profile) : []

  // leitura em voz alta (Acessibilidade → Leitura em voz)
  const scanId = scan?.id
  useEffect(() => {
    if (!scan || !a11y.voice || spoken.current || !('speechSynthesis' in window)) return
    spoken.current = true
    const an = analyze(scan.product, profile)
    const parts = [
      scan.product_name,
      scan.nutriscore ? `Nutri-Score ${scan.nutriscore.toUpperCase()}, ${GRADE_WORD[scan.nutriscore]}.` : 'Nutri-Score não informado.',
      an.spoons !== null ? `${an.basis.label}, ${spoonsText(an.spoons)}.` : '',
      ...productAlerts(scan.product, profile).map((a) =>
        a11y.simpleLanguage ? simpleAlertText(a, scan.product) : a.short.replace('·', ','),
      ),
    ]
    const u = new SpeechSynthesisUtterance(parts.join(' '))
    u.lang = 'pt-BR'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, a11y.voice])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (missing) {
    return (
      <div className="flex h-full flex-col gap-[16px] bg-page p-[22px] pt-[62px]">
        <BackArrow to="/inicio" />
        <ErrorBox>Esta análise não foi encontrada.</ErrorBox>
      </div>
    )
  }
  if (!scan || !analysis || !session) return <Loading />

  const grade = scan.nutriscore
  const pct = analysis.sugarQuotaPct
  const limit = profile?.sugar_limit_g ?? 25
  const barColor = pct === null ? '#9aa89f' : pct >= 75 ? '#e84141' : pct >= 40 ? '#ffb300' : '#43a047'
  const spoonsRounded = analysis.spoons !== null ? Math.round(analysis.spoons) : 0
  const sub = [scan.brand, scan.quantity].filter(Boolean).join(' · ')

  async function onSave() {
    if (!scan || !session) return
    if (scan.saved) {
      navigate('/historico')
      return
    }
    // Personalizar alertas → "Alertas em tempo real": avisa antes de salvar produtos críticos
    const critical = alerts.filter((a) => a.severity === 'critical')
    if ((profile?.realtime_alerts ?? true) && critical.length > 0) {
      const ok = window.confirm(`Atenção: ${critical.map((a) => a.title.toLowerCase()).join(', ')}.\n\nDeseja salvar mesmo assim?`)
      if (!ok) return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await saveScan(session.user.id, profile, scan, scans)
      setLocal.scans((list) => list.map((s) => (s.id === res.scan.id ? res.scan : s)))
      setLocal.points((list) => [...res.newPoints, ...list])
      setLocal.alerts((list) => [...res.newAlerts, ...list])
      navigate('/salvo', { state: res, replace: false })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onFavorite() {
    if (!scan) return
    try {
      const updated = await toggleFavorite(scan)
      setLocal.scans((list) => list.map((s) => (s.id === updated.id ? updated : s)))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex h-full flex-col bg-page">
      <div className="no-scrollbar flex-1 overflow-y-auto px-[22px]">
        {/* cabeçalho */}
        <div className="flex h-[110px] items-start justify-between pt-[62px]">
          <BackArrow onClick={() => goBack(navigate)} />
          <h1 className="m-0 mt-[4px] text-[16px] font-bold leading-[normal] text-ink">Análise do produto</h1>
          <button
            type="button"
            onClick={onFavorite}
            aria-pressed={scan.favorite}
            aria-label={scan.favorite ? 'Remover dos favoritos' : 'Favoritar'}
            className="-m-[10px] flex size-[44px] items-center justify-center border-0 bg-transparent p-0 text-[22px] leading-none"
            style={{ color: scan.favorite ? '#e84141' : '#1a2b22' }}
          >
            {scan.favorite ? '♥' : '♡'}
          </button>
        </div>

        {/* produto */}
        <div className="flex min-h-[126px] items-start rounded-[20px] bg-white px-[16px] py-[18px]">
          <ProductThumb product={scan.product} imageUrl={scan.image_url} grade={grade} size={90} radius={16} emojiSize={48} />
          <div className="ml-[16px] min-w-0 flex-1 pt-[2px]">
            <p className="m-0 text-[17px] font-bold leading-[1.2] text-ink">{scan.product_name}</p>
            {sub && <p className="m-0 mt-[4px] text-[13px] leading-[normal] text-muted">{sub}</p>}
            <span
              className="mt-[12px] inline-flex h-[28px] items-center rounded-[8px] px-[11px] text-[12px] font-bold text-white"
              style={{ background: gradeColor(grade) }}
            >
              {grade ? `${GRADE_WORD[grade]} · ${grade.toUpperCase()}` : 'Nutri-Score indisponível'}
            </span>
          </div>
        </div>

        {/* colheres de açúcar */}
        <div className="mt-[14px] min-h-[120px] rounded-[20px] bg-white px-[16px] pb-[18px] pt-[16px]">
          <p className="m-0 text-[13px] leading-[normal] text-muted">
            {analysis.sugarBasis !== null
              ? `${analysis.basis.label.charAt(0).toUpperCase()}${analysis.basis.label.slice(1)}, contém o equivalente a`
              : 'Contém o equivalente a'}
          </p>
          <p className="m-0 mt-[3px] text-[20px] font-bold leading-[normal] text-ink">
            {analysis.sugarBasis !== null ? spoonsText(analysis.spoons) : 'Açúcar não informado no rótulo'}
          </p>
          {spoonsRounded > 0 && (
            <p className="m-0 mt-[14px] text-[22px] leading-[normal]" aria-hidden>
              {Array.from({ length: Math.min(spoonsRounded, 10) }, () => '🥄').join('  ')}
              {spoonsRounded > 10 && <span className="ml-[6px] text-[14px] font-bold text-muted">+{spoonsRounded - 10}</span>}
            </p>
          )}
          {analysis.sugarBasis !== null && (
            <p className="m-0 mt-[10px] text-[11px] text-faint">
              {fmt(analysis.sugarBasis)} g de açúcar · 1 colher de chá = 4 g
            </p>
          )}
        </div>

        {/* cota diária */}
        <div className="mt-[16px] rounded-[20px] bg-white px-[16px] pb-[16px] pt-[16px]">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[13px] font-medium leading-[normal] text-muted">Cota diária de açúcar</p>
            <p className="m-0 text-[18px] font-bold leading-[normal]" style={{ color: barColor }}>
              {pct !== null ? `${fmt(pct, 0)}%` : '—'}
            </p>
          </div>
          <div className="mt-[14px] h-[10px] w-full rounded-[5px] bg-track">
            <div className="h-full rounded-[5px]" style={{ width: `${Math.min(pct ?? 0, 100)}%`, background: barColor }} />
          </div>
          <p className="m-0 mt-[12px] text-[11px] leading-[normal] text-muted">
            {pct === null
              ? 'Sem dados de açúcar para calcular'
              : pct >= 100
                ? `Acima do recomendado para o seu perfil (${limit} g por dia)`
                : pct >= 50
                  ? `Mais da metade do seu limite de ${limit} g por dia`
                  : `Dentro do seu limite de ${limit} g por dia`}
          </p>
        </div>

        {/* alertas */}
        <h2 className="m-0 mt-[20px] text-[15px] font-bold leading-[normal] text-ink">Alertas para você</h2>
        <div className="mt-[12px] flex flex-col gap-[10px] pb-[24px]">
          {alerts.length === 0 && (
            <div className="flex min-h-[52px] items-center rounded-[14px] bg-brand-tint px-[16px] text-[12px] font-medium text-brand">
              <span className="mr-[14px] text-[18px]">✅</span>
              Nenhum alerta para o seu perfil
            </div>
          )}
          {alerts.map((a) => {
            const tone = alertTone(a.kind, a.severity)
            return (
              <div
                key={a.kind}
                className="flex min-h-[52px] items-center rounded-[14px] px-[16px] py-[8px]"
                style={{ background: tone.bg }}
              >
                <span className="mr-[14px] w-[20px] shrink-0 text-[18px] leading-none">{a.emoji}</span>
                <span className="text-[12px] font-medium leading-[1.35]" style={{ color: tone.ink }}>
                  {a11y.simpleLanguage ? simpleAlertText(a, scan.product) : a.short}
                </span>
              </div>
            )
          })}
          {error && <ErrorBox>{error}</ErrorBox>}
          <p className="m-0 mt-[4px] text-[10px] leading-[1.4] text-faint">
            Dados: Open Food Facts (código {scan.barcode}). Confira sempre o rótulo da embalagem.
          </p>
        </div>
      </div>

      {/* ações */}
      <div className="flex shrink-0 gap-[12px] bg-page px-[22px] pb-[23px] pt-[10px]">
        <button
          type="button"
          onClick={() => navigate(`/alternativas/${scan.id}`)}
          className="h-[54px] flex-[216] rounded-[14px] border-0 bg-brand px-[12px] text-left text-[13px] font-bold text-white"
          style={{ paddingLeft: 20 }}
        >
          Ver alternativas melhores
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="flex h-[54px] flex-[103] items-center justify-center rounded-[14px] border-[1.5px] border-solid border-brand bg-white text-[13px] font-bold text-brand"
        >
          {busy ? <Spinner /> : scan.saved ? 'Salvo ✓' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
