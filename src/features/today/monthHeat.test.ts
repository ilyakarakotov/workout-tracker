import { describe, expect, it } from 'vitest'
import { monthHeatCells, weekdayInitials } from './monthHeat'

// no @types/node in this project; declare just enough of the Node global to
// temporarily flip the test-runner's timezone for the DST test below.
declare const process: { env: Record<string, string | undefined> }

function sessionAt(y: number, m: number, d: number, h = 9): { startedAt: number } {
  return { startedAt: new Date(y, m, d, h).getTime() }
}

describe('monthHeatCells', () => {
  it('pads a Wed-starting, Fri-ending month to full Monday-start weeks', () => {
    // July 2026: 1st is a Wednesday, 31st is a Friday.
    const { cells, monthLabel } = monthHeatCells(2026, 6, 1, [])
    expect(cells.length).toBe(35)
    expect(cells.length % 7).toBe(0)
    expect(cells[0].key).toBe('2026-06-29')
    expect(cells[0].inMonth).toBe(false)
    expect(cells[2].key).toBe('2026-07-01')
    expect(cells[2].inMonth).toBe(true)
    const last = cells[cells.length - 1]
    expect(last.key).toBe('2026-08-02')
    expect(last.inMonth).toBe(false)
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31)
    expect(monthLabel).toBe('July 2026')
  })

  it('respects weekStartsOn = 0 (Sunday)', () => {
    const { cells } = monthHeatCells(2026, 6, 0, [])
    // Jul 1 2026 is Wednesday -> week starts Sunday Jun 28.
    expect(cells[0].key).toBe('2026-06-28')
    expect(cells[0].inMonth).toBe(false)
  })

  it('a month starting exactly on the week start has no leading padding', () => {
    // June 2026: 1st is a Monday.
    const { cells } = monthHeatCells(2026, 5, 1, [])
    expect(cells.length % 7).toBe(0)
    expect(cells[0].key).toBe('2026-06-01')
    expect(cells[0].inMonth).toBe(true)
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30)
  })

  it('handles February (28 days) with no padding when it aligns exactly', () => {
    // Feb 2026: 1st and 28th are both Sundays.
    const { cells, monthLabel } = monthHeatCells(2026, 1, 0, [])
    expect(cells.length).toBe(28)
    expect(cells.every((c) => c.inMonth)).toBe(true)
    expect(cells[0].key).toBe('2026-02-01')
    expect(cells[cells.length - 1].key).toBe('2026-02-28')
    expect(monthLabel).toBe('February 2026')
  })

  it('February with weekStartsOn = 1 pads both edges', () => {
    const { cells } = monthHeatCells(2026, 1, 1, [])
    expect(cells.length).toBe(35)
    expect(cells[0].key).toBe('2026-01-26')
    expect(cells[0].inMonth).toBe(false)
    expect(cells[cells.length - 1].key).toBe('2026-03-01')
    expect(cells[cells.length - 1].inMonth).toBe(false)
  })

  it('levels: 0 sessions -> 0, 1 session -> 1, 2+ sessions same day -> 2', () => {
    const sessions = [
      sessionAt(2026, 6, 5), // one session on the 5th
      sessionAt(2026, 6, 6, 8),
      sessionAt(2026, 6, 6, 18), // two sessions on the 6th
    ]
    const { cells, workoutDays } = monthHeatCells(2026, 6, 1, sessions)
    const byKey = new Map(cells.map((c) => [c.key, c]))
    expect(byKey.get('2026-07-05')?.level).toBe(1)
    expect(byKey.get('2026-07-06')?.level).toBe(2)
    expect(byKey.get('2026-07-07')?.level).toBe(0)
    expect(workoutDays).toBe(2)
  })

  it('sessions outside the month do not count toward levels or workoutDays', () => {
    const sessions = [sessionAt(2026, 5, 30), sessionAt(2026, 7, 1)]
    const { workoutDays, cells } = monthHeatCells(2026, 6, 1, sessions)
    expect(workoutDays).toBe(0)
    expect(cells.every((c) => c.level === 0)).toBe(true)
  })

  it('flags today and future days correctly', () => {
    const now = new Date(2026, 6, 13, 10).getTime() // July 13, 2026
    const { cells } = monthHeatCells(2026, 6, 1, [], now)
    const byKey = new Map(cells.map((c) => [c.key, c]))
    expect(byKey.get('2026-07-13')?.isToday).toBe(true)
    expect(byKey.get('2026-07-13')?.isFuture).toBe(false)
    expect(byKey.get('2026-07-12')?.isToday).toBe(false)
    expect(byKey.get('2026-07-12')?.isFuture).toBe(false)
    expect(byKey.get('2026-07-14')?.isToday).toBe(false)
    expect(byKey.get('2026-07-14')?.isFuture).toBe(true)
  })
})

