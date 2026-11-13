import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { ErrorBox, Spinner, Toast } from '../components/ui'
import logo from '../assets/figma/logo.png'

const AFTER_SIGNUP_KEY = 'nd.afterSignup'

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  if (m.includes('user already registered')) return 'Este e-mail já tem uma conta. Toque em "Entrar".'
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid format')) return 'Digite um e-mail válido.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão com a internet.'
  return msg
}

/** 03 · Login e 03b · Cadastro */
export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [profileLater, setProfileLater] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // já logado (ex.: voltou do login com Google ou confirmou o e-mail)
  useEffect(() => {
    if (!session) return
    let goProfile = false
    try {
      goProfile = localStorage.getItem(AFTER_SIGNUP_KEY) === 'profile'
      localStorage.removeItem(AFTER_SIGNUP_KEY)
    } catch {
      /* ignora */
    }
    const from = (location.state as { from?: string } | null)?.from
    navigate(goProfile ? '/alertas/personalizar' : from || '/inicio', { replace: true })
  }, [session, navigate, location.state])

  useEffect(() => {
    setError(null)
    setInfo(null)
  }, [mode])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!email.trim()) return setError('Digite seu e-mail.')
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    setBusy(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else {
        try {
          localStorage.setItem(AFTER_SIGNUP_KEY, profileLater ? 'home' : 'profile')
        } catch {
          /* ignora */
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/entrar` },
        })
        if (error) throw error
        if (data.user && data.user.identities?.length === 0) {
          throw new Error('User already registered')
        }
        if (!data.session) {
          setInfo(`Enviamos um link de confirmação para ${email.trim()}. Abra o e-mail e toque no link para ativar sua conta.`)
        }
      }
    } catch (err) {
      setError(translateAuthError((err as Error).message))
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    setError(null)
    setInfo(null)
    if (!email.trim()) return setError('Digite seu e-mail acima e toque de novo em "Esqueci minha senha".')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setBusy(false)
    if (error) setError(translateAuthError(error.message))
    else setInfo(`Se existir uma conta com ${email.trim()}, você vai receber um link para criar uma nova senha.`)
  }

  async function google() {
    setError(null)
    setBusy(true)
    try {
      // confere se o login com Google foi ativado no Supabase antes de redirecionar
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      })
      const settings = (await res.json()) as { external?: Record<string, boolean> }
      if (!settings.external?.google) {
        setBusy(false)
        setToast('Login com Google em breve. Por enquanto, use e-mail e senha.')
        return
      }
      if (!isLogin) {
        try {
          localStorage.setItem(AFTER_SIGNUP_KEY, profileLater ? 'home' : 'profile')
        } catch {
          /* ignora */
        }
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/entrar` },
      })
      if (error) throw error
    } catch (err) {
      setBusy(false)
      setError(translateAuthError((err as Error).message))
    }
  }

  return (
    <div className="no-scrollbar relative h-full overflow-y-auto bg-white">
      <form onSubmit={submit} className="flex min-h-full flex-col px-[37px] pb-[24px]" noValidate>
        <div className="flex justify-center pt-[62px]">
          <img src={logo} alt="NutriDecifra" width={78} height={78} className="size-[78px] object-cover" />
        </div>
        <h1 className="m-0 mt-[28px] text-center text-[24px] font-bold leading-[normal] text-ink">
          {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </h1>
        <p className="m-0 mt-[6px] text-center text-[14px] leading-[normal] text-muted">
          {isLogin ? 'Entre para decifrar seus rótulos' : 'Configure seu perfil nutricional'}
        </p>

        <div className="mt-[33px] flex h-[44px] rounded-[12px] bg-track p-[5px]" role="tablist">
          <Link
            to="/entrar"
            replace
            role="tab"
            aria-selected={isLogin}
            className={`flex flex-1 items-center justify-center rounded-[9px] text-[14px] no-underline ${
              isLogin ? 'bg-white font-bold text-brand' : 'font-bold text-muted'
            }`}
          >
            Entrar
          </Link>
          <Link
            to="/cadastrar"
            replace
            role="tab"
            aria-selected={!isLogin}
            className={`flex flex-1 items-center justify-center rounded-[9px] text-[14px] no-underline ${
              !isLogin ? 'bg-white font-medium text-brand' : 'font-medium text-muted'
            }`}
          >
            Cadastrar
          </Link>
        </div>

        <label htmlFor="email" className="mt-[36px] text-[13px] font-medium leading-[normal] text-ink">
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

        <label htmlFor="password" className="mt-[22px] text-[13px] font-medium leading-[normal] text-ink">
          Senha
        </label>
        <div className="relative mt-[7px]">
          <input
            id="password"
            type={showPass ? 'text' : 'password'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[52px] w-full rounded-[12px] border-0 bg-page pl-[15px] pr-[52px] text-[15px] text-ink outline-none placeholder:text-ink focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
            className="absolute right-[4px] top-[4px] flex size-[44px] items-center justify-center border-0 bg-transparent text-[18px]"
            style={{ opacity: showPass ? 1 : 0.85 }}
          >
            👁
          </button>
        </div>

        <div className="mt-[13px] flex justify-end">
          {isLogin ? (
            <button type="button" onClick={forgot} className="-mr-[3px] border-0 bg-transparent p-0 text-[13px] font-medium text-brand">
              Esqueci minha senha
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setProfileLater((v) => !v)}
              aria-pressed={profileLater}
              className="-mr-[3px] border-0 bg-transparent p-0 text-[13px] font-medium text-brand"
            >
              {profileLater ? '✓ ' : ''}Criar perfil depois
            </button>
          )}
        </div>

        {(error || info) && (
          <div className="mt-[14px]">
            {error ? (
              <ErrorBox>{error}</ErrorBox>
            ) : (
              <p className="m-0 rounded-[12px] bg-brand-tint px-[14px] py-[10px] text-[13px] font-medium text-brand">{info}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-[26px] flex h-[54px] w-full items-center justify-center rounded-[14px] border-0 bg-brand text-[16px] font-bold text-white disabled:opacity-70"
        >
          {busy ? <Spinner light /> : isLogin ? 'Entrar' : 'Criar conta'}
        </button>

        <p className="m-0 mt-[22px] text-center text-[12px] leading-[normal] text-faint">— ou continue com —</p>

        <div className="mt-[17px] flex gap-[15px]">
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="h-[52px] flex-1 rounded-[14px] border-[1.5px] border-solid border-line bg-white text-[14px] font-medium text-ink"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => setToast('Login com Apple em breve.')}
            className="h-[52px] flex-1 rounded-[14px] border-[1.5px] border-solid border-line bg-white text-[14px] font-medium text-ink"
          >
            Apple
          </button>
        </div>

        <div className="flex-1" />
        <p className="m-0 mt-[38px] text-center text-[13px] leading-[normal] text-muted">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          {'  '}
          <Link to={isLogin ? '/cadastrar' : '/entrar'} replace className="text-muted no-underline">
            {isLogin ? 'Cadastre-se' : 'Entrar'}
          </Link>
        </p>
      </form>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
