import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BackSquare, ProductThumb, ScoreBadge, Screen } from '../components/ui'
import { gradeGroup } from '../lib/nutrition'
import { relativeTime } from '../lib/time'
import { scanHighlight } from '../lib/summary'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'good', label: 'Bons' },
  { id: 'attention', label: 'Atenção' },
  { id: 'bad', label: 'Ruins' },
] as const
type FilterId = (typeof FILTERS)[number]['id']

/** 12 · Histórico */
export default function History() {
  const { scans, profile } = useApp()
  const [filter, setFilter] = useState<FilterId>('all')
  const list = filter === 'all' ? scans : scans.filter((s) => gradeGroup(s.nutriscore) === filter)

  return (
    <Screen nav>
      <div className="px-[22px] pt-[54px]">
        <div className="flex items-start">
          <div className="-ml-[6px]">
            <BackSquare to="/inicio" />
          </div>
          <div className="ml-[12px] pt-[4px]">
            <h1 className="m-0 text-[24px] font-bold leading-[normal] text-ink">Histórico</h1>
            <p className="m-0 mt-[5px] text-[13px] leading-[normal] text-muted">Rótulos analisados e decisões recentes</p>
          </div>
        </div>

        <div className="mt-[18px] flex h-[44px] items-center rounded-[18px] bg-white px-[8px]" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`h-[30px] flex-1 rounded-[15px] border-0 text-[12px] ${
                filter === f.id ? 'bg-brand font-bold text-white' : 'bg-transparent font-medium text-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-[20px] flex flex-col gap-[14px]">
          {list.length === 0 && (
            <div className="rounded-[16px] bg-white px-[16px] py-[20px] text-[13px] leading-[1.5] text-muted">
              {scans.length === 0
                ? 'Nenhum rótulo analisado ainda. Use a câmera para ler o código de barras de um produto.'
                : 'Nenhum produto nesta categoria.'}
            </div>
          )}
          {list.map((s) => (
            <Link
              key={s.id}
              to={`/resultado/${s.id}`}
              className="flex h-[78px] items-center rounded-[16px] bg-white px-[14px] no-underline"
            >
              <ProductThumb product={s.product} imageUrl={s.image_url} grade={s.nutriscore} size={48} radius={14} emojiSize={24} />
              <div className="ml-[14px] min-w-0 flex-1">
                <p className="m-0 truncate text-[14px] font-bold leading-[normal] text-ink">{s.product_name}</p>
                <p className="m-0 mt-[5px] truncate text-[12px] leading-[normal] text-muted">
                  {relativeTime(s.created_at, 'day')} · {scanHighlight(s, profile)}
                </p>
                <p className="m-0 mt-[5px] text-[11px] font-bold leading-[normal] text-brand">
                  Ver análise →{s.saved && <span className="ml-[8px] font-medium text-faint">salvo</span>}
                </p>
              </div>
              <span className="ml-[8px] mr-[2px]">
                <ScoreBadge grade={s.nutriscore} w={32} h={28} radius={10} size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Screen>
  )
}
