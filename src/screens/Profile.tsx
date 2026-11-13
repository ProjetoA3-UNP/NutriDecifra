import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ErrorBox, Loading, Screen, Spinner, Switch, Toast } from '../components/ui'
import { supabase } from '../lib/supabase'
import type { Goal, Restriction } from '../lib/types'

const GOALS: Record<Goal, string> = {
  reduce_sugar: 'Reduzir consumo de açúcar',
  reduce_sodium: 'Reduzir consumo de sódio',
  eat_better: 'Comer de forma mais saudável',
  avoid_ultra: 'Evitar ultraprocessados',
}
const RESTRICTION_LABEL: Record<Restriction, string> = {
  gluten: 'Glúten',
  lactose: 'Lactose',
  sugar: 'Açúcar',
  sodium: 'Sódio',
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fadeup no-scrollbar max-h-[85%] w-full overflow-y-auto rounded-t-[24px] bg-white px-[22px] pb-[32px] pt-[24px]"
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[18px] font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="size-[36px] border-0 bg-transparent text-[20px] text-muted">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Row({ icon, label, right, onClick, to }: { icon: string; label: string; right?: ReactNode; onClick?: () => void; to?: string }) {
  const inner = (
    <>
      <span className="w-[38px] text-[17px] leading-none">{icon}</span>
      <span className="flex-1 text-left text-[14px] font-medium text-ink">{label}</span>
      {right ?? <span className="text-[18px] text-faint">›</span>}
    </>
  )
  const cls = 'flex h-[40px] w-full items-center border-0 bg-transparent p-0 no-underline'
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

const FAQ = [
  {
    q: 'Como leio um produto?',
    a: 'Toque no botão da câmera e aponte para o código de barras da embalagem. Se a câmera não funcionar, toque em "Digitar o código" e digite os números embaixo das barras.',
  },
  {
    q: 'De onde vêm os dados?',
    a: 'Do Open Food Facts, uma base aberta e colaborativa com milhões de alimentos do mundo todo. Se um produto não estiver lá, o app avisa e não inventa informação.',
  },
  {
    q: 'Como são calculadas as colheres de açúcar?',
    a: 'Pegamos o açúcar da porção declarada no rótulo (ou de 100 g, quando não há porção) e dividimos por 4 g, que é uma colher de chá.',
  },
  {
    q: 'O que é o Nutri-Score?',
    a: 'Uma nota de A (melhor) a E (pior) que resume a qualidade nutricional do alimento, considerando açúcar, gordura saturada, sal, fibras, proteínas, frutas e vegetais.',
  },
  {
    q: 'Posso confiar 100% nos alertas?',
    a: 'Os dados são colaborativos e podem ter erros. Em caso de alergia ou intolerância, confira sempre o rótulo da embalagem. O app não substitui orientação de nutricionista ou médico.',
  },
]

/** 10 · Perfil */
export default function Profile() {
  const navigate = useNavigate()
  const { profile, session, updateProfile, scans, alerts, points, setLocal } = useApp()
  const [sheet, setSheet] = useState<null | 'name' | 'goal' | 'privacy' | 'help'>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!profile || !session) return <Loading />
  const goalSub =
    profile.goal === 'reduce_sodium'
      ? `Alerta acima de ${profile.sodium_limit_mg} mg`
      : profile.goal === 'reduce_sugar'
        ? `Limite de ${profile.sugar_limit_g} g/dia`
        : 'Toque para mudar'
  const displayName = profile.name || session.user.email?.split('@')[0] || 'Você'

  async function saveName(e: FormEvent) {
    e.preventDefault()
    try {
      await updateProfile({ name: name.trim() || null })
      setSheet(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function chooseGoal(g: Goal) {
    setSheet(null)
    try {
      await updateProfile({ goal: g })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function downloadData() {
    const data = { exportado_em: new Date().toISOString(), conta: session?.user.email, perfil: profile, leituras: scans, alertas: alerts, pontos: points }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nutridecifra-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function clearHistory() {
    if (!session) return
    if (!window.confirm('Apagar todo o seu histórico de leituras e alertas? Seus pontos e conquistas já ganhos continuam.')) return
    setBusy(true)
    try {
      const a = await supabase.from('alerts').delete().eq('user_id', session.user.id)
      if (a.error) throw a.error
      const s = await supabase.from('scans').delete().eq('user_id', session.user.id)
      if (s.error) throw s.error
      setLocal.scans(() => [])
      setLocal.alerts(() => [])
      setSheet(null)
      setToast('Histórico apagado.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/entrar', { replace: true })
  }

  return (
    <Screen nav>
      <div className="px-[22px] pt-[62px]">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-[22px] font-bold leading-[normal] text-ink">Meu perfil</h1>
          <button
            type="button"
            onClick={() => {
              setName(profile.name ?? '')
              setSheet('name')
            }}
            className="border-0 bg-transparent p-0 text-[13px] font-medium text-brand"
          >
            Editar
          </button>
        </div>

        {/* cartão do perfil */}
        <div className="mt-[21px] flex min-h-[120px] items-center rounded-[20px] bg-white px-[20px] py-[16px]">
          <span className="flex size-[76px] shrink-0 items-center justify-center rounded-full bg-brand text-[32px] font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="ml-[14px] min-w-0">
            <p className="m-0 truncate text-[17px] font-bold leading-[normal] text-ink">{displayName}</p>
            <p className="m-0 mt-[3px] truncate text-[13px] leading-[normal] text-muted">{session.user.email}</p>
            <Link
              to="/planos"
              className="mt-[9px] inline-flex h-[26px] items-center rounded-[13px] bg-[#fff3c4] px-[12px] text-[11px] font-bold text-caution-ink no-underline"
            >
              ⭐ Plano Free
            </Link>
          </div>
        </div>

        {/* restrições */}
        <h2 className="m-0 mt-[22px] text-[14px] font-bold leading-[normal] text-ink">Restrições alimentares</h2>
        <div className="mt-[11px] flex flex-wrap gap-[8px]">
          {profile.restrictions.map((r) => (
            <Link
              key={r}
              to="/alertas/personalizar"
              className="flex h-[34px] items-center rounded-[17px] bg-brand px-[13px] text-[12px] font-bold text-white no-underline"
            >
              ✓ {RESTRICTION_LABEL[r]}
            </Link>
          ))}
          <Link
            to="/alertas/personalizar"
            className="flex h-[34px] items-center rounded-[17px] bg-white px-[12px] text-[12px] font-medium text-muted no-underline"
          >
            + Adicionar
          </Link>
        </div>

        {/* objetivo */}
        <h2 className="m-0 mt-[22px] text-[14px] font-bold leading-[normal] text-ink">Objetivo</h2>
        <button
          type="button"
          onClick={() => setSheet('goal')}
          className="mt-[11px] flex h-[68px] w-full items-center rounded-[16px] border-0 bg-white px-[16px] text-left"
        >
          <span className="text-[24px] leading-none">🎯</span>
          <span className="ml-[18px] flex-1">
            <span className="block text-[14px] font-bold leading-[normal] text-ink">{GOALS[profile.goal] ?? GOALS.reduce_sugar}</span>
            <span className="mt-[5px] block text-[12px] leading-[normal] text-muted">{goalSub}</span>
          </span>
          <span className="text-[18px] text-faint">›</span>
        </button>

        {/* configurações */}
        <h2 className="m-0 mt-[24px] text-[14px] font-bold leading-[normal] text-ink">Configurações</h2>
        <div className="mt-[11px] rounded-[18px] bg-white px-[16px] py-[8px]">
          <Row
            icon="🔔"
            label="Notificações"
            right={
              <Switch
                on={profile.notifications}
                label="Notificações"
                onChange={(v) => void updateProfile({ notifications: v }).catch((e: Error) => setError(e.message))}
              />
            }
          />
          <Row icon="♿" label="Acessibilidade" to="/acessibilidade" />
          <Row
            icon="🌍"
            label="Idioma"
            onClick={() => setToast('Por enquanto o app está disponível só em português.')}
            right={<span className="text-[13px] text-muted">Português ›</span>}
          />
          <Row icon="🛡️" label="Privacidade e dados" onClick={() => setSheet('privacy')} />
          <Row icon="❓" label="Ajuda e suporte" onClick={() => setSheet('help')} />
        </div>

        {error && (
          <div className="mt-[12px]">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          className="mx-auto mt-[14px] block h-[40px] border-0 bg-transparent px-[16px] text-[14px] font-bold text-score-e"
        >
          Sair da conta
        </button>
      </div>

      {sheet === 'name' && (
        <Sheet title="Editar nome" onClose={() => setSheet(null)}>
          <form onSubmit={saveName}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              maxLength={60}
              className="mt-[16px] h-[52px] w-full rounded-[12px] border-0 bg-page px-[15px] text-[15px] outline-none focus:ring-2 focus:ring-brand/40"
            />
            <button type="submit" className="mt-[16px] h-[54px] w-full rounded-[14px] border-0 bg-brand text-[16px] font-bold text-white">
              Salvar
            </button>
          </form>
        </Sheet>
      )}

      {sheet === 'goal' && (
        <Sheet title="Qual é o seu objetivo?" onClose={() => setSheet(null)}>
          <div className="mt-[14px] flex flex-col gap-[8px]">
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => chooseGoal(g)}
                className={`flex h-[52px] items-center rounded-[14px] border-0 px-[16px] text-left text-[14px] font-bold ${
                  profile.goal === g ? 'bg-brand text-white' : 'bg-page text-ink'
                }`}
              >
                {GOALS[g]}
              </button>
            ))}
          </div>
          <p className="m-0 mt-[12px] text-[12px] text-muted">
            Os limites de açúcar e sódio ficam em <Link to="/alertas/personalizar" className="font-bold text-brand">Personalizar alertas</Link>.
          </p>
        </Sheet>
      )}

      {sheet === 'privacy' && (
        <Sheet title="Privacidade e dados" onClose={() => setSheet(null)}>
          <p className="m-0 mt-[12px] text-[13px] leading-[1.5] text-muted">
            Guardamos na sua conta apenas o que você faz no app: perfil (nome, restrições e metas), produtos lidos, alertas e pontos.
            Só você tem acesso a esses dados. A câmera é usada apenas para ler o código de barras; nenhuma imagem é enviada ou salva.
          </p>
          <button
            type="button"
            onClick={downloadData}
            className="mt-[18px] h-[50px] w-full rounded-[14px] border-0 bg-brand-tint text-[14px] font-bold text-brand"
          >
            Baixar meus dados
          </button>
          <button
            type="button"
            onClick={clearHistory}
            disabled={busy}
            className="mt-[10px] flex h-[50px] w-full items-center justify-center rounded-[14px] border-0 bg-danger-bg text-[14px] font-bold text-danger-ink"
          >
            {busy ? <Spinner /> : 'Apagar meu histórico'}
          </button>
        </Sheet>
      )}

      {sheet === 'help' && (
        <Sheet title="Ajuda e suporte" onClose={() => setSheet(null)}>
          <div className="mt-[8px] flex flex-col">
            {FAQ.map((f) => (
              <details key={f.q} className="border-0 border-b border-solid border-line py-[12px]">
                <summary className="cursor-pointer text-[14px] font-bold text-ink">{f.q}</summary>
                <p className="m-0 mt-[8px] text-[13px] leading-[1.5] text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Sheet>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </Screen>
  )
}
