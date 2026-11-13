// Cliente da API pública do Open Food Facts (https://world.openfoodfacts.org)
// Base de dados aberta e colaborativa de alimentos — todos os dados exibidos
// no app vêm daqui; nada é inventado.
import type { OffProduct } from './types'
import { gradeOf } from './nutrition'

const BASE = 'https://world.openfoodfacts.org'

export const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_pt',
  'generic_name_pt',
  'brands',
  'quantity',
  'product_quantity',
  'serving_quantity',
  'serving_size',
  'image_front_small_url',
  'image_front_url',
  'nutriscore_grade',
  'nova_group',
  'nutriments',
  'nutrient_levels',
  'allergens_tags',
  'traces_tags',
  'additives_n',
  'additives_tags',
  'categories_tags',
  'categories_hierarchy',
  'categories',
  'ingredients_text_pt',
  'ingredients_text',
  'popularity_key',
  'labels_tags',
  'countries_tags',
].join(',')

export const soldInBrazil = (p: OffProduct) => (p.countries_tags ?? []).includes('en:brazil')

export class ProductNotFoundError extends Error {
  barcode: string
  constructor(barcode: string) {
    super('Produto não encontrado')
    this.barcode = barcode
  }
}

export function isValidBarcode(code: string): boolean {
  return /^\d{8,14}$/.test(code)
}

/** Busca um produto pelo código de barras (EAN/UPC). */
export async function fetchProduct(barcode: string, signal?: AbortSignal): Promise<OffProduct> {
  const res = await fetch(`${BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}&lc=pt`, {
    signal,
  })
  if (res.status === 404) throw new ProductNotFoundError(barcode)
  if (!res.ok) throw new Error(`Open Food Facts respondeu ${res.status}`)
  const json = (await res.json()) as { status: number; product?: OffProduct }
  if (json.status !== 1 || !json.product) throw new ProductNotFoundError(barcode)
  const p = normalizeProduct(json.product)
  if (!p.code) p.code = barcode
  return p
}

/** A busca usa o serviço search.openfoodfacts.org, acessado por um
 *  redirecionamento do próprio site (/off-search), pois ele não libera
 *  acesso direto do navegador (CORS). Ver vite.config.ts e vercel.json. */
const SEARCH = '/off-search/search'

/** Algumas respostas trazem campos como lista em vez de texto — padroniza. */
export function normalizeProduct(p: OffProduct): OffProduct {
  const brands = p.brands as unknown
  return { ...p, brands: Array.isArray(brands) ? brands.join(', ') : (brands as string | undefined) }
}

async function searchCategory(category: string, grades: string[], country: 'brazil' | null, signal?: AbortSignal) {
  const filters = [`categories_tags:"${category.replace(/"/g, '')}"`, `nutriscore_grade:(${grades.join(' OR ')})`]
  if (country) filters.push(`countries_tags:"en:${country}"`)
  const params = new URLSearchParams({
    q: filters.join(' AND '),
    fields: OFF_FIELDS,
    sort_by: '-unique_scans_n',
    page_size: '12',
    langs: 'pt,en',
  })
  const res = await fetch(`${SEARCH}?${params}`, { signal })
  if (!res.ok) throw new Error(`Busca do Open Food Facts respondeu ${res.status}`)
  const json = (await res.json()) as { hits?: OffProduct[] }
  return (json.hits ?? []).map(normalizeProduct)
}

/**
 * Procura alternativas reais: produtos da mesma categoria (da mais específica
 * para a mais geral) com Nutri-Score melhor que o produto lido.
 * Prioriza produtos vendidos no Brasil.
 */
export async function findAlternatives(product: OffProduct, limit = 3, signal?: AbortSignal): Promise<OffProduct[]> {
  const rank = (g: string | null) => (g ? 'abcde'.indexOf(g) : 99)
  const current = gradeOf(product)
  if (current === 'a') return [] // já é nota A
  // sem nota: qualquer produto com nota A ou B é uma opção com perfil conhecido e bom
  const better = current ? 'abcde'.slice(0, rank(current)).split('') : ['a', 'b']
  // só categorias específicas: a primeira da hierarquia (ex.: "laticínios",
  // "bebidas") é ampla demais e traria produtos que não substituem o lido
  const hierarchy = product.categories_hierarchy ?? product.categories_tags ?? []
  const categories = (hierarchy.length > 1 ? hierarchy.slice(1) : hierarchy)
    .slice()
    .reverse()
    .filter(
      (c) =>
        !/^en:(foods|beverages|beverages-and-beverages-preparations|plant-based-foods-and-beverages|plant-based-foods|dairies|snacks|sweet-snacks|salty-snacks|groceries|meals|condiments|frozen-foods)$/.test(c),
    )
  if (categories.length === 0) return []

  const seen = new Set<string>([product.code])
  const picked: OffProduct[] = []
  let failures = 0
  // tenta as 3 categorias mais específicas, primeiro no Brasil e depois no mundo
  for (const country of ['brazil', null] as const) {
    for (const cat of categories.slice(0, 2)) {
      if (picked.length >= limit) break
      let list: OffProduct[]
      try {
        list = await searchCategory(cat, better, country, signal)
      } catch (e) {
        if ((e as Error).name === 'AbortError') throw e
        failures++
        continue
      }
      const candidates = list
        .filter((p) => p.code && !seen.has(p.code) && (p.product_name_pt || p.product_name))
        .sort((a, b) => rank(gradeOf(a)) - rank(gradeOf(b)))
      for (const p of candidates) {
        if (picked.length >= limit) break
        seen.add(p.code)
        picked.push(p)
      }
    }
    if (picked.length >= limit) break
  }
  if (picked.length === 0 && failures > 0) throw new Error('Busca de alternativas indisponível')
  // vendidos no Brasil primeiro; depois as melhores notas
  return picked.sort(
    (a, b) => Number(soldInBrazil(b)) - Number(soldInBrazil(a)) || rank(gradeOf(a)) - rank(gradeOf(b)),
  )
}
