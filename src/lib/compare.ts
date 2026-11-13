// Comparação entre o produto lido e uma alternativa (valores por 100 g/ml).
import type { OffProduct, Profile } from './types'
import { analyze, fmt, gradeOf, isLiquid, nutrient100 } from './nutrition'

const pctLess = (orig: number | null, alt: number | null) =>
  orig !== null && alt !== null && orig > 0 && alt < orig ? Math.round(((orig - alt) / orig) * 100) : null

export interface Comparison {
  pros: string[]
  sugarOrig: number | null
  sugarAlt: number | null
  impact: string
}

export function compare(orig: OffProduct, alt: OffProduct, profile: Profile | null): Comparison {
  const pros: string[] = []
  const sOrig = nutrient100(orig, 'sugars')
  const sAlt = nutrient100(alt, 'sugars')
  const sugarLess = pctLess(sOrig, sAlt)
  if (sugarLess !== null && sugarLess >= 5) pros.push(`−${sugarLess}% açúcar`)

  const labels = alt.labels_tags ?? []
  const r = new Set(profile?.restrictions ?? [])
  if (labels.includes('en:no-gluten') || labels.includes('en:gluten-free')) pros.push('sem glúten')
  if (labels.includes('en:no-lactose') || labels.includes('en:lactose-free')) pros.push('sem lactose')

  const fOrig = nutrient100(orig, 'fiber')
  const fAlt = nutrient100(alt, 'fiber')
  if (fAlt !== null && fAlt >= 3 && (fOrig === null || fAlt > fOrig + 0.5)) pros.push('+ fibras')

  const aOrig = analyze(orig, profile)
  const aAlt = analyze(alt, profile)
  if (aAlt.additives === 0 && (aOrig.additives ?? 0) > 0) pros.push('0 aditivos')
  const sodiumLess = pctLess(aOrig.sodium100mg, aAlt.sodium100mg)
  if (sodiumLess !== null && sodiumLess >= 15) pros.push(`−${sodiumLess}% sódio`)
  const fatLess = pctLess(aOrig.satFat100, aAlt.satFat100)
  if (fatLess !== null && fatLess >= 15) pros.push(`−${fatLess}% gord. saturada`)
  if (aAlt.nova === 1 && (aOrig.nova ?? 0) > 1) pros.push('in natura')

  // prioriza o que importa para o perfil
  const priority = (p: string) =>
    (r.has('gluten') && p === 'sem glúten') || (r.has('lactose') && p === 'sem lactose')
      ? 0
      : p.includes('açúcar')
        ? r.has('sugar') || profile?.goal === 'reduce_sugar'
          ? 1
          : 2
        : p.includes('sódio')
          ? r.has('sodium') || profile?.goal === 'reduce_sodium'
            ? 1
            : 3
          : 3
  pros.sort((a, b) => priority(a) - priority(b))
  const g = gradeOf(alt)
  if (pros.length === 0 && g) pros.push(`Nutri-Score ${g.toUpperCase()}`)

  const unit = isLiquid(alt) ? 'ml' : 'g'
  let impact: string
  if (sugarLess !== null && sugarLess >= 5) {
    impact = `Menos açúcar ajuda sua meta diária: ${fmt(sAlt ?? 0)} g contra ${fmt(sOrig ?? 0)} g a cada 100 ${unit}.`
  } else if (sodiumLess !== null && sodiumLess >= 15) {
    impact = `Menos sódio: ${fmt(aAlt.sodium100mg ?? 0, 0)} mg contra ${fmt(aOrig.sodium100mg ?? 0, 0)} mg a cada 100 ${unit}.`
  } else if (fatLess !== null && fatLess >= 15) {
    impact = `Menos gordura saturada: ${fmt(aAlt.satFat100 ?? 0)} g contra ${fmt(aOrig.satFat100 ?? 0)} g a cada 100 ${unit}.`
  } else {
    impact = `Nutri-Score ${g?.toUpperCase() ?? '?'} contra ${gradeOf(orig)?.toUpperCase() ?? '?'}: um perfil nutricional melhor no geral.`
  }
  return { pros, sugarOrig: sOrig, sugarAlt: sAlt, impact }
}
