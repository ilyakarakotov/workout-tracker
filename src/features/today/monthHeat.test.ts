import { describe, expect, it } from 'vitest'
import { monthHeatCells, weekdayInitials } from './monthHeat'

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
