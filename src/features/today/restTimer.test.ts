import { describe, expect, it } from 'vitest'
import { restRemaining } from './restTimer'

describe('restRemaining', () => {
  it('returns the full duration right at the start', () => {
    expect(restRemaining(1000, 90, 1000)).toBe(90)
  })

  it('counts down as time passes', () => {
    expect(restRemaining(1000, 90, 1000 + 30_000)).toBe(60)
  })

  it('never goes below zero once the window has elapsed', () => {
    expect(restRemaining(1000, 90, 1000 + 200_000)).toBe(0)
  })

  it('rounds up so it does not skip the final second', () => {
    expect(restRemaining(1000, 90, 1000 + 30_400)).toBe(60)
  })
})
