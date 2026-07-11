import { describe, expect, it } from 'vitest'
import { areaPath, linePath, niceMax, scaleLinear, ticks } from './chart'

describe('scaleLinear', () => {
  it('maps domain endpoints to range endpoints', () => {
    const s = scaleLinear([0, 10], [0, 100])
    expect(s(0)).toBe(0)
    expect(s(10)).toBe(100)
    expect(s(5)).toBe(50)
  })

  it('handles an inverted range (svg y-down)', () => {
    const s = scaleLinear([0, 10], [200, 0])
    expect(s(0)).toBe(200)
    expect(s(10)).toBe(0)
  })

  it('returns the range midpoint for a zero-width domain', () => {
    const s = scaleLinear([5, 5], [0, 100])
    expect(s(5)).toBe(50)
  })
})

describe('linePath', () => {
  it('is empty for no points', () => {
    expect(linePath([])).toBe('')
  })

  it('starts with M and continues with L', () => {
    const d = linePath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 2 },
    ])
    expect(d).toBe('M 0.00 0.00 L 10.00 5.00 L 20.00 2.00')
  })
})

describe('areaPath', () => {
  it('is empty for no points', () => {
    expect(areaPath([], 100)).toBe('')
  })

  it('closes the line down to the baseline', () => {
    const d = areaPath(
      [
        { x: 0, y: 10 },
        { x: 10, y: 0 },
      ],
      100,
    )
    expect(d).toBe('M 0.00 10.00 L 10.00 0.00 L 10.00 100.00 L 0.00 100.00 Z')
  })
})

describe('ticks', () => {
  it('spreads count values evenly across the domain', () => {
    expect(ticks(0, 100, 5)).toEqual([0, 25, 50, 75, 100])
  })

  it('degenerates to a single value when count <= 1 or the domain is empty', () => {
    expect(ticks(0, 100, 1)).toEqual([0])
    expect(ticks(5, 5, 4)).toEqual([5])
  })
})

describe('niceMax', () => {
  it('rounds up to a 1/2/5/10 step of the magnitude', () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(3)).toBe(5)
    expect(niceMax(42)).toBe(50)
    expect(niceMax(120)).toBe(200)
    expect(niceMax(500)).toBe(500)
  })
})
