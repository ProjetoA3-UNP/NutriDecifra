import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { homeFor } from '../lib/roles'
import logo from '../assets/figma/logo.png'
import decorMid from '../assets/figma/splash-decor-mid.svg'
import decorSmall from '../assets/figma/splash-decor-small.svg'
import decorBL from '../assets/figma/splash-decor-bl.svg'
import decorTR from '../assets/figma/splash-decor-tr.svg'
import dot1 from '../assets/figma/loading-dot-1.svg'
import dot2 from '../assets/figma/loading-dot-2.svg'
import pkg from '../../package.json'

export const ONBOARDING_KEY = 'nd.onboarding.done'

/** 01 · Início da apresentação (splash) */
export default function Splash() {
  const { ready, session, role } = useApp()
  const navigate = useNavigate()
  const [minTimePassed, setMinTimePassed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 1400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!ready || !minTimePassed) return
    let seen = false
    try {
      seen = localStorage.getItem(ONBOARDING_KEY) === '1'
    } catch {
      /* sem armazenamento: mostra a apresentação */
    }
    navigate(session ? homeFor(role) : seen ? '/entrar' : '/boas-vindas', { replace: true })
  }, [ready, minTimePassed, session, role, navigate])

  return (
    <div className="relative flex h-full flex-col items-center overflow-hidden bg-brand">
      <img src={decorTR} alt="" width={300} height={300} className="decor absolute right-[-95px] top-[-110px]" />
      <img src={decorSmall} alt="" width={48} height={48} className="decor absolute left-[36px] top-[160px]" />
      <img src={decorMid} alt="" width={120} height={120} className="decor absolute bottom-[132px] right-[-45px]" />
      <img src={decorBL} alt="" width={280} height={280} className="decor absolute bottom-[-68px] left-[-100px]" />

      <div className="relative flex flex-1 flex-col items-center justify-center pt-[24px]">
        <img src={logo} alt="Logo NutriDecifra" width={150} height={150} className="size-[150px] object-cover" />
        <h1 className="m-0 mt-[56px] text-[36px] font-bold leading-[normal] text-white">NutriDecifra</h1>
        <p className="m-0 mt-[4px] text-[16px] leading-[normal] text-[#e8f5ee]">Decifre o que você come</p>
        <p className="m-0 mt-[11px] text-[13px] font-medium leading-[normal] text-brand-soft">Saúde na palma da sua mão</p>
      </div>

      <div className="relative flex flex-col items-center pb-[33px]">
        <p className="m-0 text-[12px] font-medium leading-[normal] text-brand-soft" aria-live="polite">
          Carregando…
        </p>
        <div className="mt-[17px] flex gap-[10px]">
          {[dot1, dot2, dot2].map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              width={10}
              height={10}
              className="animate-dot size-[10px]"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <div className="mt-[31px] h-[2px] w-[62px] rounded-[1px] bg-brand-light" />
        <p className="m-0 mt-[8px] text-[11px] font-medium leading-[normal] text-brand-soft">Por Equipe NutriDecifra</p>
        <p className="m-0 mt-[4px] text-[10px] leading-[normal] text-brand-mint2">
          v {pkg.version.replace(/\.0$/, '')} · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
