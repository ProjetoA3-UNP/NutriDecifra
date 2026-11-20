import { useEffect, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ErrorBox, ScoreBadge, Spinner, Toast } from '../components/ui'
import { StaffScreen, StatCard } from '../components/staff'
import { fetchAccounts, fetchOverview, matchesAccount, setAccountRole, type AccountRow, type Overview } from '../lib/admin'
import { ROLE_DESCRIPTION, ROLE_LABEL } from '../lib/roles'
import type { Grade, Role } from '../lib/types'

const ROLES: Role[] = ['consumer', 'nutritionist', 'admin']
const nf = (n: number) => n.toLocaleString('pt-BR')
const weekday = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

/** Administrador · Painel da plataforma */
export default function AdminHome() {
  const [tab, setTab] = useState<'overview' | 'accounts'>('overview')

  return (
    <StaffScreen title="Painel do administrador" subtitle="Números gerais do NutriDecifra e gestão de perfis de acesso.">
      <div className="mt-[18px] flex h-[44px] rounded-[12px] bg-track p-[5px]" role="tablist">
        {(
          [
            ['overview', 'Visão geral'],
            ['accounts', 'Contas e perfis'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-[9px] border-0 text-[13px] font-bold ${tab === id ? 'bg-white text-brand' : 'bg-transparent text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'overview' ? <OverviewTab /> : <AccountsTab />}
    </StaffScreen>
  )
}

function OverviewTab() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchOverview()
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  if (error) return <div className="mt-[18px]"><ErrorBox>{error}</ErrorBox></div>
  if (!data)
    return (
      <div className="flex justify-center py-[40px]">
        <Spinner />
      </div>
    )

  const maxDay = Math.max(1, ...data.scans_by_day.map((d) => d.n))
  const grades = (['a', 'b', 'c', 'd', 'e'] as Grade[]).map((g) => ({ g, n: data.grades[g] ?? 0 }))
  const graded = grades.reduce((s, x) => s + x.n, 0)
  const healthyPct = data.saved ? Math.round((data.healthy_saved / data.saved) * 100) : 0

  return (
    <>
      <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
        <StatCard value={nf(data.users)} label={`contas · ${nf(data.new_users_7d)} novas em 7 dias`} tone="brand" />
        <StatCard value={nf(data.scans)} label={`rótulos lidos · ${nf(data.scans_7d)} em 7 dias`} />
        <StatCard value={`${healthyPct}%`} label="dos produtos salvos são nota A ou B" tone="brand" />
        <StatCard value={nf(data.swaps)} label="trocas por alternativa melhor" />
        <StatCard value={nf(data.alerts_critical)} label={`alertas críticos · ${nf(data.alerts_attention)} de atenção`} tone="danger" />
        <StatCard value={nf(data.active_links)} label="acompanhamentos ativos com nutricionista" />
      </div>

      <section className="mt-[14px] rounded-[18px] bg-white px-[16px] py-[14px]">
        <p className="m-0 text-[13px] font-bold text-ink">Perfis de acesso</p>
        <div className="mt-[10px] flex flex-col gap-[6px] text-[12px] text-muted">
          <span>Consumidores: <b className="text-ink">{nf(data.consumers)}</b></span>
          <span>Nutricionistas: <b className="text-ink">{nf(data.nutritionists)}</b></span>
          <span>Administradores: <b className="text-ink">{nf(data.admins)}</b></span>
        </div>
      </section>

      <section className="mt-[14px] rounded-[18px] bg-white px-[16px] py-[14px]">
        <p className="m-0 text-[13px] font-bold text-ink">Leituras nos últimos 7 dias</p>
        <div className="mt-[12px] flex h-[110px] items-end gap-[8px]" role="img" aria-label="Gráfico de leituras por dia">
          {data.scans_by_day.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-[4px]">
              <span className="text-[10px] font-bold text-ink">{d.n}</span>
              <div className="w-full rounded-t-[6px] bg-brand" style={{ height: `${Math.max((d.n / maxDay) * 72, d.n ? 4 : 2)}px` }} />
              <span className="text-[10px] text-muted">{weekday(d.day)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-[14px] rounded-[18px] bg-white px-[16px] py-[14px]">
        <p className="m-0 text-[13px] font-bold text-ink">Nutri-Score dos produtos lidos</p>
        <div className="mt-[12px] flex flex-col gap-[7px]">
          {grades.map(({ g, n }) => (
            <div key={g} className="flex items-center gap-[10px]">
              <ScoreBadge grade={g} w={26} h={22} radius={6} size={12} />
              <div className="h-[10px] flex-1 rounded-[5px] bg-track">
                <div className="h-full rounded-[5px]" style={{ width: `${graded ? (n / graded) * 100 : 0}%`, background: `var(--color-score-${g})` }} />
              </div>
              <span className="w-[34px] text-right text-[12px] font-bold text-ink">{nf(n)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-[14px] rounded-[18px] bg-white px-[16px] py-[14px]">
        <p className="m-0 text-[13px] font-bold text-ink">Produtos mais lidos</p>
        <ol className="m-0 mt-[10px] flex list-decimal flex-col gap-[6px] pl-[18px] text-[12px] text-muted">
          {data.top_products.length === 0 && <li className="list-none">Nenhuma leitura ainda.</li>}
          {data.top_products.map((p) => (
            <li key={p.name}>
              <span className="text-ink">{p.name}</span> · {nf(p.n)}
            </li>
          ))}
        </ol>
      </section>

      <p className="m-0 mt-[16px] flex gap-[8px] rounded-[14px] bg-brand-tint px-[14px] py-[12px] text-[12px] leading-[1.45] text-brand">
        <ShieldCheck size={16} className="mt-[1px] shrink-0" aria-hidden />
        Por privacidade, o administrador vê apenas totais. As leituras e os alertas de cada pessoa ficam visíveis só para ela
        e para o nutricionista que ela autorizar.
      </p>
    </>
  )
}

function AccountsTab() {
  const { session } = useApp()
  const [list, setList] = useState<AccountRow[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchAccounts()
      .then((l) => alive && setList(l))
      .catch((e: Error) => {
        if (!alive) return
        setError(e.message)
        setList([])
      })
    return () => {
      alive = false
    }
  }, [])

  async function change(a: AccountRow, role: Role) {
    if (role === a.role) return
    const who = a.name || a.email
    if (!window.confirm(`Mudar o perfil de ${who} para ${ROLE_LABEL[role]}?\n\n${ROLE_DESCRIPTION[role]}`)) return
    setSaving(a.id)
    setError(null)
    try {
      await setAccountRole(a.id, role)
      setList((l) => l?.map((x) => (x.id === a.id ? { ...x, role } : x)) ?? null)
      setToast(`${who} agora é ${ROLE_LABEL[role]}.`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(null)
    }
  }

  const shown = (list ?? []).filter((a) => matchesAccount(a, query))

  return (
    <>
      <label className="relative mt-[18px] block">
        <span className="sr-only">Buscar conta</span>
        <Search size={18} className="pointer-events-none absolute left-[14px] top-[15px] text-faint" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          className="h-[48px] w-full rounded-[12px] border-0 bg-white pl-[42px] pr-[14px] text-[14px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-brand/40"
        />
      </label>
      {error && (
        <div className="mt-[12px]">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}
      <div className="mt-[12px] flex flex-col gap-[10px]">
        {!list && (
          <div className="flex justify-center py-[30px]">
            <Spinner />
          </div>
        )}
        {list && shown.length === 0 && <p className="m-0 text-[13px] text-muted">Nenhuma conta encontrada.</p>}
        {shown.map((a) => {
          const me = a.id === session?.user.id
          return (
            <div key={a.id} className="rounded-[16px] bg-white px-[14px] py-[12px]">
              <div className="flex items-center">
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[14px] font-bold text-ink">
                    {a.name || 'Sem nome'} {me && <span className="text-[11px] font-medium text-faint">(você)</span>}
                  </p>
                  <p className="m-0 mt-[2px] truncate text-[12px] text-muted">{a.email}</p>
                </div>
                {saving === a.id && <Spinner />}
              </div>
              <div className="mt-[10px] flex gap-[6px]" role="radiogroup" aria-label={`Perfil de ${a.name || a.email}`}>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={a.role === r}
                    disabled={me || saving === a.id}
                    onClick={() => change(a, r)}
                    className={`h-[30px] flex-1 rounded-[15px] border-0 text-[11px] font-bold disabled:cursor-not-allowed ${
                      a.role === r ? 'bg-brand text-white' : 'bg-page text-muted'
                    } ${me && a.role !== r ? 'opacity-50' : ''}`}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <p className="m-0 mt-[14px] text-[11px] leading-[1.5] text-faint">
        Todo cadastro novo começa como Consumidor. Você não pode mudar o seu próprio perfil, para a plataforma nunca ficar sem
        administrador.
      </p>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  )
}
