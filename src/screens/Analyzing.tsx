import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { fetchProduct, ProductNotFoundError } from '../lib/off'
import { fmt, nutrient100, isLiquid, num, productName } from '../lib/nutrition'
import { recordScan } from '../lib/actions'
import type { OffProduct, Scan } from '../lib/types'
import { Check, Circle, ExternalLink, X } from 'lucide-react'

type Phase = 'fetch' | 'compare' | 'record' | 'done' | 'notfound' | 'error'

function labelLines(p: OffProduct | null, code: string): string[] {
  if (!p) return ['Código de barras', code, '', 'Buscando informação', 'nutricional…']
  const unit = isLiquid(p) ? 'ml' : 'g'
  const lines = ['Informação Nutricional']
  const serving = num(p.serving_quantity)
  lines.push(serving ? `Porção ${fmt(serving)}${unit}` : `Por 100${unit}`)
  const row = (label: string, key: string, u: string, mult = 1, digits = 1) => {
    const v = nutrient100(p, key)
    if (v !== null) lines.push(`${label} ${fmt(v * mult, digits)}${u}`)
  }
  row('Valor energético', 'energy-kcal', 'kcal', 1, 0)
  row('Carboidratos', 'carbohydrates', 'g')
  row('Açúcares', 'sugars', 'g')
  row('Gorduras', 'fat', 'g')
  row('Sódio', 'sodium', 'mg', 1000, 0)
  if (lines.length === 2) lines.push('Tabela nutricional', 'não informada')
  return lines
}

