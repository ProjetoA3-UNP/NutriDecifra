import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import navScanBg from '../assets/figma/nav-scan-bg.svg'
import type { Grade } from '../lib/types'
import { gradeColor, gradeTint, productEmoji } from '../lib/nutrition'
import type { OffProduct } from '../lib/types'

/** Área da tela (375×812 no Figma). Rola por dentro; a barra inferior fica fixa. */
export function Screen({
  children,
  bg = '#f8faf8',
  nav = false,
  className = '',
}: {
  children: ReactNode
  bg?: string
  nav?: boolean
  className?: string
}) {
  return (
    <div className="relative flex h-full flex-col" style={{ background: bg }}>
      <div className={`no-scrollbar flex-1 overflow-y-auto ${nav ? 'pb-[96px]' : ''} ${className}`}>{children}</div>
      {nav && <BottomNav />}
    </div>
  )
}

/** Barra de navegação inferior (Início · Histórico · Câmera · Alertas · Perfil) */
export function BottomNav() {
  const item = (to: string, emoji: string, label: string) => (
    <NavLink
      to={to}
      end
      className="flex flex-col items-center pt-[12px] text-[10px] leading-none no-underline"
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          <span className="text-[22px] leading-[27px]">{emoji}</span>
          <span className={`mt-[1px] ${isActive ? 'font-bold text-brand' : 'font-normal text-muted'}`}>{label}</span>
        </>
      )}
    </NavLink>
  )
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 h-[64px] bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="grid h-full grid-cols-5">
        {item('/inicio', '🏠', 'Início')}
        {item('/historico', '📋', 'Histórico')}
        <div className="relative flex justify-center">
          <NavLink
            to="/scanner"
            aria-label="Escanear produto"
            className="absolute top-[-13px] flex size-[56px] items-center justify-center rounded-full"
          >
            <img src={navScanBg} alt="" width={56} height={56} className="absolute inset-0" />
            <span className="relative text-[26px] leading-none">📷</span>
          </NavLink>
        </div>
        {item('/alertas', '⚠️', 'Alertas')}
        {item('/perfil', '👤', 'Perfil')}
      </div>
    </nav>
  )
}

/** Seta "←" simples (Resultado, Alternativas, Planos...) */
export function BackArrow({ to, onClick, light = false }: { to?: string; onClick?: () => void; light?: boolean }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (onClick ? onClick() : to ? navigate(to) : navigate(-1))}
      className={`-m-[10px] flex size-[44px] items-center justify-center bg-transparent p-0 text-[24px] font-bold leading-none ${
        light ? 'text-white' : 'text-ink'
      }`}
    >
      ←
    </button>
  )
}

/** Botão voltar em quadrado branco 44×44 (Histórico, Alertas, Conquistas, Acessibilidade) */
export function BackSquare({ to }: { to?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] border-0 bg-white text-[22px] font-bold text-ink"
    >
      ←
    </button>
  )
}

export function ScoreBadge({
  grade,
  w = 42,
  h = 30,
  radius = 8,
  size = 16,
  label,
}: {
  grade: Grade | null
  w?: number
  h?: number
  radius?: number
  size?: number
  label?: string
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center font-bold text-white"
      style={{ background: gradeColor(grade), width: label ? undefined : w, height: h, borderRadius: radius, fontSize: size, padding: label ? '0 11px' : 0 }}
      title={grade ? `Nutri-Score ${grade.toUpperCase()}` : 'Nutri-Score não informado'}
    >
      {label ?? (grade ? grade.toUpperCase() : '?')}
    </span>
  )
}

/** Quadradinho do produto: foto real quando existe, senão o emoji da categoria (como no Figma) */
export function ProductThumb({
  product,
  imageUrl,
  grade,
  size,
  radius,
  emojiSize,
  tint,
}: {
  product: Pick<OffProduct, 'categories_tags' | 'categories_hierarchy'>
  imageUrl?: string | null
  grade: Grade | null
  size: number
  radius: number
  emojiSize: number
  tint?: string
}) {
  const [failed, setFailed] = useState(false)
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: radius, background: tint ?? gradeTint(grade) }}
    >
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-contain p-[4px] mix-blend-multiply"
        />
      ) : (
        <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{productEmoji(product)}</span>
      )}
    </div>
  )
}

/** Interruptor 38×22 (verde ligado / cinza desligado) */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-[22px] w-[38px] shrink-0 rounded-[11px] border-0 p-0 transition-colors"
      style={{ background: on ? '#1f7a4d' : '#e3ece6' }}
    >
      <span
        className="absolute top-[2px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all"
        style={{ left: on ? 18 : 2 }}
      />
    </button>
  )
}

export function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`inline-block size-[22px] animate-spin rounded-full border-[3px] ${
        light ? 'border-white/30 border-t-white' : 'border-brand/20 border-t-brand'
      }`}
    />
  )
}

/** Aviso flutuante (ex.: "Em breve") */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [message, onDone])
  if (!message) return null
  return (
    <div role="status" className="animate-fadeup pointer-events-none fixed inset-x-[22px] bottom-[90px] z-50 rounded-[14px] bg-ink px-[16px] py-[12px] text-center text-[13px] font-medium text-white shadow-lg">
      {message}
    </div>
  )
}

export function Loading({ bg = '#f8faf8' }: { bg?: string }) {
  return (
    <div className="flex h-full items-center justify-center" style={{ background: bg }}>
      <Spinner />
    </div>
  )
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="m-0 rounded-[12px] bg-danger-bg px-[14px] py-[10px] text-[13px] font-medium text-danger-ink">
      {children}
    </p>
  )
}
