// Moldura das áreas do Nutricionista e do Administrador: mesmo visual do app
// (cores e cartões do Figma), com cabeçalho próprio e botão de sair.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { ROLE_LABEL } from '../lib/roles'
import { firstName } from '../lib/summary'

export function StaffScreen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { profile, session, role } = useApp()
  const navigate = useNavigate()
  const name = firstName(profile, session?.user.email)

  async function logout() {
    await supabase.auth.signOut()
    navigate('/entrar', { replace: true })
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-page px-[22px] pb-[40px]">
      <div className="flex items-start pt-[62px]">
        <span className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-brand text-[20px] font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="ml-[12px] mt-[2px] min-w-0 flex-1">
          <p className="m-0 truncate text-[17px] font-bold leading-[normal] text-ink">Olá, {name}</p>
          <span className="mt-[5px] inline-flex h-[22px] items-center rounded-[11px] bg-brand-tint px-[10px] text-[10px] font-bold uppercase tracking-wide text-brand">
            {ROLE_LABEL[role]}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sair da conta"
          title="Sair da conta"
          className="mt-[2px] flex size-[44px] shrink-0 items-center justify-center rounded-[14px] border-0 bg-white text-score-e"
        >
          <LogOut size={20} aria-hidden />
        </button>
      </div>
      <h1 className="m-0 mt-[26px] text-[22px] font-bold leading-[normal] text-ink">{title}</h1>
      <p className="m-0 mt-[4px] text-[13px] leading-[1.4] text-muted">{subtitle}</p>
      {children}
    </div>
  )
}

/** Cartão de número (ex.: "12 pacientes") */
export function StatCard({ value, label, tone = 'ink' }: { value: ReactNode; label: string; tone?: 'ink' | 'danger' | 'brand' }) {
  const color = tone === 'danger' ? 'text-score-e' : tone === 'brand' ? 'text-brand' : 'text-ink'
  return (
    <div className="min-h-[82px] flex-1 rounded-[18px] bg-white px-[14px] py-[14px]">
      <p className={`m-0 text-[24px] font-bold leading-[normal] ${color}`}>{value}</p>
      <p className="m-0 mt-[4px] text-[11px] leading-[1.25] text-muted">{label}</p>
    </div>
  )
}
