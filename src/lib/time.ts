const DAY = 24 * 60 * 60 * 1000

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function isToday(iso: string) {
  return startOfDay(new Date(iso)).getTime() === startOfDay(new Date()).getTime()
}

/** chave AAAA-MM-DD no fuso do aparelho */
export function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** chave da semana (segunda-feira), ex.: 2026-11-09 */
export function weekKey(d: Date) {
  const x = startOfDay(d)
  const dow = (x.getDay() + 6) % 7 // segunda = 0
  x.setDate(x.getDate() - dow)
  return dayKey(x)
}

export function startOfWeek(d: Date) {
  const x = startOfDay(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

/** "há 2 min", "há 3 h", "Hoje", "Ontem", "Semana passada", "12/10" */
export function relativeTime(iso: string, style: 'short' | 'day' = 'short'): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY)
  if (style === 'short') {
    if (diff < 60_000) return 'agora'
    if (diff < 3_600_000) return `há ${Math.floor(diff / 60_000)} min`
    if (days === 0) return `há ${Math.floor(diff / 3_600_000)} h`
  }
  if (days === 0) {
    if (style === 'day' && diff < 3 * 3_600_000) {
      if (diff < 3_600_000) return diff < 60_000 ? 'Agora' : `Há ${Math.floor(diff / 60_000)} min`
      const h = Math.floor(diff / 3_600_000)
      return `Há ${h} ${h === 1 ? 'hora' : 'horas'}`
    }
    return style === 'day' ? 'Hoje' : 'hoje'
  }
  if (days === 1) return style === 'day' ? 'Ontem' : 'ontem'
  if (days < 7) return `${style === 'day' ? 'H' : 'h'}á ${days} dias`
  if (days < 14) return style === 'day' ? 'Semana passada' : 'semana passada'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
