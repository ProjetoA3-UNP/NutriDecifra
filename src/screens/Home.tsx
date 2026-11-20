import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ProductThumb, ScoreBadge, Screen } from '../components/ui'
import { isToday, relativeTime } from '../lib/time'
import { firstName, scanHighlight } from '../lib/summary'
import avatarBg from '../assets/figma/home-avatar.svg'
import bellBadge from '../assets/figma/home-bell-badge.svg'
import heroDecor from '../assets/figma/home-hero-decor.svg'
import heroDecorInner from '../assets/figma/home-hero-decor-inner.svg'
import { Bell, Camera, ClipboardList, ScanSearch, TriangleExclamationPoint } from 'lucide-react'

/** 04 · Home */
export default function Home() {
  const { profile, scans, alerts, session } = useApp()
  const navigate = useNavigate()
  const name = firstName(profile, session?.user.email)
  const readToday = scans.filter((s) => isToday(s.created_at)).length
  const activeAlerts = alerts.filter((a) => !a.read && a.severity !== 'positive').length
  const recent = scans.slice(0, 3)

  return (
    <Screen nav>
      <div className="px-[22px] pt-[62px]">
        {/* cabeçalho */}
        <div className="flex items-start">
          <Link to="/perfil" className="relative flex size-[48px] shrink-0 items-center justify-center no-underline" aria-label="Perfil">
            <img src={avatarBg} alt="" width={48} height={48} className="absolute inset-0" />
            <span className="relative text-[20px] font-bold text-white">{name.charAt(0).toUpperCase()}</span>
          </Link>
          <div className="ml-[12px] mt-[4px] flex-1">
            <p className="m-0 text-[17px] font-bold leading-[normal] text-ink">Olá, {name}</p>
            <p className="m-0 mt-[3px] text-[13px] leading-[normal] text-muted">Pronto para decifrar?</p>
          </div>
          <Link
            to="/alertas"
            aria-label={activeAlerts ? `${activeAlerts} alertas novos` : 'Alertas'}
            className="relative mt-[4px] flex size-[44px] items-center justify-center rounded-[14px] bg-white text-ink no-underline"
          >
            <Bell size={21} aria-hidden />
            {activeAlerts > 0 && <img src={bellBadge} alt="" width={10} height={10} className="absolute right-[4px] top-[4px]" />}
          </Link>
        </div>

        {/* card escanear */}
        <button
          type="button"
          onClick={() => navigate('/scanner')}
          className="relative mt-[32px] block h-[170px] w-full overflow-hidden rounded-[22px] border-0 bg-brand p-0 text-left"
        >
          <img src={heroDecor} alt="" width={130} height={130} className="decor absolute right-[5.5px] top-[17.6px]" />
          <img src={heroDecorInner} alt="" width={80} height={80} className="decor absolute right-[30px] top-[42px]" />
          <ScanSearch size={46} strokeWidth={1.8} className="decor absolute right-[47px] top-[59px] text-white" aria-hidden />
          <span className="absolute left-[20px] top-[28px] text-[22px] font-bold leading-[normal] text-white">Escanear rótulo</span>
          <span className="absolute left-[20px] top-[60px] text-[13px] leading-[normal] text-brand-mint">
            Aponte a câmera para o
            <br />
            código de barras do produto
          </span>
          <span className="absolute left-[20px] top-[110px] flex h-[42px] w-[148px] items-center rounded-[12px] bg-white gap-[8px] pl-[16px] text-[14px] font-bold text-brand">
            <Camera size={18} strokeWidth={2.2} aria-hidden />
            Abrir câmera
          </span>
        </button>

        {/* estatísticas */}
        <div className="mt-[24px] flex gap-[11px]">
          <Link to="/historico" className="relative h-[96px] flex-1 rounded-[18px] bg-white no-underline">
            <ClipboardList size={22} className="absolute left-[16px] top-[14px] text-brand" aria-hidden />
            <span className="absolute left-[16px] top-[42px] text-[26px] font-bold leading-[normal] text-ink">{readToday}</span>
            <span className="absolute left-[46px] top-[52px] text-[12px] leading-[normal] text-muted">
              {readToday === 1 ? 'Lido hoje' : 'Lidos hoje'}
            </span>
          </Link>
          <Link to="/alertas" className="relative h-[96px] flex-1 rounded-[18px] bg-white no-underline">
            <TriangleExclamationPoint size={22} className="absolute left-[16px] top-[14px] text-score-d" aria-hidden />
            <span className="absolute left-[16px] top-[42px] text-[26px] font-bold leading-[normal] text-ink">{activeAlerts}</span>
            <span className="absolute left-[46px] top-[52px] text-[12px] leading-[normal] text-muted">
              {activeAlerts === 1 ? 'Alerta ativo' : 'Alertas ativos'}
            </span>
          </Link>
        </div>

        {/* histórico recente */}
        <div className="mt-[24px] flex items-center justify-between">
          <h2 className="m-0 text-[16px] font-bold leading-[normal] text-ink">Histórico recente</h2>
          <Link to="/historico" className="mr-[3px] text-[13px] font-medium text-brand no-underline">
            Ver tudo
          </Link>
        </div>

        <div className="mt-[14px] flex flex-col gap-[12px]">
          {recent.length === 0 && (
            <div className="rounded-[16px] bg-white px-[16px] py-[18px] text-[13px] leading-[1.45] text-muted">
              Você ainda não leu nenhum produto. Toque em <b className="text-brand">Abrir câmera</b> e aponte para o código de barras
              da embalagem.
            </div>
          )}
          {recent.map((s) => (
            <Link
              key={s.id}
              to={`/resultado/${s.id}`}
              className="flex h-[70px] items-center rounded-[16px] bg-white px-[12px] no-underline"
            >
              <ProductThumb product={s.product} imageUrl={s.image_url} grade={s.nutriscore} size={46} radius={12} iconSize={22} />
              <div className="ml-[14px] min-w-0 flex-1">
                <p className="m-0 truncate text-[14px] font-bold leading-[normal] text-ink">{s.product_name}</p>
                <p className="m-0 mt-[5px] truncate text-[12px] leading-[normal] text-muted">
                  {relativeTime(s.created_at, 'day')} · {scanHighlight(s, profile)}
                </p>
              </div>
              <span className="ml-[8px] mr-[4px]">
                <ScoreBadge grade={s.nutriscore} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Screen>
  )
}
