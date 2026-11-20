import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import circle from '../assets/figma/onb-circle.svg'
import { ONBOARDING_KEY } from './Splash'
import { Ban, Bell, Candy, ChartPie, Repeat, Salad, Trophy } from 'lucide-react'
import { SaltIcon, SpoonIcon } from '../components/icons'

const PAGES = [
  {
    Icon: Salad,
    tag: 'PROPOSTA DE VALOR',
    title: 'Tradução prática e personalizada de rótulos',
    cards: [
      { Icon: SpoonIcon, color: '#1f7a4d', text: ['Equivalente a 7 colheres', 'de açúcar'], bg: '#f4faf6' },
      { Icon: ChartPie, color: '#ff8a3d', text: ['85% da sua cota diária', 'de açúcar'], bg: '#fff4ec' },
    ],
  },
  {
    Icon: Bell,
    tag: 'ALERTAS PERSONALIZADOS',
    title: 'Avisos feitos para o seu perfil',
    cards: [
      { Icon: Ban, color: '#e84141', text: ['Contém glúten · você', 'marcou intolerância'], bg: '#fdecec' },
      { Icon: SaltIcon, color: '#ff8a3d', text: ['Sódio acima do limite', 'que você definiu'], bg: '#fff4ec' },
    ],
  },
  {
    Icon: Repeat,
    tag: 'ESCOLHAS MELHORES',
    title: 'Alternativas mais saudáveis em segundos',
    cards: [
      { Icon: Candy, color: '#1f7a4d', text: ['Produtos da mesma categoria', 'com nota melhor'], bg: '#f4faf6' },
      { Icon: Trophy, color: '#c98a00', text: ['Pontos e conquistas a cada', 'boa escolha'], bg: '#fff8e0' },
    ],
  },
]

/** 02 · Onboarding */
export default function Onboarding() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const p = PAGES[page]

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1')
    } catch {
      /* ignora */
    }
    navigate('/entrar', { replace: true })
  }

  return (
    <div className="flex h-full flex-col bg-white px-[37px]">
      <div className="flex h-[100px] shrink-0 items-start justify-end pt-[42px]">
        <button
          type="button"
          onClick={finish}
          className="-mr-[18px] h-[44px] w-[64px] border-0 bg-transparent text-[14px] font-medium text-muted"
        >
          Pular
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto" key={page}>
        <div className="animate-fadeup flex h-[260px] items-center justify-center rounded-[24px] bg-brand-tint">
          <div className="relative flex h-[110px] w-[112px] items-center justify-center">
            <img src={circle} alt="" width={112} height={110} className="absolute inset-0" />
            <p.Icon size={56} strokeWidth={1.7} className="relative text-brand" aria-hidden />
          </div>
        </div>
        <p className="m-0 mt-[12px] text-[12px] font-bold leading-[normal] text-brand">{p.tag}</p>
        <h1 className="m-0 mt-[12px] text-[24px] font-bold leading-[normal] text-ink">{p.title}</h1>
        <p className="m-0 mt-[14px] text-[15px] leading-[normal] text-muted">Exemplos do que você vai ver:</p>
        <div className="mt-[21px] flex flex-col gap-[13px]">
          {p.cards.map((c) => (
            <div key={c.text[0]} className="flex h-[62px] items-center gap-[20px] rounded-[14px] px-[15px]" style={{ background: c.bg }}>
              <c.Icon size={28} style={{ color: c.color }} className="shrink-0" aria-hidden />
              <p className="m-0 text-[14px] font-medium leading-[normal] text-ink">
                {c.text[0]}
                <br />
                {c.text[1]}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 pb-[38px]">
        <div className="flex justify-center gap-[8px] py-[27px]" aria-label={`Página ${page + 1} de ${PAGES.length}`}>
          {PAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para página ${i + 1}`}
              onClick={() => setPage(i)}
              className="h-[8px] rounded-[4px] border-0 p-0 transition-all"
              style={{ width: i === page ? 28 : 8, background: i === page ? '#1f7a4d' : '#c5d6cd' }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (page < PAGES.length - 1 ? setPage(page + 1) : finish())}
          className="h-[54px] w-full rounded-[14px] border-0 bg-brand text-[16px] font-bold text-white"
        >
          {page < PAGES.length - 1 ? 'Próximo' : 'Começar'}
        </button>
      </div>
    </div>
  )
}
