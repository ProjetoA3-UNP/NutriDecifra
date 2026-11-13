import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BackArrow, ErrorBox, Loading, ScoreBadge, Spinner } from '../components/ui'
import { useScan } from '../lib/useScan'
import { cachedAlternative } from '../lib/altCache'
import { fetchProduct } from '../lib/off'
import { compare } from '../lib/compare'
import { analyze, gradeOf, productName, spoonsText } from '../lib/nutrition'
import { chooseAlternative } from '../lib/actions'
import type { OffProduct } from '../lib/types'

/** 16 · Detalhe alternativa (comparar) */
export default function AlternativeDetail() {
  const { id, code = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { session, profile, scans, setLocal } = useApp()
  const { scan } = useScan(id)
  const [alt, setAlt] = useState<OffProduct | null>((location.state as { product?: OffProduct } | null)?.product ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (alt || !scan) return
    let active = true
    ;(async () => {
      try {
        const p = (await cachedAlternative(scan.id, code)) ?? (await fetchProduct(code))
        if (active) setAlt(p)
      } catch (e) {
        if (active) setError((e as Error).message)
      }
    })()
    return () => {
      active = false
    }
  }, [alt, scan, code])

  if (error && !alt) {
    return (
      <div className="flex h-full flex-col gap-[16px] bg-page p-[22px] pt-[62px]">
        <BackArrow />
        <ErrorBox>Não foi possível carregar este produto. Verifique sua conexão.</ErrorBox>
      </div>
    )
  }
  if (!scan || !alt || !session) return <Loading />

  const c = compare(scan.product, alt, profile)
  const aOrig = analyze(scan.product, profile)
  const gOrig = scan.nutriscore
  const gAlt = gradeOf(alt)
  // barra = açúcar da alternativa em relação ao produto lido (só quando tem menos açúcar)
  const ratio =
    c.sugarOrig !== null && c.sugarAlt !== null && c.sugarOrig > 0 && c.sugarAlt < c.sugarOrig ? c.sugarAlt / c.sugarOrig : null

  async function choose() {
    if (!scan || !alt || !session) return
    setBusy(true)
    setError(null)
    try {
      const res = await chooseAlternative(session.user.id, profile, scan, alt, scans)
      setLocal.scans((list) => [res.scan, ...list])
      setLocal.points((list) => [...res.newPoints, ...list])
      setLocal.alerts((list) => [...res.newAlerts, ...list])
      navigate('/salvo', { state: res })
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
            <BackArrow onClick={() => navigate(`/alternativas/${scan.id}`, { replace: true })} />
          </div>
          <div className="ml-[16px]">
            <h1 className="m-0 text-[22px] font-bold leading-[normal] text-ink">Comparar alternativa</h1>
            <p className="m-0 mt-[7px] text-[13px] leading-[normal] text-muted">Veja por que esta opção é melhor</p>
          </div>
        </div>

        {/* produto lido */}
        <div className="relative mt-[24px] min-h-[132px] rounded-[20px] bg-danger-bg px-[20px] pb-[20px] pt-[18px]">
          <p className="m-0 text-[10px] font-bold leading-[normal] text-danger-ink">VOCÊ ESCANEOU</p>
          <p className="m-0 mt-[14px] pr-[48px] text-[17px] font-bold leading-[1.2] text-ink">{scan.product_name}</p>
          <p className="m-0 mt-[9px] text-[13px] leading-[normal] text-muted">
            {aOrig.spoons !== null ? `${spoonsText(aOrig.spoons).toLowerCase()} · ` : ''}score {gOrig?.toUpperCase() ?? '?'}
          </p>
          <span className="absolute right-[15px] top-[44px]">
            <ScoreBadge grade={gOrig} w={36} h={32} radius={10} size={15} />
          </span>
        </div>

        {/* alternativa */}
        <div className="relative mt-[22px] min-h-[164px] rounded-[20px] bg-white px-[20px] pb-[24px] pt-[20px]">
          <p className="m-0 text-[10px] font-bold leading-[normal] text-brand">MELHOR OPÇÃO</p>
          <p className="m-0 mt-[13px] pr-[48px] text-[18px] font-bold leading-[1.2] text-ink">{productName(alt)}</p>
          <p className="m-0 mt-[8px] text-[13px] leading-[normal] text-muted">{c.pros.join(' · ')}</p>
          <span className="absolute right-[15px] top-[46px]">
            <ScoreBadge grade={gAlt} w={36} h={32} radius={10} size={15} />
          </span>
          {ratio !== null && (
            <div className="mt-[24px]" title="Açúcar da alternativa comparado ao produto lido">
              <div className="h-[8px] w-full rounded-[4px] bg-track">
                <div className="h-full rounded-[4px] bg-score-a" style={{ width: `${Math.max(ratio * 100, 2)}%` }} />
              </div>
              <p className="m-0 mt-[6px] text-[10px] text-faint">Açúcar comparado ao produto que você escaneou</p>
            </div>
          )}
        </div>

        {/* impacto */}
        <div className="mt-[22px] min-h-[116px] rounded-[20px] bg-brand-tint px-[20px] pb-[20px] pt-[22px]">
          <p className="m-0 text-[16px] font-bold leading-[normal] text-ink">Impacto para seu perfil</p>
          <p className="m-0 mt-[13px] text-[13px] leading-[1.4] text-brand">{c.impact}</p>
        </div>
        {error && (
          <div className="mt-[16px]">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </div>

      <div className="shrink-0 px-[22px] pb-[40px] pt-[16px]">
        <button
          type="button"
          onClick={choose}
          disabled={busy}
          className="flex h-[56px] w-full items-center justify-center rounded-[16px] border-0 bg-brand text-[15px] font-bold text-white"
        >
          {busy ? <Spinner light /> : 'Escolher alternativa'}
        </button>
      </div>
    </div>
  )
}
