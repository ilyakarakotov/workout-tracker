import type { Session } from '../../lib/types'

/** true if a session carries a workout-level note or any exercise carries a note. */
export function sessionHasNotes(session: Session): boolean {
  if (session.note) return true
  return session.exercises.some((ex) => !!ex.note)
}
