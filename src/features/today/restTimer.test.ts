import { describe, expect, it } from 'vitest'
import { isStaleRest, restRemaining, shouldStartRestTimer } from './restTimer'

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

describe('shouldStartRestTimer', () => {
  it('starts on the false → true transition (a reps commit on a not-yet-done set)', () => {
    expect(shouldStartRestTimer(false, 12, 90)).toBe(true)
  })

  it('does not restart while the set stays done (subsequent keystrokes)', () => {
    expect(shouldStartRestTimer(true, 12, 90)).toBe(false)
  })

  it('does not start when reps are cleared (unlogging), even from not-done', () => {
    expect(shouldStartRestTimer(false, null, 90)).toBe(false)
  })

  it('does not start when the rest timer is off', () => {
    expect(shouldStartRestTimer(false, 12, 0)).toBe(false)
  })
})

describe('isStaleRest', () => {
  it('is not stale with no timer running', () => {
    expect(isStaleRest(null, 90, 1_000_000)).toBe(false)
  })

  it('is not stale while comfortably within the window', () => {
    expect(isStaleRest(1000, 90, 1000 + 30_000)).toBe(false)
  })

  it('is not stale exactly at the natural zero crossing (one tick past duration)', () => {
    // duration is 90s; a single 1s ticker interval after that boundary is
    // the ordinary live countdown reaching zero, not a stale reload
    expect(isStaleRest(1000, 90, 1000 + 90_000 + 1000)).toBe(false)
  })

  it('is stale once expired by more than one tick — e.g. reloaded well after it ran out', () => {
    expect(isStaleRest(1000, 90, 1000 + 90_000 + 5000)).toBe(true)
  })

  it('is never stale when the rest timer is off', () => {
    expect(isStaleRest(1000, 0, 1000 + 500_000)).toBe(false)
  })
})
