import { addDays, startOfWeek, ymd } from '../../lib/dates'

export interface MonthCell {
  date: Date
  key: string
  inMonth: boolean
}

/** Full-week-aligned grid of days covering `month` (0-11) of `year`. Always a multiple of 7 cells. */
export function monthGrid(year: number, month: number, weekStartsOn: 0 | 1): MonthCell[] {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const gridStart = startOfWeek(firstOfMonth.getTime(), weekStartsOn)
  const gridEnd = addDays(startOfWeek(lastOfMonth.getTime(), weekStartsOn), 6)

  const cells: MonthCell[] = []
  let cursor = gridStart
  while (cursor.getTime() <= gridEnd.getTime()) {
    cells.push({ date: cursor, key: ymd(cursor), inMonth: cursor.getMonth() === month })
    cursor = addDays(cursor, 1)
  }
  return cells
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
