import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { supabaseConfigured } from './lib/supabase'
import { canAccess, homeFor } from './lib/roles'
import { Loading } from './components/ui'
import logo from './assets/figma/logo.png'

import Splash from './screens/Splash'
import Onboarding from './screens/Onboarding'
import Auth from './screens/Auth'
import Home from './screens/Home'

// telas carregadas sob demanda (deixa a abertura do app mais rápida)
const ResetPassword = lazy(() => import('./screens/ResetPassword'))
const ForgotPassword = lazy(() => import('./screens/ForgotPassword'))
const NutritionistHome = lazy(() => import('./screens/NutritionistHome'))
const PatientDetail = lazy(() => import('./screens/PatientDetail'))
const AdminHome = lazy(() => import('./screens/AdminHome'))
const Scanner = lazy(() => import('./screens/Scanner'))
const Analyzing = lazy(() => import('./screens/Analyzing'))
const Result = lazy(() => import('./screens/Result'))
const Alternatives = lazy(() => import('./screens/Alternatives'))
const AlternativeDetail = lazy(() => import('./screens/AlternativeDetail'))
const Saved = lazy(() => import('./screens/Saved'))
const History = lazy(() => import('./screens/History'))
const Alerts = lazy(() => import('./screens/Alerts'))
const AlertSettings = lazy(() => import('./screens/AlertSettings'))
const Profile = lazy(() => import('./screens/Profile'))
const Plans = lazy(() => import('./screens/Plans'))
const Gamification = lazy(() => import('./screens/Gamification'))
const Accessibility = lazy(() => import('./screens/Accessibility'))

/**
 * Protege as telas: exige login e confere se o perfil da conta pode abrir a rota.
 * Quem tenta abrir a área de outro perfil volta para a própria tela inicial.
 * (O banco aplica a mesma regra com RLS; isto é só a navegação.)
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, session, loaded, role } = useApp()
  const location = useLocation()
  if (!ready) return <Loading />
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  if (!loaded) return <Loading />
  if (!canAccess(role, location.pathname)) return <Navigate to={homeFor(role)} replace />
  return <>{children}</>
}

/**
 * No celular o app ocupa a tela inteira. No computador ele aparece
 * dentro de uma moldura de celular, centralizado.
 */
function PhoneFrame({ children }: { children: ReactNode }) {
  const { a11y } = useApp()
  const cls = [
    a11y.largeText && 'a11y-large-text',
    a11y.highContrast && 'a11y-contrast',
    a11y.reduceMotion && 'a11y-reduce-motion',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="flex h-dvh w-full items-center justify-center gap-[72px] sm:p-[24px]">
      <aside className="hidden max-w-[300px] flex-col gap-[14px] lg:flex">
        <img src={logo} alt="" width={72} height={72} className="rounded-[18px]" />
        <h1 className="m-0 text-[34px] font-bold leading-tight text-ink">NutriDecifra</h1>
        <p className="m-0 text-[16px] text-muted">Decifre o que você come.</p>
        <p className="m-0 text-[14px] leading-relaxed text-muted">
          O NutriDecifra foi feito para o celular: abra este endereço no navegador do seu telefone para usar a câmera e
          ler o código de barras dos produtos. No celular, você também pode adicionar o app à tela inicial.
        </p>
      </aside>
      <div
        className={`relative h-full w-full overflow-hidden bg-page [transform:translateZ(0)] sm:h-[min(844px,100%)] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-[#13241b] sm:shadow-[0_30px_80px_-20px_rgba(19,36,27,0.45)] ${cls}`}
      >
        {children}
      </div>
    </div>
  )
}

function MissingConfig() {
  return (
    <div className="flex h-full flex-col justify-center gap-[12px] bg-white p-[28px]">
      <h2 className="m-0 text-[20px] font-bold">Configuração pendente</h2>
      <p className="m-0 text-[14px] text-muted">
        Crie o arquivo <code>.env.local</code> com <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> (veja o
        README) e reinicie o servidor.
      </p>
    </div>
  )
}

function AppRoutes() {
  if (!supabaseConfigured) return <MissingConfig />
  const p = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/boas-vindas" element={<Onboarding />} />
        <Route path="/entrar" element={<Auth mode="login" />} />
        <Route path="/cadastrar" element={<Auth mode="signup" />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />

        <Route path="/inicio" element={p(<Home />)} />
        <Route path="/scanner" element={p(<Scanner />)} />
        <Route path="/analisando/:code" element={p(<Analyzing />)} />
        <Route path="/resultado/:id" element={p(<Result />)} />
        <Route path="/alternativas/:id" element={p(<Alternatives />)} />
        <Route path="/alternativas/:id/:code" element={p(<AlternativeDetail />)} />
        <Route path="/salvo" element={p(<Saved />)} />
        <Route path="/historico" element={p(<History />)} />
        <Route path="/alertas" element={p(<Alerts />)} />
        <Route path="/alertas/personalizar" element={p(<AlertSettings />)} />
        <Route path="/perfil" element={p(<Profile />)} />
        <Route path="/planos" element={p(<Plans />)} />
        <Route path="/conquistas" element={p(<Gamification />)} />
        <Route path="/acessibilidade" element={p(<Accessibility />)} />

        {/* Nutricionista */}
        <Route path="/profissional" element={p(<NutritionistHome />)} />
        <Route path="/profissional/paciente/:id" element={p(<PatientDetail />)} />

        {/* Administrador */}
        <Route path="/admin" element={p(<AdminHome />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <PhoneFrame>
          <AppRoutes />
        </PhoneFrame>
      </BrowserRouter>
    </AppProvider>
  )
}
