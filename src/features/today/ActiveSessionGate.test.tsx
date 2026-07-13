import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../store/store'
import { ActiveSessionGate } from './ActiveSessionGate'

function reset() {
  useStore.getState().cancelSession()
  useStore.getState().resetAll()
}

describe('ActiveSessionGate — rest timer wiring', () => {
  beforeEach(() => {
    reset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts the rest timer exactly once on the false→true reps transition, not on later keystrokes that keep the set done', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    const repsField = screen.getByLabelText('Bench Press set 1 reps, not logged')
    fireEvent.change(repsField, { target: { value: '8' } })

    // set is now logged, and the rest pill (role="status") appeared with the full duration
    expect(screen.getByLabelText('Bench Press set 1 reps, logged')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1:30')

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('status')).toHaveTextContent('1:25')

    // second keystroke that edits reps while the set is *already* done
    // (e.g. "8" -> "18") must not restart the timer
    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, logged'), {
      target: { value: '18' },
    })
    expect(screen.getByRole('status')).toHaveTextContent('1:25')
  })

  it('does not start or affect the rest timer on weight-only edits', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.change(screen.getByLabelText('Bench Press set 1 weight (kg), not logged'), {
      target: { value: '65' },
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(useStore.getState().activeSession!.exercises[0].sets[0].done).toBe(false)

    // now log set 1 (starts the timer), then edit the weight of set 2 — timer must be unaffected
    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByRole('status')).toHaveTextContent('1:27')

    fireEvent.change(screen.getByLabelText('Bench Press set 2 weight (kg), not logged'), {
      target: { value: '65' },
    })
    expect(screen.getByRole('status')).toHaveTextContent('1:27')
  })

  it('logging a second set resets the timer to a fresh full duration', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(screen.getByRole('status')).toHaveTextContent('1:10')

    fireEvent.change(screen.getByLabelText('Bench Press set 2 reps, not logged'), {
      target: { value: '8' },
    })
    // freshly restarted, so back to the full duration rather than continuing the countdown
    expect(screen.getByRole('status')).toHaveTextContent('1:30')
  })

  it('clearing a logged set does not start a timer if none is running', () => {
    useStore.getState().startSession('push')
    useStore.getState().updateSettings({ restSeconds: 0 })
    render(<ActiveSessionGate />)

    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, logged'), {
      target: { value: '' },
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(useStore.getState().activeSession!.exercises[0].sets[0].done).toBe(false)
  })
})