describe('weekdayInitials', () => {
  it('orders labels starting Monday when weekStartsOn = 1', () => {
    expect(weekdayInitials(1)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
  })

  it('orders labels starting Sunday when weekStartsOn = 0', () => {
    expect(weekdayInitials(0)).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S'])
  })
})

describe('monthHeatCells — day-boundary and DST edge cases', () => {
  it('a session at 23:59:59 counts toward that calendar day, not the next', () => {
    const lastMinuteOfMonth = { startedAt: new Date(2026, 6, 31, 23, 59, 59).getTime() }
    const { cells, workoutDays } = monthHeatCells(2026, 6, 1, [lastMinuteOfMonth])
    const byKey = new Map(cells.map((c) => [c.key, c]))
    expect(byKey.get('2026-07-31')?.level).toBe(1)
    expect(workoutDays).toBe(1)
  })

  it('a session at 00:00:00 on the 1st counts toward the new month, not the last day of the previous one', () => {
    const midnightFirst = { startedAt: new Date(2026, 6, 1, 0, 0, 0).getTime() }
    const july = monthHeatCells(2026, 6, 1, [midnightFirst])
    const june = monthHeatCells(2026, 5, 1, [midnightFirst])
    expect(july.workoutDays).toBe(1)
    expect(june.workoutDays).toBe(0)
  })

  it('"today" at 23:59:59 is still flagged isToday, not isFuture', () => {
    const now = new Date(2026, 6, 13, 23, 59, 59).getTime()
    const { cells } = monthHeatCells(2026, 6, 1, [], now)
    const byKey = new Map(cells.map((c) => [c.key, c]))
    expect(byKey.get('2026-07-13')?.isToday).toBe(true)
    expect(byKey.get('2026-07-13')?.isFuture).toBe(false)
    expect(byKey.get('2026-07-14')?.isFuture).toBe(true)
  })

  it('grid stays week-aligned and undistorted across a spring-forward DST transition (US Eastern, Mar 8 2026)', () => {
    const originalTZ = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      // March 2026: 1st is a Sunday, DST starts Sun Mar 8 (clocks skip 2am->3am).
      const sessionBeforeDst = { startedAt: new Date(2026, 2, 8, 1, 30).getTime() }
      const sessionAfterDst = { startedAt: new Date(2026, 2, 9, 1, 30).getTime() }
      const { cells, workoutDays } = monthHeatCells(2026, 2, 0, [
        sessionBeforeDst,
        sessionAfterDst,
      ])
      // full weeks, no duplicated/missing day from the DST jump
      expect(cells.length % 7).toBe(0)
      expect(cells.filter((c) => c.inMonth)).toHaveLength(31)
      const keys = cells.map((c) => c.key)
      expect(new Set(keys).size).toBe(keys.length) // no duplicate day keys
      const byKey = new Map(cells.map((c) => [c.key, c]))
      expect(byKey.get('2026-03-08')?.level).toBe(1)
      expect(byKey.get('2026-03-09')?.level).toBe(1)
      expect(workoutDays).toBe(2)
    } finally {
      process.env.TZ = originalTZ
    }
  })
})
