import { describe, expect, it } from 'vitest'
import {
  e1rm,
  sessionVolume,
  prMap,
  prsInSession,
  perfectWeekStreak,
  weeklyVolumes,
  exerciseSeries,
} from './stats'
import { weekKey, startOfWeek, addDays } from './dates'
import type { Session, Settings } from './types'

const SETTINGS: Pick<Settings, 'weekStartsOn' | 'weeklyGoal'> = {
  weekStartsOn: 1,
  weeklyGoal: 6,
}

let seq = 0
function mkSession(at: number, weight = 100, reps = 5, done = true): Session {
  seq += 1
  return {
    id: `s${seq}`,
    dayType: 'push',
    startedAt: at,
    endedAt: at + 3600_000,
    exercises: [
      { exerciseId: 'bench', name: 'Bench Press', sets: [{ weight, reps, done }] },
    ],
  }
}

/** n sessions spread across one week starting at weekStart */
function fillWeek(weekStart: Date, n: number): Session[] {
  return Array.from({ length: n }, (_, i) =>
    mkSession(addDays(weekStart, i % 7).getTime() + 10 * 3600_000),
  )
}

describe('e1rm (Epley)', () => {
  it('returns weight for a single rep', () => {
    expect(e1rm(100, 1)).toBe(100)
  })
  it('estimates above weight for multiple reps', () => {
    expect(e1rm(100, 5)).toBeCloseTo(113.33, 1)
  })
  it('is zero for zero weight or reps', () => {
    expect(e1rm(0, 5)).toBe(0)
    expect(e1rm(100, 0)).toBe(0)
  })
})

describe('sessionVolume', () => {
  it('sums only completed sets', () => {
    const s = mkSession(0)
    s.exercises[0].sets.push({ weight: 50, reps: 10, done: false })
    expect(sessionVolume(s)).toBe(500)
  })
})

describe('prMap / prsInSession', () => {
  it('tracks best e1rm and best weight per exercise', () => {
    const a = mkSession(1000, 100, 5)
    const b = mkSession(2000, 110, 1)
    const map = prMap([a, b])
    const pr = map.get('bench')!
    expect(pr.bestE1rm).toBeCloseTo(e1rm(100, 5), 5)
    expect(pr.bestWeight).toBe(110)
  })
  it('flags a session that beats all earlier sessions', () => {
    const a = mkSession(1000, 100, 5)
    const b = mkSession(2000, 105, 5)
    expect(prsInSession([a, b], b)).toEqual(['bench'])
    expect(prsInSession([a, b], a)).toEqual(['bench']) // first ever is a PR
  })
  it('does not flag a weaker later session', () => {
    const a = mkSession(1000, 100, 5)
    const b = mkSession(2000, 80, 5)
    expect(prsInSession([a, b], b)).toEqual([])
  })
})

describe('perfectWeekStreak', () => {
  const now = Date.now()
  const thisWeek = startOfWeek(now, 1)

  it('is 0 with no sessions', () => {
    expect(perfectWeekStreak([], SETTINGS, now)).toBe(0)
  })

  it('counts consecutive perfect past weeks; in-progress week does not break it', () => {
    const lastWeek = addDays(thisWeek, -7)
    const twoBack = addDays(thisWeek, -14)
    const sessions = [...fillWeek(twoBack, 6), ...fillWeek(lastWeek, 6), ...fillWeek(thisWeek, 2)]
    expect(perfectWeekStreak(sessions, SETTINGS, now)).toBe(2)
  })

  it('extends live when the current week reaches the goal', () => {
    const lastWeek = addDays(thisWeek, -7)
    const sessions = [...fillWeek(lastWeek, 6), ...fillWeek(thisWeek, 6)]
    expect(perfectWeekStreak(sessions, SETTINGS, now)).toBe(3 - 1) // 2: last week + this week
  })

  it('breaks on a missed week', () => {
    const threeBack = addDays(thisWeek, -21)
    const lastWeek = addDays(thisWeek, -7)
    const sessions = [...fillWeek(threeBack, 6), ...fillWeek(lastWeek, 6)]
    expect(perfectWeekStreak(sessions, SETTINGS, now)).toBe(1)
  })
})

describe('weeklyVolumes', () => {
  it('returns n weeks oldest-first including empty weeks', () => {
    const now = Date.now()
    const out = weeklyVolumes([mkSession(now)], 1, now, 4)
    expect(out).toHaveLength(4)
    expect(out[3].weekStart).toBe(weekKey(now, 1))
    expect(out[3].volume).toBe(500)
    expect(out[0].volume).toBe(0)
  })
})

describe('exerciseSeries', () => {
  it('produces per-session points oldest first', () => {
    const a = mkSession(2000, 105, 5)
    const b = mkSession(1000, 100, 5)
    const pts = exerciseSeries([a, b], 'bench')
    expect(pts.map((p) => p.at)).toEqual([1000, 2000])
    expect(pts[1].bestE1rm).toBeCloseTo(e1rm(105, 5), 5)
  })
})
