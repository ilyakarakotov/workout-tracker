import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../../store/store'
import { ActiveSessionGate } from './ActiveSessionGate'

function reset() {
  useStore.getState().cancelSession()
  useStore.getState().resetAll()
}

describe('SessionExerciseCard — set-row a11y and ghost-field behavior', () => {
  beforeEach(reset)
  afterEach(cleanup)

  it('disambiguates identically-numbered sets across different exercises by exercise name', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    // Bench Press and Overhead Press both have a "set 1" — labels must not collide
    expect(screen.getByLabelText('Bench Press set 1 reps, not logged')).toBeInTheDocument()
    expect(screen.getByLabelText('Overhead Press set 1 reps, not logged')).toBeInTheDocument()
  })

  it('reflects logged state in the accessible name (not just the visually-hidden checkmark)', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    const repsField = screen.getByLabelText('Bench Press set 1 reps, not logged')
    fireEvent.change(repsField, { target: { value: '8' } })
    expect(screen.getByLabelText('Bench Press set 1 reps, logged')).toBeInTheDocument()
    // the whole set is "logged" once reps commit, so the weight field's
    // accessible name reflects that too even though weight itself is untouched
    expect(screen.getByLabelText('Bench Press set 1 weight (kg), logged')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, logged'), {
      target: { value: '' },
    })
    expect(screen.getByLabelText('Bench Press set 1 reps, not logged')).toBeInTheDocument()
  })

  it('shows the prefilled ghost value as a placeholder, not a real value, until the field is touched', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    const weightField = screen.getByLabelText(
      'Bench Press set 1 weight (kg), not logged',
    ) as HTMLInputElement
    expect(weightField.value).toBe('')
    expect(weightField.placeholder).toBe('60') // seeded template weight for Bench Press
  })

  it('clearing a touched field restores the ghost placeholder instead of leaving stale text', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    const weightField = screen.getByLabelText(
      'Bench Press set 1 weight (kg), not logged',
    ) as HTMLInputElement
    fireEvent.change(weightField, { target: { value: '999' } })
    expect(weightField.value).toBe('999')

    fireEvent.change(weightField, { target: { value: '' } })
    expect(weightField.value).toBe('')
    expect(weightField.placeholder).toBe('60')
    expect(useStore.getState().activeSession!.exercises[0].sets[0].weight).toBe(60)
  })

  it('renders done sets from pre-migration data (no touched flags) with solid values, not ghosts', () => {
    useStore.getState().startSession('push')
    // simulate a resumed active session persisted before the touched/ghost
    // fields existed: done is true but no helper flags are present
    useStore.setState((st) => ({
      activeSession: {
        ...st.activeSession!,
        exercises: st.activeSession!.exercises.map((ex, i) =>
          i !== 0
            ? ex
            : { ...ex, sets: ex.sets.map((s, j) => (j !== 0 ? s : { weight: 60, reps: 8, done: true })) },
        ),
      },
    }))
    render(<ActiveSessionGate />)

    const weightField = screen.getByLabelText(
      'Bench Press set 1 weight (kg), logged',
    ) as HTMLInputElement
    const repsField = screen.getByLabelText('Bench Press set 1 reps, logged') as HTMLInputElement
    expect(weightField.value).toBe('60')
    expect(repsField.value).toBe('8')
  })

  it('removing an earlier set does not corrupt an already-committed value in a later row (index re-sync)', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    // Bench Press has 4 seeded sets. Log distinct weights on sets 2 and 3 so we
    // can tell them apart after set 1 is removed and everything shifts down.
    fireEvent.change(screen.getByLabelText('Bench Press set 2 weight (kg), not logged'), {
      target: { value: '70' },
    })
    fireEvent.change(screen.getByLabelText('Bench Press set 3 weight (kg), not logged'), {
      target: { value: '80' },
    })

    fireEvent.click(screen.getByLabelText('Remove Bench Press set 1'))

    // old set 2 (weight 70) is now displayed as set 1; old set 3 (weight 80) is now set 2
    const newSet1 = screen.getByLabelText('Bench Press set 1 weight (kg), not logged') as HTMLInputElement
    const newSet2 = screen.getByLabelText('Bench Press set 2 weight (kg), not logged') as HTMLInputElement
    expect(newSet1.value).toBe('70')
    expect(newSet2.value).toBe('80')
  })
})
