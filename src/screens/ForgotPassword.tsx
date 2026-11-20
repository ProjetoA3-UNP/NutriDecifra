import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BackArrow, ErrorBox, Spinner } from '../components/ui'
import logo from '../assets/figma/logo.png'

/** Recuperar senha: envia por e-mail o link para criar uma nova senha */
export default function ForgotPassword() {
  const location = useLocation()
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(value)) return setError('Digite um e-mail válido.')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setBusy(false)
    if (error) {
      const m = error.message.toLowerCase()
      setError(m.includes('rate limit') || m.includes('too many') ? 'Muitas tentativas. Aguarde um pouco e tente de novo.' : error.message)
      return
    }
    setSentTo(value)
  }

  return (
    <form onSubmit={submit} noValidate className="no-scrollbar flex h-full flex-col overflow-y-auto bg-white px-[37px] pb-[24px]">
      <div className="pt-[62px]">
        <BackArrow to="/entrar" />
      </div>
      <div className="mt-[8px] flex justify-center">
        <img src={logo} alt="NutriDecifra" width={78} height={78} className="size-[78px] object-cover" />
      </div>
      <h1 className="m-0 mt-[28px] text-center text-[24px] font-bold text-ink">Esqueci minha senha</h1>
      <p className="m-0 mt-[6px] text-center text-[14px] leading-[1.4] text-muted">
        Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
      </p>

      {sentTo ? (
        <div className="mt-[32px] rounded-[16px] bg-brand-tint px-[18px] py-[18px] text-[13px] leading-[1.5] text-brand">
          <span className="flex items-center gap-[8px] text-[15px] font-bold">
            <MailCheck size={20} aria-hidden /> Verifique seu e-mail
          </span>
          <span className="mt-[6px] block">
            Se existir uma conta com <b>{sentTo}</b>, você vai receber um link em instantes. Abra o link neste aparelho para
            criar a nova senha. Confira também a caixa de spam.
          </span>
        </div>
      ) : (
        <>
          <label htmlFor="email" className="mt-[36px] text-[13px] font-medium text-ink">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-[7px] h-[52px] w-full rounded-[12px] border-0 bg-page px-[15px] text-[15px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-brand/40"
          />
          {error && (
            <div className="mt-[14px]">
              <ErrorBox>{error}</ErrorBox>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-[26px] flex h-[54px] w-full items-center justify-center rounded-[14px] border-0 bg-brand text-[16px] font-bold text-white disabled:opacity-70"
          >
            {busy ? <Spinner light /> : 'Enviar link'}
          </button>
        </>
      )}

      <div className="flex-1" />
      <p className="m-0 mt-[38px] text-center text-[13px] text-muted">
        Lembrou a senha?{' '}
        <Link to="/entrar" replace className="font-bold text-brand no-underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
