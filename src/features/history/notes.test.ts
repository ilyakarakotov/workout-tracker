import { describe, expect, it } from 'vitest'
import { sessionHasNotes } from './notes'
import type { Session } from '../../lib/types'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    dayType: 'push',
    startedAt: 0,
    endedAt: 1000,
    exercises: [{ exerciseId: 'e1', name: 'Bench Press', sets: [] }],
    ...overrides,
  }
}

describe('sessionHasNotes', () => {
  it('is false when neither the session nor any exercise has a note', () => {
    expect(sessionHasNotes(makeSession())).toBe(false)
  })

  it('is true when the session has a workout-level note', () => {
    expect(sessionHasNotes(makeSession({ note: 'felt strong' }))).toBe(true)
  })

  it('is true when any exercise has a note', () => {
    const session = makeSession({
      exercises: [
        { exerciseId: 'e1', name: 'Bench Press', sets: [] },
        { exerciseId: 'e2', name: 'Overhead Press', sets: [], note: 'left shoulder tweak' },
      ],
    })
    expect(sessionHasNotes(session)).toBe(true)
  })

  it('is false for a session with no exercises and no note', () => {
    expect(sessionHasNotes(makeSession({ exercises: [] }))).toBe(false)
  })
})
