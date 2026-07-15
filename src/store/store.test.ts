import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore, STORAGE_KEY, migrateLegacyStorage } from './store'
import { selectNextDayType } from './selectors'

function reset() {
  useStore.getState().resetAll()
}

describe('store', () => {
  beforeEach(reset)

  it('seeds three templates and a library', () => {
    const st = useStore.getState()
    expect(st.templates.push.exercises.length).toBeGreaterThan(3)
    expect(Object.keys(st.exercises).length).toBeGreaterThan(10)
    expect(st.sessions).toEqual([])
  })

  it('start → log → finish produces a session and rotates the suggestion', () => {
    const st = useStore.getState()
    expect(selectNextDayType(st)).toBe('push')
    st.startSession('push')
    const active = useStore.getState().activeSession!
    expect(active.dayType).toBe('push')
    expect(active.exercises.length).toBeGreaterThan(0)

    useStore.getState().enterActiveReps(0, 0, 8)
    const id = useStore.getState().finishSession()
    expect(id).toBeTruthy()
    const after = useStore.getState()
    expect(after.activeSession).toBeNull()
    expect(after.sessions).toHaveLength(1)
    expect(selectNextDayType(after)).toBe('pull')
  })

  it('prefills a new session from last actuals, not the template', () => {
    const st = useStore.getState()
    st.startSession('push')
    useStore.getState().enterActiveWeight(0, 0, 999)
    useStore.getState().enterActiveReps(0, 0, 3)
    useStore.getState().finishSession()

    useStore.getState().startSession('push')
    const again = useStore.getState().activeSession!
    expect(again.exercises[0].sets[0].weight).toBe(999)
    expect(again.exercises[0].sets[0].done).toBe(false)
  })

  it('clamps weights and reps', () => {
    useStore.getState().startSession('push')
    useStore.getState().enterActiveWeight(0, 0, -5)
    useStore.getState().enterActiveReps(0, 0, 10.7)
    const s = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(s.weight).toBe(0)
    expect(s.reps).toBe(11)
  })

  it('reps-entry logs the set and preserves the ghost weight (previous weight carries over)', () => {
    useStore.getState().startSession('push')
    const before = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(before.done).toBe(false)
    expect(before.weightTouched).toBeFalsy()

    useStore.getState().enterActiveReps(0, 0, 8)
    const after = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(after.done).toBe(true)
    expect(after.repsTouched).toBe(true)
    expect(after.reps).toBe(8)
    // weight was never touched — it should still equal the ghost/prefill value
    expect(after.weight).toBe(before.weight)
    expect(after.weightTouched).toBeFalsy()
  })

  it('weight-only entry never marks the set done', () => {
    useStore.getState().startSession('push')
    useStore.getState().enterActiveWeight(0, 0, 65)
    const s = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(s.weight).toBe(65)
    expect(s.weightTouched).toBe(true)
    expect(s.done).toBe(false)
    expect(s.repsTouched).toBeFalsy()
  })

  it('clearing reps unlogs the set and restores the ghost reps value', () => {
    useStore.getState().startSession('push')
    const ghostReps = useStore.getState().activeSession!.exercises[0].sets[0].ghostReps
    useStore.getState().enterActiveReps(0, 0, 12)
    expect(useStore.getState().activeSession!.exercises[0].sets[0].done).toBe(true)

    useStore.getState().enterActiveReps(0, 0, null)
    const s = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(s.done).toBe(false)
    expect(s.repsTouched).toBeFalsy()
    expect(s.reps).toBe(ghostReps)
  })

  it('clearing weight restores the ghost weight value without touching done/reps', () => {
    useStore.getState().startSession('push')
    const ghostWeight = useStore.getState().activeSession!.exercises[0].sets[0].ghostWeight
    useStore.getState().enterActiveWeight(0, 0, 120)
    useStore.getState().enterActiveReps(0, 0, 8)

    useStore.getState().enterActiveWeight(0, 0, null)
    const s = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(s.weight).toBe(ghostWeight)
    expect(s.weightTouched).toBeFalsy()
    // clearing weight never touches reps/done
    expect(s.done).toBe(true)
    expect(s.reps).toBe(8)
  })

  it('finishSession strips helper fields so persisted history stays clean', () => {
    useStore.getState().startSession('push')
    useStore.getState().enterActiveWeight(0, 0, 100)
    useStore.getState().enterActiveReps(0, 0, 5)
    useStore.getState().finishSession()

    const s = useStore.getState().sessions[0].exercises[0].sets[0]
    expect(s).toEqual({ weight: 100, reps: 5, done: true })
    expect(s).not.toHaveProperty('weightTouched')
    expect(s).not.toHaveProperty('repsTouched')
    expect(s).not.toHaveProperty('ghostWeight')
    expect(s).not.toHaveProperty('ghostReps')
  })

  it('old-shape sets without ghost fields still work (ghost falls back to current value)', () => {
    useStore.getState().startSession('push')
    useStore.setState((st) => {
      if (!st.activeSession) return st
      const exercises = st.activeSession.exercises.map((ex, i) =>
        i !== 0
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j !== 0 ? s : { weight: 42, reps: 6, done: false },
              ),
            },
      )
      return { activeSession: { ...st.activeSession, exercises } }
    })

    useStore.getState().enterActiveReps(0, 0, 9)
    let s = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(s.done).toBe(true)
    expect(s.reps).toBe(9)

    // no ghostReps was ever stored (old-shape data) — clearing falls back to
    // the current value rather than crashing or losing data, per spec
    useStore.getState().enterActiveReps(0, 0, null)
    s = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(s.done).toBe(false)
    expect(s.reps).toBe(9)
  })

  it('removeSetFromActive re-indexes remaining sets without corrupting their data', () => {
    useStore.getState().startSession('push')
    useStore.getState().enterActiveWeight(0, 0, 11)
    useStore.getState().enterActiveWeight(0, 1, 22)
    useStore.getState().enterActiveWeight(0, 2, 33)

    useStore.getState().removeSetFromActive(0, 0) // drop the first set
    const sets = useStore.getState().activeSession!.exercises[0].sets
    // old index 1 (weight 22) is now index 0; old index 2 (weight 33) is now index 1
    expect(sets[0].weight).toBe(22)
    expect(sets[1].weight).toBe(33)
  })

  it('enterActiveWeight/enterActiveReps on an out-of-range index is a safe no-op', () => {
    useStore.getState().startSession('push')
    const before = useStore.getState().activeSession
    useStore.getState().enterActiveWeight(0, 999, 50)
    useStore.getState().enterActiveReps(999, 0, 5)
    const after = useStore.getState().activeSession
    expect(after!.exercises[0].sets).toEqual(before!.exercises[0].sets)
  })

  it('addSetToActive gives the new row ghost fields from the previous row', () => {
    useStore.getState().startSession('push')
    useStore.getState().addSetToActive(0)
    const sets = useStore.getState().activeSession!.exercises[0].sets
    const last = sets[sets.length - 1]
    const prev = sets[sets.length - 2]
    expect(last.ghostWeight).toBe(prev.weight)
    expect(last.ghostReps).toBe(prev.reps)
  })

  it('deleteExercise removes it from library and templates but not history', () => {
    const st = useStore.getState()
    st.startSession('push')
    useStore.getState().enterActiveReps(0, 0, 8)
    useStore.getState().finishSession()

    useStore.getState().deleteExercise('bench-press')
    const after = useStore.getState()
    expect(after.exercises['bench-press']).toBeUndefined()
    expect(
      after.templates.push.exercises.some((te) => te.exerciseId === 'bench-press'),
    ).toBe(false)
    expect(after.sessions[0].exercises[0].name).toBe('Bench Press')
  })

  it('export → reset → import round-trips', () => {
    useStore.getState().startSession('legs')
    useStore.getState().finishSession()
    const json = useStore.getState().exportData()
    expect(JSON.parse(json).app).toBe('workout/v1')

    useStore.getState().resetAll()
    expect(useStore.getState().sessions).toHaveLength(0)

    const res = useStore.getState().importData(json)
    expect(res.ok).toBe(true)
    expect(useStore.getState().sessions).toHaveLength(1)
  })

  it('rejects malformed imports', () => {
    expect(useStore.getState().importData('not json').ok).toBe(false)
    const res = useStore.getState().importData('{"hello":1}')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toBe('Not a valid Workout export file.')
  })

  it('weeklyGoal stays 6 through settings updates', () => {
    useStore.getState().updateSettings({ weeklyGoal: 3, unit: 'lb' } as never)
    expect(useStore.getState().settings.weeklyGoal).toBe(6)
    expect(useStore.getState().settings.unit).toBe('lb')
  })
})

