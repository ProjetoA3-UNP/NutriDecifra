import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BackArrow, ErrorBox, Loading, ProductThumb, ScoreBadge, Spinner } from '../components/ui'
import { useScan } from '../lib/useScan'
import { alternativesFor } from '../lib/altCache'
import { soldInBrazil } from '../lib/off'
import { compare } from '../lib/compare'
import { analyze, fmt, gradeOf, isLiquid, nutrient100, productBrand, productEmoji, productName, spoonsText } from '../lib/nutrition'
import type { OffProduct } from '../lib/types'

/** 08 · Alternativas */
export default function Alternatives() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useApp()
  const { scan, missing } = useScan(id)
  const [list, setList] = useState<OffProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!scan) return
    let active = true
    setError(null)
    alternativesFor(scan.id, scan.product)
      .then((l) => active && setList(l))
      .catch((e: Error) => active && setError(e.message))
    return () => {
      active = false
    }
  }, [scan, attempt])

  if (missing) return <Loading />
  if (!scan) return <Loading />

  const a = analyze(scan.product, profile)
  const g = scan.nutriscore
  const bad = g === null || g === 'c' || g === 'd' || g === 'e'
  const meta = [a.spoons !== null ? spoonsText(a.spoons).toLowerCase() : null, `score ${g ? g.toUpperCase() : '?'}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-page px-[22px] pb-[30px]">
      <div className="pt-[62px]">
        <BackArrow onClick={() => navigate(`/resultado/${scan.id}`, { replace: true })} />
      </div>
      <h1 className="m-0 mt-[17px] text-[22px] font-bold leading-[normal] text-ink">Alternativas melhores</h1>
      <p className="m-0 mt-[3px] text-[13px] leading-[normal] text-muted">Produtos similares com perfil mais saudável</p>

      <Link
        to={`/resultado/${scan.id}`}
        replace
        className="mt-[18px] flex min-h-[82px] flex-col justify-center rounded-[18px] px-[16px] py-[12px] no-underline"
        style={{ background: bad ? '#fdecec' : '#e8f5ee' }}
      >
        <span className="text-[9px] font-bold leading-[normal]" style={{ color: bad ? '#9b1c1c' : '#1f7a4d' }}>
          VOCÊ ESCANEOU
        </span>
        <span className="mt-[7px] flex items-center">
          <span className="w-[44px] shrink-0 text-[28px] leading-none">{productEmoji(scan.product)}</span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold leading-[normal] text-ink">{scan.product_name}</span>
            <span className="mt-[3px] block text-[11px] leading-[normal]" style={{ color: bad ? '#9b1c1c' : '#1f7a4d' }}>
              {meta}
            </span>
          </span>
        </span>
      </Link>

      <h2 className="m-0 mt-[25px] text-[15px] font-bold leading-[normal] text-ink">Sugestões para você</h2>

      <div className="mt-[12px] flex flex-col gap-[12px]">
        {error && (
          <>
            <ErrorBox>Não foi possível buscar alternativas agora. Verifique sua conexão.</ErrorBox>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="h-[46px] rounded-[14px] border-[1.5px] border-solid border-brand bg-white text-[14px] font-bold text-brand"
            >
              Tentar de novo
            </button>
          </>
        )}
        {!error && list === null && (
          <div className="flex flex-col items-center gap-[12px] rounded-[20px] bg-white px-[20px] py-[32px] text-center text-[13px] text-muted">
            <Spinner />
            Procurando produtos da mesma categoria com nota melhor no Open Food Facts…
          </div>
        )}
        {list !== null && list.length === 0 && (
          <div className="rounded-[20px] bg-white px-[20px] py-[24px] text-[13px] leading-[1.5] text-muted">
            {g === 'a'
              ? 'Este produto já tem a melhor nota (Nutri-Score A). Boa escolha!'
              : 'Não encontramos na base do Open Food Facts produtos parecidos com nota melhor. Experimente comparar com outro produto da prateleira.'}
          </div>
        )}
        {list?.map((p) => {
          const c = compare(scan.product, p, profile)
          const sugar = nutrient100(p, 'sugars')
          const sub = [productBrand(p), p.quantity].filter(Boolean).join(' · ')
          return (
            <Link
              key={p.code}
              to={`/alternativas/${scan.id}/${p.code}`}
              state={{ product: p }}
              className="relative block min-h-[132px] rounded-[20px] bg-white p-[16px] no-underline"
            >
              <div className="flex">
                <ProductThumb
                  product={p}
                  imageUrl={p.image_front_small_url}
                  grade={gradeOf(p)}
                  size={68}
                  radius={14}
                  emojiSize={38}
                />
                <div className="ml-[16px] min-w-0 flex-1 pr-[50px]">
                  <p className="m-0 line-clamp-2 text-[12px] font-bold leading-[1.25] text-ink">{productName(p)}</p>
                  {sub && <p className="m-0 mt-[4px] truncate text-[11px] leading-[normal] text-muted">{sub}</p>}
                  {!soldInBrazil(p) && (
                    <p className="m-0 mt-[2px] text-[10px] font-medium leading-[normal] text-score-d">Vendido fora do Brasil</p>
                  )}
                  <div className="mt-[10px] flex flex-wrap gap-[6px]">
                    {c.pros.slice(0, 2).map((pro) => (
                      <span
                        key={pro}
                        className="flex h-[22px] items-center rounded-[11px] bg-brand-tint px-[10px] text-[11px] font-bold text-brand"
                      >
                        {pro}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="absolute right-[16px] top-[16px]">
                  <ScoreBadge grade={gradeOf(p)} h={28} size={15} />
                </span>
              </div>
              <div className="mt-[14px] flex items-center justify-between">
                <span className="text-[12px] font-medium leading-[normal] text-muted">
                  {sugar !== null ? `Açúcar: ${fmt(sugar)} g em 100 ${isLiquid(p) ? 'ml' : 'g'}` : 'Açúcar não informado'}
                </span>
                <span className="text-[12px] font-bold leading-[normal] text-brand">Ver detalhes →</span>
              </div>
            </Link>
          )
        })}
        {list && list.length > 0 && (
          <p className="m-0 mt-[4px] text-[10px] leading-[1.4] text-faint">
            Sugestões baseadas no Nutri-Score de produtos da mesma categoria no Open Food Facts.
          </p>
        )}
      </div>
    </div>
  )
}
