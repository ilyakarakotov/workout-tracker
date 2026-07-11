import type { AppState } from './store'
import type { DayType, Session } from '../lib/types'
import { sessionsInWeekOf, perfectWeekStreak } from '../lib/stats'

/** next day type in the P→P→L rotation based on the last logged session */
export function selectNextDayType(st: Pick<AppState, 'sessions'>): DayType {
  const last = st.sessions[st.sessions.length - 1]
  if (!last) return 'push'
  const order: DayType[] = ['push', 'pull', 'legs']
  const i = order.indexOf(last.dayType)
  return order[(i + 1) % order.length]
}

/** sessions in the week containing `now`, oldest first */
export function selectWeekSessions(
  st: Pick<AppState, 'sessions' | 'settings'>,
  now = Date.now(),
): Session[] {
  return sessionsInWeekOf(st.sessions, now, st.settings.weekStartsOn)
}

export function selectStreak(
  st: Pick<AppState, 'sessions' | 'settings'>,
  now = Date.now(),
): number {
  return perfectWeekStreak(st.sessions, st.settings, now)
}

/** most recent completed session of a given day type */
export function selectLastSessionOf(
  st: Pick<AppState, 'sessions'>,
  dayType: DayType,
): Session | undefined {
  for (let i = st.sessions.length - 1; i >= 0; i--)
    if (st.sessions[i].dayType === dayType) return st.sessions[i]
  return undefined
}

/** display name for an exercise id (library name, else session snapshot, else fallback) */
export function selectExerciseName(
  st: Pick<AppState, 'exercises' | 'sessions'>,
  exerciseId: string,
): string {
  const ex = st.exercises[exerciseId]
  if (ex) return ex.name
  for (let i = st.sessions.length - 1; i >= 0; i--) {
    const se = st.sessions[i].exercises.find((e) => e.exerciseId === exerciseId)
    if (se) return se.name
  }
  return 'Unknown exercise'
}
