import { useEffect, useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from './supabase'
import type { Scan } from './types'

/** Busca uma leitura pelo id (primeiro na memória, depois no Supabase). */
export function useScan(id: string | undefined) {
  const { scans, ready } = useApp()
  const cached = scans.find((s) => s.id === id) ?? null
  const [fetched, setFetched] = useState<Scan | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!id || cached || !ready) return
    let active = true
    supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        if (data) setFetched(data as Scan)
        else setMissing(true)
      })
    return () => {
      active = false
    }
  }, [id, cached, ready])

  return { scan: cached ?? fetched, missing }
}

/** volta para a tela anterior; se não houver, vai para o início */
export function goBack(navigate: NavigateFunction) {
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
  if (idx > 0) navigate(-1)
  else navigate('/inicio')
}
