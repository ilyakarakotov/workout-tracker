import { describe, expect, it } from 'vitest'
import { monthGrid } from './monthGrid'

describe('monthGrid', () => {
  it('pads a Wed-starting, Fri-ending month to full Monday-start weeks', () => {
    // July 2026: 1st is a Wednesday, 31st is a Friday.
    const cells = monthGrid(2026, 6, 1)
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
  })

  it('respects weekStartsOn = 0 (Sunday)', () => {
    const cells = monthGrid(2026, 6, 0)
    // Jul 1 2026 is Wednesday -> week starts Sunday Jun 28.
    expect(cells[0].key).toBe('2026-06-28')
    expect(cells[0].inMonth).toBe(false)
  })

  it('every cell is 7-aligned and dates are contiguous', () => {
    const cells = monthGrid(2026, 1, 1) // Feb 2026
    expect(cells.length % 7).toBe(0)
    for (let i = 1; i < cells.length; i++) {
      const prev = cells[i - 1].date
      const cur = cells[i].date
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
      expect(diffDays).toBe(1)
    }
  })
})
