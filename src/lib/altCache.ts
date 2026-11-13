import { findAlternatives } from './off'
import type { OffProduct } from './types'

// Guarda as alternativas já buscadas durante a sessão (evita repetir a busca
// ao voltar da tela de detalhe).
const cache = new Map<string, Promise<OffProduct[]>>()

export function alternativesFor(scanId: string, product: OffProduct): Promise<OffProduct[]> {
  let p = cache.get(scanId)
  if (!p) {
    p = findAlternatives(product, 3)
    p.catch(() => cache.delete(scanId))
    cache.set(scanId, p)
  }
  return p
}

export function cachedAlternative(scanId: string, code: string): Promise<OffProduct | undefined> | null {
  const p = cache.get(scanId)
  return p ? p.then((list) => list.find((x) => x.code === code)) : null
}
