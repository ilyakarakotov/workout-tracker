/** Local-time date helpers. Weeks are keyed by their start day's YMD. */

export function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfDay(t: number): Date {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Date of the start of the week containing t (local time). */
export function startOfWeek(t: number, weekStartsOn: 0 | 1): Date {
  const d = startOfDay(t)
  const diff = (d.getDay() - weekStartsOn + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

/** Stable key for the week containing t, e.g. "2026-07-06". */
export function weekKey(t: number, weekStartsOn: 0 | 1): string {
  return ymd(startOfWeek(t, weekStartsOn))
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7)
}

export function isSameDay(a: number, b: number): boolean {
  return ymd(new Date(a)) === ymd(new Date(b))
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${`${r}`.padStart(2, '0')}`
}

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

export function formatDate(t: number): string {
  return DATE_FMT.format(new Date(t))
}
