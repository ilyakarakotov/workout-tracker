import type { Session, Settings } from './types'
import { startOfWeek, weekKey, addWeeks, ymd } from './dates'

/** Epley estimated 1-rep max. reps<=0 or weight<=0 → 0. reps 1 → weight. */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + (reps - 1) / 30)
}

/** total volume (kg·reps) of completed sets in a session */
export function sessionVolume(s: Pick<Session, 'exercises'>): number {
  let v = 0
  for (const ex of s.exercises)
    for (const set of ex.sets) if (set.done) v += set.weight * set.reps
  return v
}

export function completedSetCount(s: Pick<Session, 'exercises'>): number {
  let n = 0
  for (const ex of s.exercises) for (const set of ex.sets) if (set.done) n += 1
  return n
}

export interface ExercisePR {
  exerciseId: string
  name: string
  bestE1rm: number
  bestE1rmAt: number
  bestWeight: number
  bestWeightAt: number
}

/** Best e1RM and best weight per exercise across sessions (completed sets only). */
export function prMap(sessions: Session[]): Map<string, ExercisePR> {
  const map = new Map<string, ExercisePR>()
  for (const s of sessions) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.done || set.weight <= 0) continue
        const est = e1rm(set.weight, set.reps)
        let pr = map.get(ex.exerciseId)
        if (!pr) {
          pr = {
            exerciseId: ex.exerciseId,
            name: ex.name,
            bestE1rm: 0,
            bestE1rmAt: 0,
            bestWeight: 0,
            bestWeightAt: 0,
          }
          map.set(ex.exerciseId, pr)
        }
        pr.name = ex.name
        if (est > pr.bestE1rm) {
          pr.bestE1rm = est
          pr.bestE1rmAt = s.startedAt
        }
        if (set.weight > pr.bestWeight) {
          pr.bestWeight = set.weight
          pr.bestWeightAt = s.startedAt
        }
      }
    }
  }
  return map
}

/** exerciseIds in `session` whose best e1RM beats all *earlier* sessions. */
export function prsInSession(sessions: Session[], session: Session): string[] {
  const earlier = sessions.filter((s) => s.startedAt < session.startedAt && s.id !== session.id)
  const before = prMap(earlier)
  const ids: string[] = []
  for (const ex of session.exercises) {
    let best = 0
    for (const set of ex.sets) if (set.done) best = Math.max(best, e1rm(set.weight, set.reps))
    if (best <= 0) continue
    const prev = before.get(ex.exerciseId)
    if (!prev || best > prev.bestE1rm) ids.push(ex.exerciseId)
  }
  return ids
}

/** sessions grouped per week key */
export function weeklyCounts(sessions: Session[], weekStartsOn: 0 | 1): Map<string, number> {
  const map = new Map<string, number>()
  for (const s of sessions) {
    const k = weekKey(s.startedAt, weekStartsOn)
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  return map
}

export function sessionsInWeekOf(sessions: Session[], t: number, weekStartsOn: 0 | 1): Session[] {
  const k = weekKey(t, weekStartsOn)
  return sessions.filter((s) => weekKey(s.startedAt, weekStartsOn) === k)
}

/**
 * Streak of consecutive "perfect weeks" (>= goal sessions).
 * Counts backwards from the last completed week; the current (in-progress)
 * week extends the streak if it has already reached the goal, but an
 * unfinished current week never breaks it.
 */
export function perfectWeekStreak(
  sessions: Session[],
  settings: Pick<Settings, 'weekStartsOn' | 'weeklyGoal'>,
  now: number,
): number {
  const counts = weeklyCounts(sessions, settings.weekStartsOn)
  const thisWeek = startOfWeek(now, settings.weekStartsOn)
  let streak = 0
  if ((counts.get(ymd(thisWeek)) ?? 0) >= settings.weeklyGoal) streak += 1
  let cursor = addWeeks(thisWeek, -1)
  while ((counts.get(ymd(cursor)) ?? 0) >= settings.weeklyGoal) {
    streak += 1
    cursor = addWeeks(cursor, -1)
  }
  return streak
}

/** total number of weeks that ever hit the goal */
export function perfectWeekTotal(
  sessions: Session[],
  settings: Pick<Settings, 'weekStartsOn' | 'weeklyGoal'>,
): number {
  let n = 0
  for (const c of weeklyCounts(sessions, settings.weekStartsOn).values())
    if (c >= settings.weeklyGoal) n += 1
  return n
}

export interface WeekVolume {
  weekStart: string
  volume: number
}

/** last `n` weeks of total volume, oldest first, including empty weeks */
export function weeklyVolumes(
  sessions: Session[],
  weekStartsOn: 0 | 1,
  now: number,
  n: number,
): WeekVolume[] {
  const byWeek = new Map<string, number>()
  for (const s of sessions) {
    const k = weekKey(s.startedAt, weekStartsOn)
    byWeek.set(k, (byWeek.get(k) ?? 0) + sessionVolume(s))
  }
  const out: WeekVolume[] = []
  const thisWeek = startOfWeek(now, weekStartsOn)
  for (let i = n - 1; i >= 0; i--) {
    const k = ymd(addWeeks(thisWeek, -i))
    out.push({ weekStart: k, volume: byWeek.get(k) ?? 0 })
  }
  return out
}

export interface ExercisePoint {
  sessionId: string
  at: number
  bestE1rm: number
  volume: number
}

/** per-session best e1RM + volume series for one exercise, oldest first */
export function exerciseSeries(sessions: Session[], exerciseId: string): ExercisePoint[] {
  const pts: ExercisePoint[] = []
  for (const s of [...sessions].sort((a, b) => a.startedAt - b.startedAt)) {
    let best = 0
    let vol = 0
    let touched = false
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      for (const set of ex.sets) {
        if (!set.done) continue
        touched = true
        best = Math.max(best, e1rm(set.weight, set.reps))
        vol += set.weight * set.reps
      }
    }
    if (touched) pts.push({ sessionId: s.id, at: s.startedAt, bestE1rm: best, volume: vol })
  }
  return pts
}
