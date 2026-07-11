import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'
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

    useStore.getState().toggleSetDone(0, 0)
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
    useStore.getState().updateActiveSet(0, 0, { weight: 999, reps: 3 })
    useStore.getState().toggleSetDone(0, 0)
    useStore.getState().finishSession()

    useStore.getState().startSession('push')
    const again = useStore.getState().activeSession!
    expect(again.exercises[0].sets[0].weight).toBe(999)
    expect(again.exercises[0].sets[0].done).toBe(false)
  })

  it('clamps weights and reps', () => {
    useStore.getState().startSession('push')
    useStore.getState().updateActiveSet(0, 0, { weight: -5, reps: 10.7 })
    const s = useStore.getState().activeSession!.exercises[0].sets[0]
    expect(s.weight).toBe(0)
    expect(s.reps).toBe(11)
  })

  it('deleteExercise removes it from library and templates but not history', () => {
    const st = useStore.getState()
    st.startSession('push')
    useStore.getState().toggleSetDone(0, 0)
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

    useStore.getState().resetAll()
    expect(useStore.getState().sessions).toHaveLength(0)

    const res = useStore.getState().importData(json)
    expect(res.ok).toBe(true)
    expect(useStore.getState().sessions).toHaveLength(1)
  })

  it('rejects malformed imports', () => {
    expect(useStore.getState().importData('not json').ok).toBe(false)
    expect(useStore.getState().importData('{"hello":1}').ok).toBe(false)
  })

  it('weeklyGoal stays 6 through settings updates', () => {
    useStore.getState().updateSettings({ weeklyGoal: 3, unit: 'lb' } as never)
    expect(useStore.getState().settings.weeklyGoal).toBe(6)
    expect(useStore.getState().settings.unit).toBe('lb')
  })
})
