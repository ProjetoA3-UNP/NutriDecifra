import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import btnBg from '../assets/figma/scanner-btn-bg.svg'
import captureOuter from '../assets/figma/capture-outer.svg'
import captureInner from '../assets/figma/capture-inner.svg'
import { isValidBarcode } from '../lib/off'

type CamState = 'starting' | 'running' | 'denied' | 'unavailable' | 'insecure'

function makeReader() {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ])
  hints.set(DecodeHintType.TRY_HARDER, true)
  return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 })
}

/** 05 · Scanner — lê o código de barras (EAN/UPC) com a câmera do celular */
export default function Scanner() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const doneRef = useRef(false)
  const [cam, setCam] = useState<CamState>('starting')
  const [torch, setTorch] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  const found = useCallback(
    (text: string) => {
      if (doneRef.current) return
      const digits = text.replace(/\D/g, '')
      if (!isValidBarcode(digits)) return
      doneRef.current = true
      try {
        navigator.vibrate?.(60)
      } catch {
        /* ignora */
      }
      controlsRef.current?.stop()
      navigate(`/analisando/${digits}`, { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    if (!window.isSecureContext) {
      setCam('insecure')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam('unavailable')
      return
    }
    let cancelled = false
    const reader = makeReader()
    readerRef.current = reader
    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current!,
        (result) => {
          if (result) found(result.getText())
        },
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setTorchAvailable(Boolean(controls.switchTorch))
        setCam('running')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setCam(err.name === 'NotAllowedError' || err.name === 'SecurityError' ? 'denied' : 'unavailable')
      })
    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [found])

  async function toggleTorch() {
    const c = controlsRef.current
    if (!c?.switchTorch) {
      setHint('Este aparelho não permite ligar a lanterna pelo navegador.')
      return
    }
    try {
      await c.switchTorch(!torch)
      setTorch(!torch)
    } catch {
      setHint('Não foi possível ligar a lanterna.')
    }
  }

  /** Botão de captura: tenta ler o quadro atual da câmera na hora */
  function capture() {
    const video = videoRef.current
    const reader = readerRef.current
    if (cam !== 'running' || !video || !reader || !video.videoWidth) {
      setManual(true)
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    try {
      const r = reader.decodeFromCanvas(canvas)
      found(r.getText())
    } catch {
      setHint('Nenhum código de barras encontrado. Aproxime a câmera e mantenha o código dentro do quadro.')
    }
  }

  function submitManual(e: FormEvent) {
    e.preventDefault()
    const digits = code.replace(/\D/g, '')
    if (!isValidBarcode(digits)) {
      setCodeError('O código de barras tem de 8 a 14 números.')
      return
    }
    found(digits)
  }

  useEffect(() => {
    if (!hint) return
    const t = setTimeout(() => setHint(null), 3500)
    return () => clearTimeout(t)
  }, [hint])

  const camMessage =
    cam === 'denied'
      ? 'Permita o acesso à câmera nas configurações do navegador para ler o código de barras.'
      : cam === 'insecure'
        ? 'A câmera só funciona em conexão segura (https).'
        : cam === 'unavailable'
          ? 'Não encontramos uma câmera disponível neste aparelho.'
          : null

  return (
    <div className="relative flex h-full flex-col bg-cam text-white">
      {/* barra superior */}
      <div className="relative z-10 flex h-[110px] shrink-0 items-start justify-between bg-[rgba(14,15,17,0.6)] px-[22px] pt-[58px]">
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => navigate('/inicio')}
          className="relative flex size-[40px] items-center justify-center border-0 bg-transparent p-0 text-[18px] font-bold text-white"
        >
          <img src={btnBg} alt="" width={40} height={40} className="absolute inset-0" />
          <span className="relative">✕</span>
        </button>
        <h1 className="m-0 mt-[8px] text-[16px] font-bold leading-[normal]">Escanear rótulo</h1>
        <button
          type="button"
          aria-label={torch ? 'Desligar lanterna' : 'Ligar lanterna'}
          aria-pressed={torch}
          onClick={toggleTorch}
          className="relative flex size-[40px] items-center justify-center border-0 bg-transparent p-0 text-[20px]"
          style={{ opacity: torchAvailable || cam !== 'running' ? 1 : 0.5 }}
        >
          <img src={btnBg} alt="" width={40} height={40} className="absolute inset-0" style={{ opacity: torch ? 0 : 1 }} />
          {torch && <span className="absolute inset-0 rounded-full bg-[#ffb300]" />}
          <span className="relative">⚡</span>
        </button>
      </div>

      {/* câmera */}
      <div className="relative flex-1 overflow-hidden bg-cam-2">
        <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />

        <div className="absolute inset-x-0 top-[calc(50%-24px)] mx-auto h-[320px] w-[255px] -translate-y-1/2">
          {/* cantos do quadro */}
          <span className="absolute left-0 top-0 h-[4px] w-[36px] bg-brand-light" />
          <span className="absolute left-0 top-0 h-[36px] w-[4px] bg-brand-light" />
          <span className="absolute right-0 top-0 h-[4px] w-[36px] bg-brand-light" />
          <span className="absolute right-0 top-0 h-[36px] w-[4px] bg-brand-light" />
          <span className="absolute bottom-0 left-0 h-[4px] w-[36px] bg-brand-light" />
          <span className="absolute bottom-0 left-0 h-[36px] w-[4px] bg-brand-light" />
          <span className="absolute bottom-0 right-0 h-[4px] w-[36px] bg-brand-light" />
          <span className="absolute bottom-0 right-0 h-[36px] w-[4px] bg-brand-light" />
          {cam === 'running' && (
            <span
              className="animate-scanline absolute left-0 top-[8px] h-[3px] w-full bg-brand-light"
              style={{ ['--scan-distance' as string]: '300px' }}
            />
          )}
          {cam === 'starting' && (
            <span className="absolute inset-0 flex items-center justify-center text-[13px] text-faint">Abrindo câmera…</span>
          )}
          {camMessage && (
            <span className="absolute inset-[16px] flex items-center justify-center text-center text-[13px] leading-[1.45] text-[#c9d1cc]">
              {camMessage}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-[24px] flex flex-col items-center px-[22px] text-center">
          <p className="m-0 text-[14px] font-medium leading-[normal] text-white">Posicione o código de barras dentro do quadro</p>
          <p className="m-0 mt-[9px] text-[12px] leading-[normal] text-faint">Mantenha bem iluminado para melhor leitura</p>
          <button
            type="button"
            onClick={() => setManual(true)}
            className="mt-[10px] border-0 bg-transparent p-[4px] text-[12px] font-bold text-brand-light"
          >
            Digitar o código
          </button>
        </div>

        {hint && (
          <div className="animate-fadeup absolute inset-x-[22px] top-[16px] rounded-[12px] bg-black/70 px-[14px] py-[10px] text-center text-[12px]">
            {hint}
          </div>
        )}
      </div>

      {/* botão de captura */}
      <div className="flex h-[174px] shrink-0 justify-center bg-cam pt-[40px]">
        <button
          type="button"
          aria-label="Ler código agora"
          onClick={capture}
          className="relative size-[86px] border-0 bg-transparent p-0"
        >
          <img src={captureOuter} alt="" width={86} height={86} className="absolute inset-0" />
          <img src={captureInner} alt="" width={64} height={64} className="absolute left-[11px] top-[11px]" />
        </button>
      </div>

      {/* digitar o código manualmente */}
      {manual && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/60" onClick={() => setManual(false)}>
          <form
            onSubmit={submitManual}
            onClick={(e) => e.stopPropagation()}
            className="animate-fadeup w-full rounded-t-[24px] bg-white px-[22px] pb-[32px] pt-[24px] text-ink"
          >
            <h2 className="m-0 text-[18px] font-bold">Digitar código de barras</h2>
            <p className="m-0 mt-[6px] text-[13px] text-muted">São os números embaixo das barras, na embalagem.</p>
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ex.: 7891000100103"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setCodeError(null)
              }}
              className="mt-[16px] h-[52px] w-full rounded-[12px] border-0 bg-page px-[15px] text-[16px] tracking-wider outline-none focus:ring-2 focus:ring-brand/40"
            />
            {codeError && <p className="m-0 mt-[8px] text-[12px] font-medium text-danger-ink">{codeError}</p>}
            <button type="submit" className="mt-[16px] h-[54px] w-full rounded-[14px] border-0 bg-brand text-[16px] font-bold text-white">
              Analisar produto
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
