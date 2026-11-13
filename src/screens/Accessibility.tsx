import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BackSquare, ErrorBox, Spinner, Switch } from '../components/ui'
import type { AccessibilityPrefs } from '../lib/types'

const TOOLS: { key: keyof AccessibilityPrefs; icon: string; iconClass?: string; title: string; sub: string; bg: string }[] = [
  { key: 'largeText', icon: 'Aa', iconClass: 'text-[13px] font-bold text-brand', title: 'Texto maior', sub: 'Aumenta fontes e áreas de toque', bg: '#e8f5ee' },
  { key: 'highContrast', icon: '◐', title: 'Alto contraste', sub: 'Melhora leitura em baixa visão', bg: '#f0f4f1' },
  { key: 'voice', icon: '🔈', title: 'Leitura em voz alta', sub: 'Lê alertas e resultados do rótulo', bg: '#f0f4f1' },
  { key: 'reduceMotion', icon: '↔', iconClass: 'text-[16px] font-bold text-brand', title: 'Reduzir animações', sub: 'Transições mais simples e previsíveis', bg: '#e8f5ee' },
  { key: 'simpleLanguage', icon: '✓', iconClass: 'text-[14px] font-bold text-brand', title: 'Linguagem simples', sub: 'Resume termos técnicos do rótulo', bg: '#e8f5ee' },
]

/** 17 · Acessibilidade */
export default function Accessibility() {
  const navigate = useNavigate()
  const { a11y, setA11y, updateProfile } = useApp()
  const [initial] = useState(a11y)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // as mudanças aparecem na hora (pré-visualização); "Salvar ajustes" grava na conta
  const set = (key: keyof AccessibilityPrefs, v: boolean) => setA11y({ ...a11y, [key]: v })

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await updateProfile({ accessibility: a11y })
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
      if (idx > 0) navigate(-1)
      else navigate('/perfil', { replace: true })
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-page">
      <div className="no-scrollbar flex-1 overflow-y-auto px-[22px]">
        <div className="flex items-start pt-[54px]">
          <div className="-ml-[6px]">
            <BackSquare />
          </div>
          <div className="ml-[12px] pt-[4px]">
            <h1 className="m-0 text-[24px] font-bold leading-[normal] text-ink">Acessibilidade</h1>
            <p className="m-0 mt-[5px] text-[13px] leading-[normal] text-muted">Ajustes para leitura e navegação</p>
          </div>
        </div>

        <div className="mt-[18px] flex min-h-[116px] rounded-[22px] bg-brand px-[20px] py-[22px]">
          <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white text-[17px] font-bold text-brand">
            Aa
          </span>
          <div className="ml-[16px]">
            <p className="m-0 text-[19px] font-bold leading-[normal] text-white">Interface adaptável</p>
            <p className="m-0 mt-[5px] text-[13px] leading-[normal] text-brand-mint">Leitura confortável e segura.</p>
            <span className="mt-[12px] inline-flex h-[24px] items-center rounded-[12px] bg-[#d8efe0] px-[14px] text-[11px] font-bold text-brand">
              Perfil inclusivo
            </span>
          </div>
        </div>

        <h2 className="m-0 mt-[28px] text-[18px] font-bold leading-[normal] text-ink">Ferramentas</h2>
        <div className="mt-[12px] flex flex-col gap-[12px]">
          {TOOLS.map((t) => (
            <div key={t.key} className="flex h-[56px] items-center rounded-[16px] border border-solid border-line bg-white px-[14px]">
              <span
                className={`flex size-[32px] shrink-0 items-center justify-center rounded-[9px] text-[14px] leading-none text-ink ${t.iconClass ?? ''}`}
                style={{ background: t.bg }}
              >
                {t.icon}
              </span>
              <div className="ml-[14px] min-w-0 flex-1">
                <p className="m-0 text-[13px] font-bold leading-[normal] text-ink">{t.title}</p>
                <p className="m-0 mt-[2px] truncate text-[11px] leading-[normal] text-muted">{t.sub}</p>
              </div>
              <Switch on={Boolean(a11y[t.key])} onChange={(v) => set(t.key, v)} label={t.title} />
            </div>
          ))}
        </div>
        {error && (
          <div className="mt-[14px]">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-[10px] px-[22px] pb-[34px] pt-[16px]">
        {JSON.stringify(initial) !== JSON.stringify(a11y) && (
          <button
            type="button"
            onClick={() => setA11y(initial)}
            className="h-[48px] rounded-[14px] border-0 bg-white px-[18px] text-[14px] font-bold text-muted"
          >
            Desfazer
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex h-[48px] flex-1 items-center justify-center rounded-[14px] border-0 bg-brand text-[15px] font-bold text-white"
        >
          {busy ? <Spinner light /> : 'Salvar ajustes'}
        </button>
      </div>
    </div>
  )
}
