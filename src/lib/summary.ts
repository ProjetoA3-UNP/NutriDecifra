import type { Profile, Scan } from './types'
import { analyze, spoonsText } from './nutrition'

/** Frase curta sobre o produto, usada nas listas ("7 colheres de açúcar", "escolha consciente"...) */
export function scanHighlight(scan: Scan, profile: Profile | null): string {
  if (scan.replaced_scan_id) return 'boa alternativa'
  const g = scan.nutriscore
  if (scan.saved && (g === 'a' || g === 'b')) return 'escolha consciente'
  const a = analyze(scan.product, profile)
  if (scan.product.nutrient_levels?.sugars === 'high' && a.spoons !== null && a.spoons >= 0.5) {
    return spoonsText(a.spoons).replace('Menos', 'menos')
  }
  if (a.additives === 0 && a.nova !== null && a.nova <= 2) return '0 aditivos'
  if (scan.product.nutrient_levels?.salt === 'high') return 'alto em sódio'
  if (scan.product.nutrient_levels?.['saturated-fat'] === 'high') return 'alto em gordura saturada'
  if (g) return `Nutri-Score ${g.toUpperCase()}`
  return 'nota não disponível'
}

export function firstName(profile: Profile | null, email?: string | null) {
  const n = (profile?.name ?? email?.split('@')[0] ?? '').trim()
  return n.split(/\s+/)[0] || 'você'
}
