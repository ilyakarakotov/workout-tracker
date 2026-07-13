import { beforeEach, describe, expect, it } from 'vitest'
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
