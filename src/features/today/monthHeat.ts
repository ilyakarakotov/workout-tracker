import { addDays, startOfDay, startOfWeek, ymd } from '../../lib/dates'
import type { Session } from '../../lib/types'

/** 0 = no workout, 1 = one session that day, 2 = two-or-more sessions that day. */
export type HeatLevel = 0 | 1 | 2

export interface HeatCell {
  /** ymd key, e.g. "2026-07-13" */
  key: string
  date: Date
  /** false for the leading/trailing padding cells that keep the grid week-aligned */
  inMonth: boolean
  /** day-of-month number, only meaningful when inMonth */
  day: number
  level: HeatLevel
  isToday: boolean
  isFuture: boolean
}

export interface MonthHeat {
  cells: HeatCell[]
  /** e.g. "July 2026" */
  monthLabel: string
  /** count of distinct in-month days with at least one session */
  workoutDays: number
}

/**
 * Weekday-aligned grid covering `month` (0-11) of `year`. Rows are full weeks
 * (columns start at `weekStartsOn`), so the grid is always a multiple of 7
 * cells and out-of-month days are included only as alignment padding.
 */
export function monthHeatCells(
  year: number,
  month: number,
  weekStartsOn: 0 | 1,
  sessions: Pick<Session, 'startedAt'>[],
  now: number = Date.now(),
): MonthHeat {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const gridStart = startOfWeek(firstOfMonth.getTime(), weekStartsOn)
  const gridEnd = addDays(startOfWeek(lastOfMonth.getTime(), weekStartsOn), 6)

  const countsByDay = new Map<string, number>()
  for (const s of sessions) {
    const k = ymd(new Date(s.startedAt))
    countsByDay.set(k, (countsByDay.get(k) ?? 0) + 1)
  }

  const todayStart = startOfDay(now).getTime()
  const todayKey = ymd(new Date(now))

  const cells: HeatCell[] = []
  let workoutDays = 0
  let cursor = gridStart
  while (cursor.getTime() <= gridEnd.getTime()) {
    const key = ymd(cursor)
    const inMonth = cursor.getMonth() === month
    const count = inMonth ? (countsByDay.get(key) ?? 0) : 0
    const level: HeatLevel = count >= 2 ? 2 : count === 1 ? 1 : 0
    if (inMonth && count > 0) workoutDays += 1
    cells.push({
      key,
      date: cursor,
      inMonth,
      day: cursor.getDate(),
      level,
      isToday: inMonth && key === todayKey,
      isFuture: cursor.getTime() > todayStart,
    })
    cursor = addDays(cursor, 1)
  }

  return {
    cells,
    monthLabel: firstOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    workoutDays,
  }
}

/** Weekday-initial header labels, ordered starting at `weekStartsOn`. */
export function weekdayInitials(weekStartsOn: 0 | 1): string[] {
  const all = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return [...all.slice(weekStartsOn), ...all.slice(0, weekStartsOn)]
}