/** 13 · Analisando rótulo */
export default function Analyzing() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { session, profile, scans, setLocal } = useApp()
  const [phase, setPhase] = useState<Phase>('fetch')
  const [product, setProduct] = useState<OffProduct | null>(null)
  const [scan, setScan] = useState<Scan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const started = useRef<string | null>(null)

  useEffect(() => {
    const key = `${code}#${attempt}`
    if (!session || started.current === key) return
    started.current = key
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setPhase('fetch')
        const p = await fetchProduct(code, ctrl.signal)
        setProduct(p)
        setPhase('compare')
        await new Promise((r) => setTimeout(r, 450))
        setPhase('record')
        const { scan, alerts, bonus } = await recordScan(session.user.id, profile, p, scans)
        setLocal.scans((list) => [scan, ...list])
        if (alerts.length) setLocal.alerts((list) => [...alerts, ...list])
        if (bonus) setLocal.points((list) => [bonus, ...list])
        setScan(scan)
        setPhase('done')
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        if (err instanceof ProductNotFoundError) setPhase('notfound')
        else {
          setError((err as Error).message)
          setPhase('error')
        }
      }
    })()
    // sem abortar no cleanup: no modo de desenvolvimento o React monta duas vezes
    // e a referência acima já impede gravações duplicadas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, attempt, session])

  const steps = [
    { label: 'Lendo tabela nutricional', done: phase !== 'fetch' },
    { label: 'Comparando com seu perfil', done: phase === 'record' || phase === 'done' },
    { label: 'Gerando alertas e alternativas', done: phase === 'done' },
  ]
  const progress = phase === 'fetch' ? 0.25 : phase === 'compare' ? 0.55 : phase === 'record' ? 0.77 : 1
  const failed = phase === 'notfound' || phase === 'error'

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto bg-cam px-[22px] text-white">
      <div className="flex shrink-0 items-center pt-[50px]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate('/scanner', { replace: true })}
          className="-ml-[8px] flex size-[56px] items-center justify-center rounded-full border-0 bg-transparent text-white"
        >
          <X size={24} aria-hidden />
        </button>
        <h1 className="m-0 ml-[6px] text-[16px] font-bold leading-[normal]">Analisando rótulo</h1>
      </div>

      {/* rótulo */}
      <div className="relative mx-auto mt-[20px] h-[260px] w-[267px] shrink-0 overflow-hidden rounded-[18px] bg-cam-4">
        <div className="absolute left-[28px] top-[42px] h-[174px] w-[211px] rounded-[8px] bg-cam-5">
          {product?.image_front_small_url && (
            <img
              src={product.image_front_small_url}
              alt=""
              className="decor absolute right-[8px] top-[8px] size-[44px] rounded-[6px] bg-white object-contain"
            />
          )}
          <div className="absolute left-[24px] top-[28px] text-[10px] leading-[12px] text-brand-soft">
            {labelLines(product, code).map((l, i) => (
              <p key={i} className="m-0 whitespace-pre">
                {l || ' '}
              </p>
            ))}
          </div>
        </div>
        {!failed && phase !== 'done' && (
          <span
            className="animate-scanline absolute left-0 top-[42px] h-[2px] w-full rounded-[1px] bg-brand-light"
            style={{ ['--scan-distance' as string]: '172px' }}
          />
        )}
      </div>

      {/* status */}
      <div className="mt-[44px] shrink-0 rounded-[22px] bg-cam-3 px-[20px] pb-[18px] pt-[26px]">
        {phase === 'notfound' ? (
          <>
            <h2 className="m-0 text-[18px] font-bold leading-[normal]">Produto não encontrado</h2>
            <p className="m-0 mt-[12px] text-[14px] leading-[1.45] text-brand-soft">
              O código <b>{code}</b> ainda não está na base aberta Open Food Facts, por isso não temos dados reais deste produto.
            </p>
            <a
              href={`https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${code}`}
              target="_blank"
              rel="noreferrer"
              className="mt-[12px] inline-flex items-center gap-[4px] text-[13px] font-bold text-brand-light"
            >
              Cadastrar este produto no Open Food Facts <ExternalLink size={14} aria-hidden />
            </a>
          </>
        ) : phase === 'error' ? (
          <>
            <h2 className="m-0 text-[18px] font-bold leading-[normal]">Não foi possível analisar</h2>
            <p className="m-0 mt-[12px] text-[14px] leading-[1.45] text-brand-soft">
              Verifique sua conexão com a internet e tente de novo.
            </p>
            {error && <p className="m-0 mt-[6px] text-[11px] text-faint">{error}</p>}
          </>
        ) : (
          <>
            <h2 className="m-0 text-[18px] font-bold leading-[normal]">
              {product ? productName(product) : 'Análise nutricional'}
            </h2>
            <ul className="m-0 mt-[18px] flex list-none flex-col gap-[15px] p-0">
              {steps.map((s, i) => {
                const current = !s.done && (i === 0 || steps[i - 1].done)
                return (
                  <li
                    key={s.label}
                    className={`flex items-center gap-[8px] text-[14px] font-medium leading-[normal] ${s.done ? 'text-brand-soft' : current ? 'text-white' : 'text-faint'}`}
                  >
                    {s.done ? <Check size={16} strokeWidth={3} aria-hidden /> : <Circle size={8} fill="currentColor" className="mx-[4px]" aria-hidden />}
                    {s.label}
                  </li>
                )
              })}
            </ul>
            <div className="mt-[12px] h-[8px] w-full rounded-[4px] bg-cam-5">
              <div
                className="h-full rounded-[4px] bg-brand-light transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="min-h-[40px] flex-1" />
      <div className="shrink-0 px-[22px] pb-[68px]">
        {failed ? (
          <button
            type="button"
            onClick={() => (phase === 'error' ? setAttempt((a) => a + 1) : navigate('/scanner', { replace: true }))}
            className="h-[54px] w-full rounded-[16px] border-0 bg-brand text-[15px] font-bold text-white"
          >
            {phase === 'error' ? 'Tentar de novo' : 'Ler outro produto'}
          </button>
        ) : (
          <button
            type="button"
            disabled={phase !== 'done'}
            onClick={() => scan && navigate(`/resultado/${scan.id}`, { replace: true })}
            className="h-[54px] w-full rounded-[16px] border-0 bg-brand text-[15px] font-bold text-white transition-opacity disabled:opacity-50"
          >
            Ver resultado
          </button>
        )}
      </div>
    </div>
  )
}
