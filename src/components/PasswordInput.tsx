import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Campo de senha com o botão de mostrar/esconder (ícone de olho) */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder = '••••••••',
}: {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete: 'current-password' | 'new-password'
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative mt-[7px]">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full rounded-[12px] border-0 bg-page pl-[15px] pr-[52px] text-[15px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-brand/40"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
        aria-pressed={show}
        className="absolute right-[4px] top-[4px] flex size-[44px] items-center justify-center border-0 bg-transparent text-muted"
      >
        {show ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
      </button>
    </div>
  )
}
