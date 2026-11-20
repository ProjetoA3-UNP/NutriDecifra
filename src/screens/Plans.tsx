import { useState } from 'react'
import { BackArrow, Toast } from '../components/ui'
import { ArrowRight, Building, Check, Crown, Star, X } from 'lucide-react'

const MONTHLY = 9.9
const ANNUAL_DISCOUNT = 0.25
const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 11 · Planos — o Premium ainda não está à venda ("Em breve") */
export default function Plans() {
  const [annual, setAnnual] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const perMonth = annual ? MONTHLY * (1 - ANNUAL_DISCOUNT) : MONTHLY
  const perYear = MONTHLY * 12 * (1 - ANNUAL_DISCOUNT)

  const check = (text: string, ok = true, light = false) => (
    <li className={`flex items-center gap-[8px] text-[13px] leading-[normal] ${light ? 'text-white' : ok ? 'text-muted' : 'text-faint'}`}>
      <span className="flex w-[12px]">{ok ? <Check size={13} strokeWidth={3} aria-hidden /> : <X size={13} strokeWidth={3} aria-hidden />}</span>
      {text}
    </li>
  )

  return (
    <div className="no-scrollbar relative h-full overflow-y-auto bg-page px-[22px] pb-[28px]">
      <div className="pt-[62px]">
        <BackArrow />
      </div>
      <h1 className="m-0 mt-[17px] text-[22px] font-bold leading-[normal] text-ink">Escolha seu plano</h1>
      <p className="m-0 mt-[3px] text-[13px] leading-[normal] text-muted">Mais saúde, mais autonomia, mais economia</p>

      {/* mensal / anual */}
      <div className="relative mx-auto mt-[19px] flex h-[42px] w-[251px] rounded-[12px] bg-white p-[4px]">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`h-[34px] w-[120px] rounded-[9px] border-0 text-[13px] ${!annual ? 'bg-brand font-bold text-white' : 'bg-transparent font-medium text-muted'}`}
        >
          Mensal
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`h-[34px] flex-1 rounded-[9px] border-0 pr-[30px] text-[13px] ${annual ? 'bg-brand font-bold text-white' : 'bg-transparent font-medium text-muted'}`}
        >
          Anual
        </button>
        <span className="pointer-events-none absolute right-[5px] top-[7px] flex h-[18px] w-[46px] items-center justify-center rounded-[9px] bg-score-d text-[10px] font-bold text-white">
          −25%
        </span>
      </div>

      {/* Free */}
      <div className="mt-[23px] rounded-[20px] bg-white px-[16px] pb-[14px] pt-[18px]">
        <div className="flex items-center">
          <span className="text-[18px] font-bold leading-[normal] text-ink">Free</span>
          <span className="ml-[13px] flex h-[22px] items-center rounded-[11px] bg-brand-tint px-[8px] text-[9px] font-bold text-brand">
            SEU PLANO ATUAL
          </span>
          <span className="ml-auto text-[20px] font-bold leading-[normal] text-ink">R$ 0</span>
        </div>
        <ul className="m-0 mt-[16px] flex list-none flex-col gap-[7px] p-0">
          {check('Até 10 rótulos por mês')}
          {check('Alertas básicos')}
          {check('Sem alternativas premium', false)}
        </ul>
      </div>

      {/* Premium */}
      <div className="relative mt-[16px] overflow-hidden rounded-[20px] bg-brand px-[16px] pb-[4px] pt-[18px]">
        <span className="decor absolute right-[13px] top-[23px] size-[120px] rounded-full bg-[#2e8b57]/55" />
        <span className="decor absolute right-[35px] top-[45px] flex size-[76px] items-center justify-center rounded-full bg-brand-light/55 text-white">
          <Crown size={38} strokeWidth={1.8} aria-hidden />
        </span>
        <span className="relative inline-flex h-[22px] items-center gap-[4px] rounded-[11px] bg-[#fff3c4] px-[10px] text-[10px] font-bold text-caution-ink">
          <Star size={11} fill="currentColor" aria-hidden />
          MAIS POPULAR
        </span>
        <p className="relative m-0 mt-[8px] text-[22px] font-bold leading-[normal] text-white">Premium</p>
        <p className="relative m-0 mt-[5px] text-white">
          <span className="text-[28px] font-bold leading-[normal]">R$ {brl(perMonth)}</span>
          <span className="text-[14px] text-brand-soft">/mês</span>
        </p>
        {annual && <p className="relative m-0 text-[11px] text-brand-soft">R$ {brl(perYear)} cobrados uma vez por ano</p>}
        <ul className="relative m-0 mt-[10px] flex list-none flex-col gap-[6px] p-0">
          {check('Rótulos ilimitados', true, true)}
          {check('Alertas avançados por perfil', true, true)}
          {check('Sugestões de alternativas', true, true)}
        </ul>
        <button
          type="button"
          onClick={() => setToast('Em breve! Por enquanto, todos os recursos estão liberados para você.')}
          className="relative mb-[4px] mt-[12px] h-[42px] w-full rounded-[10px] border-0 bg-white text-[14px] font-bold text-brand"
        >
          Assinar Premium
        </button>
      </div>

      {/* Institucional */}
      <div className="mt-[16px] flex rounded-[20px] bg-white px-[16px] pb-[16px] pt-[20px]">
        <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-brand-tint text-brand">
          <Building size={22} aria-hidden />
        </span>
        <div className="ml-[16px]">
          <p className="m-0 text-[15px] font-bold leading-[normal] text-ink">Institucional (B2B)</p>
          <p className="m-0 mt-[4px] text-[12px] leading-[1.25] text-muted">
            Para clínicas, escolas e empresas
            <br />
            Valor sob demanda
          </p>
          <button
            type="button"
            onClick={() => setToast('Atendimento a empresas em breve.')}
            className="mt-[8px] inline-flex items-center gap-[4px] border-0 bg-transparent p-0 text-[12px] font-bold text-brand"
          >
            Falar com vendas <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>

      <p className="m-0 mt-[18px] text-center text-[11px] leading-[normal] text-faint">Cancele quando quiser · sem pegadinhas</p>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
