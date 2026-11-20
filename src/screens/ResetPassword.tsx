import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { ErrorBox, Loading, Spinner } from '../components/ui'
import { PasswordInput } from '../components/PasswordInput'
import { homeFor } from '../lib/roles'
import logo from '../assets/figma/logo.png'

/** Criar nova senha (aberta pelo link enviado por e-mail) */
export default function ResetPassword() {
  const { session, ready, role } = useApp()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    if (password !== confirm) return setError('As duas senhas não são iguais.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      return setError(
        error.message.toLowerCase().includes('different from the old')
          ? 'A nova senha precisa ser diferente da anterior.'
          : error.message,
      )
    }
    navigate(homeFor(role), { replace: true })
  }

  if (!ready) return <Loading bg="#fff" />

  return (
    <form onSubmit={submit} noValidate className="no-scrollbar flex h-full flex-col overflow-y-auto bg-white px-[37px] pb-[24px] pt-[62px]">
      <div className="flex justify-center">
        <img src={logo} alt="NutriDecifra" width={78} height={78} />
      </div>
      <h1 className="m-0 mt-[28px] text-center text-[24px] font-bold text-ink">Nova senha</h1>
      <p className="m-0 mt-[6px] text-center text-[14px] text-muted">Escolha uma nova senha para sua conta</p>
      {!session ? (
        <div className="mt-[30px] flex flex-col gap-[16px]">
          <ErrorBox>O link expirou ou já foi usado. Peça um novo link.</ErrorBox>
          <Link
            to="/recuperar-senha"
            replace
            className="flex h-[54px] items-center justify-center rounded-[14px] bg-brand text-[16px] font-bold text-white no-underline"
          >
            Pedir novo link
          </Link>
        </div>
      ) : (
        <>
          <label htmlFor="np" className="mt-[36px] text-[13px] font-medium text-ink">
            Nova senha
          </label>
          <PasswordInput id="np" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Mínimo de 6 caracteres" />
          <label htmlFor="np2" className="mt-[22px] text-[13px] font-medium text-ink">
            Confirmar nova senha
          </label>
          <PasswordInput id="np2" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Repita a senha" />
          {error && (
            <div className="mt-[14px]">
              <ErrorBox>{error}</ErrorBox>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-[26px] flex h-[54px] items-center justify-center rounded-[14px] border-0 bg-brand text-[16px] font-bold text-white disabled:opacity-70"
          >
            {busy ? <Spinner light /> : 'Salvar nova senha'}
          </button>
        </>
      )}
    </form>
  )
}