describe('active-session lineup mutations, notes, rest timer, minimize', () => {
  beforeEach(reset)

  it('replaceExerciseInActive replaces in place and prefills from the replaced-in exercise last actuals', () => {
    // give deadlift some history to prefill from
    useStore.getState().startSession('pull')
    useStore.getState().enterActiveWeight(0, 0, 140)
    useStore.getState().enterActiveReps(0, 0, 3)
    useStore.getState().finishSession()

    useStore.getState().startSession('push')
    const before = useStore.getState().activeSession!.exercises
    expect(before[0].exerciseId).toBe('bench-press')
    const originalLength = before.length

    useStore.getState().replaceExerciseInActive(0, 'deadlift')
    const active = useStore.getState().activeSession!
    expect(active.exercises).toHaveLength(originalLength)
    expect(active.exercises[0].exerciseId).toBe('deadlift')
    expect(active.exercises[0].name).toBe('Deadlift')
    expect(active.exercises[0].sets[0].weight).toBe(140)
    expect(active.exercises[0].sets[0].reps).toBe(3)
    expect(active.exercises[0].sets[0].done).toBe(false)
    // other positions untouched
    expect(active.exercises[1].exerciseId).toBe('overhead-press')
  })

  it('replaceExerciseInActive discards the old exercise sets and note', () => {
    useStore.getState().startSession('push')
    useStore.getState().enterActiveReps(0, 0, 8)
    useStore.getState().setExerciseNote(0, 'felt heavy')
    useStore.getState().replaceExerciseInActive(0, 'deadlift')
    const ex = useStore.getState().activeSession!.exercises[0]
    expect(ex.note).toBeUndefined()
    expect(ex.sets.every((s) => !s.done)).toBe(true)
  })

  it('replaceExerciseInActive rejects an unknown exercise id', () => {
    useStore.getState().startSession('push')
    const before = useStore.getState().activeSession!.exercises
    useStore.getState().replaceExerciseInActive(0, 'does-not-exist')
    expect(useStore.getState().activeSession!.exercises).toEqual(before)
  })

  it('replaceExerciseInActive rejects a duplicate id already in the active lineup', () => {
    useStore.getState().startSession('push')
    const before = useStore.getState().activeSession!.exercises
    // overhead-press is already at index 1
    useStore.getState().replaceExerciseInActive(0, 'overhead-press')
    expect(useStore.getState().activeSession!.exercises).toEqual(before)
  })

  it('replaceExerciseInActive rejects an out-of-range index', () => {
    useStore.getState().startSession('push')
    const before = useStore.getState().activeSession!.exercises
    useStore.getState().replaceExerciseInActive(999, 'deadlift')
    expect(useStore.getState().activeSession!.exercises).toEqual(before)
  })

  it('replaceExerciseInActive is a no-op with no active session', () => {
    useStore.getState().replaceExerciseInActive(0, 'deadlift')
    expect(useStore.getState().activeSession).toBeNull()
  })

  it('moveExerciseInActive swaps positions up and down', () => {
    useStore.getState().startSession('push')
    const first = useStore.getState().activeSession!.exercises[0].exerciseId
    const second = useStore.getState().activeSession!.exercises[1].exerciseId

    useStore.getState().moveExerciseInActive(0, 1)
    let ex = useStore.getState().activeSession!.exercises
    expect(ex[0].exerciseId).toBe(second)
    expect(ex[1].exerciseId).toBe(first)

    useStore.getState().moveExerciseInActive(1, -1)
    ex = useStore.getState().activeSession!.exercises
    expect(ex[0].exerciseId).toBe(first)
    expect(ex[1].exerciseId).toBe(second)
  })

  it('moveExerciseInActive clamps at the boundaries (no-op)', () => {
    useStore.getState().startSession('push')
    const before = useStore.getState().activeSession!.exercises
    useStore.getState().moveExerciseInActive(0, -1)
    expect(useStore.getState().activeSession!.exercises).toEqual(before)
    const lastIndex = before.length - 1
    useStore.getState().moveExerciseInActive(lastIndex, 1)
    expect(useStore.getState().activeSession!.exercises).toEqual(before)
  })

  it('template immutability: add/replace/move/remove-exercise/add-set/remove-set on the active session never touch templates', () => {
    const templatesBefore = structuredClone(useStore.getState().templates)
    useStore.getState().startSession('push')
    useStore.getState().addExerciseToActive('deadlift')
    useStore.getState().replaceExerciseInActive(0, 'pull-up')
    useStore.getState().moveExerciseInActive(0, 1)
    useStore.getState().removeExerciseFromActive(2)
    useStore.getState().addSetToActive(0)
    useStore.getState().removeSetFromActive(0, 0)
    expect(useStore.getState().templates).toEqual(templatesBefore)
  })

  it('setSessionNote stores raw text while editing and finishSession trims it into history', () => {
    useStore.getState().startSession('push')
    useStore.getState().setSessionNote('  felt strong today  ')
    expect(useStore.getState().activeSession!.note).toBe('  felt strong today  ')
    useStore.getState().finishSession()
    expect(useStore.getState().sessions[0].note).toBe('felt strong today')
  })

  it('whitespace-only session and exercise notes become absent after finishSession', () => {
    useStore.getState().startSession('push')
    useStore.getState().setSessionNote('   ')
    useStore.getState().setExerciseNote(0, '\t  \n')
    useStore.getState().finishSession()
    const s = useStore.getState().sessions[0]
    expect(s).not.toHaveProperty('note')
    expect(s.exercises[0]).not.toHaveProperty('note')
  })

  it('notes are editable mid-session — the latest value wins', () => {
    useStore.getState().startSession('push')
    useStore.getState().setSessionNote('first draft')
    useStore.getState().setSessionNote('second draft')
    expect(useStore.getState().activeSession!.note).toBe('second draft')

    useStore.getState().setExerciseNote(0, 'note A')
    useStore.getState().setExerciseNote(0, 'note B')
    expect(useStore.getState().activeSession!.exercises[0].note).toBe('note B')
  })

  it('per-exercise note survives set logging and reorder (moves with its exercise)', () => {
    useStore.getState().startSession('push')
    useStore.getState().setExerciseNote(0, 'triset with pause')
    useStore.getState().enterActiveWeight(0, 0, 65)
    useStore.getState().enterActiveReps(0, 0, 6)
    expect(useStore.getState().activeSession!.exercises[0].note).toBe('triset with pause')

    useStore.getState().moveExerciseInActive(0, 1)
    const ex = useStore.getState().activeSession!.exercises
    expect(ex[1].note).toBe('triset with pause')
    expect(ex[1].sets[0].weight).toBe(65)
    expect(ex[0].note).toBeUndefined()
  })

  it('startRest/clearRest set and clear restStartedAt', () => {
    const now = 1_700_000_000_000
    vi.useFakeTimers()
    vi.setSystemTime(now)
    try {
      expect(useStore.getState().restStartedAt).toBeNull()
      useStore.getState().startRest()
      expect(useStore.getState().restStartedAt).toBe(now)
      useStore.getState().clearRest()
      expect(useStore.getState().restStartedAt).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('finishSession, cancelSession, and startSession reset restStartedAt and sessionMinimized', () => {
    useStore.getState().startSession('push')
    useStore.getState().startRest()
    useStore.getState().setSessionMinimized(true)
    useStore.getState().finishSession()
    expect(useStore.getState().restStartedAt).toBeNull()
    expect(useStore.getState().sessionMinimized).toBe(false)

    useStore.getState().startSession('pull')
    useStore.getState().startRest()
    useStore.getState().setSessionMinimized(true)
    useStore.getState().cancelSession()
    expect(useStore.getState().restStartedAt).toBeNull()
    expect(useStore.getState().sessionMinimized).toBe(false)

    // startSession itself also resets them, even if leftover state existed
    useStore.setState({ restStartedAt: 123, sessionMinimized: true })
    useStore.getState().startSession('legs')
    expect(useStore.getState().restStartedAt).toBeNull()
    expect(useStore.getState().sessionMinimized).toBe(false)
  })

  it('importData and resetAll always reset restStartedAt/sessionMinimized to defaults', () => {
    useStore.getState().startSession('legs')
    useStore.getState().finishSession()
    const json = useStore.getState().exportData()
    expect(JSON.parse(json)).not.toHaveProperty('restStartedAt')
    expect(JSON.parse(json)).not.toHaveProperty('sessionMinimized')

    useStore.setState({ restStartedAt: 999, sessionMinimized: true })
    useStore.getState().importData(json)
    expect(useStore.getState().restStartedAt).toBeNull()
    expect(useStore.getState().sessionMinimized).toBe(false)

    useStore.setState({ restStartedAt: 999, sessionMinimized: true })
    useStore.getState().resetAll()
    expect(useStore.getState().restStartedAt).toBeNull()
    expect(useStore.getState().sessionMinimized).toBe(false)
  })

  it('partialize persists restStartedAt and sessionMinimized to localStorage', () => {
    useStore.getState().startRest()
    useStore.getState().setSessionMinimized(true)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(typeof parsed.state.restStartedAt).toBe('number')
    expect(parsed.state.sessionMinimized).toBe(true)
  })

  it('old-shape persisted JSON without restStartedAt/sessionMinimized rehydrates to null/false', async () => {
    localStorage.removeItem(STORAGE_KEY)
    const oldShape = {
      state: {
        exercises: {},
        templates: {
          push: { dayType: 'push', exercises: [] },
          pull: { dayType: 'pull', exercises: [] },
          legs: { dayType: 'legs', exercises: [] },
        },
        sessions: [],
        activeSession: null,
        settings: { unit: 'kg', weekStartsOn: 1, weeklyGoal: 6, restSeconds: 90 },
        // no restStartedAt / sessionMinimized keys at all
      },
      version: 0,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldShape))

    vi.resetModules()
    const fresh = await import('./store')
    expect(fresh.useStore.getState().restStartedAt).toBeNull()
    expect(fresh.useStore.getState().sessionMinimized).toBe(false)
  })
})

describe('storage key migration', () => {
  const LEGACY_KEY = 'forge.v1'

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  })

  it('copies forge.v1 into workout.v1 when the new key is empty', () => {
    localStorage.setItem(LEGACY_KEY, '{"hello":"legacy"}')
    migrateLegacyStorage()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{"hello":"legacy"}')
    // old key is left in place
    expect(localStorage.getItem(LEGACY_KEY)).toBe('{"hello":"legacy"}')
  })

  it('does not overwrite an existing workout.v1', () => {
    localStorage.setItem(STORAGE_KEY, '{"hello":"current"}')
    localStorage.setItem(LEGACY_KEY, '{"hello":"legacy"}')
    migrateLegacyStorage()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{"hello":"current"}')
  })

  it('is a no-op when neither key exists', () => {
    migrateLegacyStorage()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('resuming a pre-migration, old-shape active session from storage', () => {
  const LEGACY_KEY = 'forge.v1'

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  })

  it('rehydrates an in-progress forge.v1 session (old LoggedSet shape, no ghost/touched fields) without crashing, and it can still be logged and finished', async () => {
    // Shape written by the pre-rename, pre-rework app: no weightTouched /
    // repsTouched / ghostWeight / ghostReps on any set, and the old storage
    // key.
    const legacyPersisted = {
      state: {
        exercises: { 'bench-press': { id: 'bench-press', name: 'Bench Press', dayType: 'push' } },
        templates: {
          push: { dayType: 'push', exercises: [{ exerciseId: 'bench-press', sets: [{ reps: 8, weight: 60 }] }] },
          pull: { dayType: 'pull', exercises: [] },
          legs: { dayType: 'legs', exercises: [] },
        },
        sessions: [],
        activeSession: {
          id: 'old-session',
          dayType: 'push',
          startedAt: 1000,
          exercises: [
            {
              exerciseId: 'bench-press',
              name: 'Bench Press',
              // one already-logged set (old shape) and one still-open set
              sets: [
                { weight: 60, reps: 8, done: true },
                { weight: 60, reps: 8, done: false },
              ],
            },
          ],
        },
        settings: { unit: 'kg', weekStartsOn: 1, weeklyGoal: 6, restSeconds: 90 },
      },
      version: 0,
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyPersisted))

    vi.resetModules()
    const fresh = await import('./store')

    // migration + zustand persist hydration both resolve synchronously off
    // localStorage.getItem, so this is already hydrated by the time the
    // module finishes evaluating.
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(legacyPersisted))
    const active = fresh.useStore.getState().activeSession
    expect(active).not.toBeNull()
    expect(active!.exercises[0].sets).toHaveLength(2)
    expect(active!.exercises[0].sets[0].done).toBe(true)

    // interacting with the resumed old-shape sets must not throw, and
    // ghost fallback (ghostReps ?? reps) keeps clearing/re-logging sane
    fresh.useStore.getState().enterActiveReps(0, 1, 10)
    expect(fresh.useStore.getState().activeSession!.exercises[0].sets[1].done).toBe(true)
    fresh.useStore.getState().enterActiveReps(0, 1, null)
    expect(fresh.useStore.getState().activeSession!.exercises[0].sets[1].done).toBe(false)
    expect(fresh.useStore.getState().activeSession!.exercises[0].sets[1].reps).toBe(10) // no ghost recorded -> falls back to current value, not lost

    const id = fresh.useStore.getState().finishSession()
    expect(id).toBe('old-session')
    const finished = fresh.useStore.getState().sessions[0]
    expect(finished.exercises[0].sets[0]).toEqual({ weight: 60, reps: 8, done: true })
  })
})
