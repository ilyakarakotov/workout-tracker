import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../store/store'
import { ActiveSessionGate } from './ActiveSessionGate'

function reset() {
  useStore.getState().cancelSession()
  useStore.getState().resetAll()
}

describe('ActiveSessionGate — exercise ⋯ actions (move / replace / remove)', () => {
  beforeEach(reset)
  afterEach(cleanup)

  it('disables Move up on the first exercise and Move down on the last, enabling the others', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.click(screen.getByLabelText('Bench Press options'))
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move down' })).not.toBeDisabled()
    fireEvent.click(screen.getByLabelText('Close'))

    // Lateral Raise is the last of the 6 seeded push exercises
    fireEvent.click(screen.getByLabelText('Lateral Raise options'))
    expect(screen.getByRole('button', { name: 'Move up' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move down' })).toBeDisabled()
  })

  it('Move up / Move down call the store and reorder the active lineup only (not the template)', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    const before = useStore.getState().activeSession!.exercises.map((e) => e.name)
    const templateBefore = useStore
      .getState()
      .templates.push.exercises.map((e) => e.exerciseId)

    fireEvent.click(screen.getByLabelText('Bench Press options'))
    fireEvent.click(screen.getByRole('button', { name: 'Move down' }))

    const after = useStore.getState().activeSession!.exercises.map((e) => e.name)
    expect(after[0]).toBe(before[1])
    expect(after[1]).toBe(before[0])
    expect(useStore.getState().templates.push.exercises.map((e) => e.exerciseId)).toEqual(
      templateBefore,
    )

    // move it back up
    fireEvent.click(screen.getByLabelText(`${after[1]} options`))
    fireEvent.click(screen.getByRole('button', { name: 'Move up' }))
    expect(useStore.getState().activeSession!.exercises.map((e) => e.name)).toEqual(before)
  })

  it('Replace opens the add-exercise sheet in replace mode, titled for the outgoing exercise', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.click(screen.getByLabelText('Bench Press options'))
    fireEvent.click(screen.getByRole('button', { name: 'Replace exercise…' }))

    expect(screen.getByRole('dialog', { name: 'Replace Bench Press' })).toBeInTheDocument()
  })

  it('selecting a replacement with no logged sets calls replaceExerciseInActive directly (no confirm)', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)
    const confirmSpy = vi.spyOn(window, 'confirm')

    fireEvent.click(screen.getByLabelText('Bench Press options'))
    fireEvent.click(screen.getByRole('button', { name: 'Replace exercise…' }))
    // every push exercise is already in the workout, so the replacement
    // picker only offers other-day-type exercises, e.g. Squat (legs)
    fireEvent.click(screen.getByText('Squat'))

    expect(confirmSpy).not.toHaveBeenCalled()
    const names = useStore.getState().activeSession!.exercises.map((e) => e.name)
    expect(names[0]).toBe('Squat')
    expect(names).not.toContain('Bench Press')
    // sheet closes after a successful replace
    expect(screen.queryByRole('dialog', { name: 'Replace Bench Press' })).not.toBeInTheDocument()
  })

  it('replacing an exercise with logged sets asks for confirmation and discards them on confirm', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })

    fireEvent.click(screen.getByLabelText('Bench Press options'))
    fireEvent.click(screen.getByRole('button', { name: 'Replace exercise…' }))

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByText('Squat'))

    expect(confirmSpy).toHaveBeenCalledWith(
      'Replace Bench Press? 1 logged set will be discarded.',
    )
    expect(useStore.getState().activeSession!.exercises[0].name).toBe('Squat')
  })

  it('declining the confirmation leaves the exercise and its logged sets untouched', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })

    fireEvent.click(screen.getByLabelText('Bench Press options'))
    fireEvent.click(screen.getByRole('button', { name: 'Replace exercise…' }))

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByText('Squat'))

    expect(useStore.getState().activeSession!.exercises[0].name).toBe('Bench Press')
    expect(useStore.getState().activeSession!.exercises[0].sets[0].done).toBe(true)
    // sheet stays open since the replace was declined
    expect(screen.getByRole('dialog', { name: 'Replace Bench Press' })).toBeInTheDocument()
  })

  it('Remove from workout reuses the existing confirm-gated removal', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByLabelText('Bench Press options'))
    fireEvent.click(screen.getByRole('button', { name: 'Remove from workout' }))

    expect(
      useStore.getState().activeSession!.exercises.some((e) => e.name === 'Bench Press'),
    ).toBe(false)
  })
})
