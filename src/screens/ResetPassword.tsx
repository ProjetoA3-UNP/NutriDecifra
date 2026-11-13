import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { ErrorBox, Spinner } from '../components/ui'
import logo from '../assets/figma/logo.png'

/** Criar nova senha (aberta pelo link enviado por e-mail) */
export default function ResetPassword() {
  const { session, ready } = useApp()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    navigate('/inicio', { replace: true })
  }

  return (
    <form onSubmit={submit} className="flex h-full flex-col bg-white px-[37px] pt-[62px]">
      <div className="flex justify-center">
        <img src={logo} alt="NutriDecifra" width={78} height={78} />
      </div>
      <h1 className="m-0 mt-[28px] text-center text-[24px] font-bold text-ink">Nova senha</h1>
      <p className="m-0 mt-[6px] text-center text-[14px] text-muted">Escolha uma nova senha para sua conta</p>
      {ready && !session ? (
        <div className="mt-[30px]">
          <ErrorBox>O link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".</ErrorBox>
        </div>
      ) : (
        <>
          <label htmlFor="np" className="mt-[36px] text-[13px] font-medium text-ink">
            Nova senha
          </label>
          <input
            id="np"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-[7px] h-[52px] rounded-[12px] border-0 bg-page px-[15px] text-[15px] outline-none focus:ring-2 focus:ring-brand/40"
          />
          {error && (
            <div className="mt-[14px]">
              <ErrorBox>{error}</ErrorBox>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-[26px] flex h-[54px] items-center justify-center rounded-[14px] border-0 bg-brand text-[16px] font-bold text-white"
          >
            {busy ? <Spinner light /> : 'Salvar nova senha'}
          </button>
        </>
      )}
    </form>
  )
}
