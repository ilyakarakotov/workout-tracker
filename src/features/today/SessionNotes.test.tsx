import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../../store/store'
import { ActiveSessionGate } from './ActiveSessionGate'

function reset() {
  useStore.getState().cancelSession()
  useStore.getState().resetAll()
}

describe('ActiveSessionGate — workout and exercise notes', () => {
  beforeEach(reset)
  afterEach(cleanup)

  it('expanding the workout note and typing writes to the store', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    expect(screen.queryByLabelText('Workout note')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Workout note' }))

    const textarea = screen.getByLabelText('Workout note')
    fireEvent.change(textarea, { target: { value: 'Felt strong today' } })

    expect(useStore.getState().activeSession!.note).toBe('Felt strong today')
  })

  it('an existing workout note renders as tappable text instead of the add button, and reopens for editing', () => {
    useStore.getState().startSession('push')
    useStore.getState().setSessionNote('Shoulder felt tight')
    render(<ActiveSessionGate />)

    expect(screen.queryByRole('button', { name: '+ Workout note' })).not.toBeInTheDocument()
    expect(screen.getByText('Shoulder felt tight')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit Workout note' }))
    expect(screen.getByLabelText('Workout note')).toHaveValue('Shoulder felt tight')
  })

  it('expanding a per-exercise note and typing writes to that exercise only', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    const addButtons = screen.getAllByRole('button', { name: '+ note' })
    // Bench Press is the first seeded push exercise
    fireEvent.click(addButtons[0])

    const textarea = screen.getByLabelText('Bench Press note')
    fireEvent.change(textarea, { target: { value: 'Left shoulder tweak, went light' } })

    expect(useStore.getState().activeSession!.exercises[0].note).toBe(
      'Left shoulder tweak, went light',
    )
    expect(useStore.getState().activeSession!.exercises[1].note).toBeUndefined()
  })

  it('the note textarea autofocuses on expand', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.click(screen.getByRole('button', { name: '+ Workout note' }))
    expect(screen.getByLabelText('Workout note')).toHaveFocus()
  })
})
