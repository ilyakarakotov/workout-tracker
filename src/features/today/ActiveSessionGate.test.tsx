import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '../../store/store'
import { ActiveSessionGate } from './ActiveSessionGate'
import { clearWorkoutBadge, notificationPermission, notifyRestDone, setWorkoutBadge } from '../../lib/notify'

vi.mock('../../lib/notify', () => ({
  notifyRestDone: vi.fn().mockResolvedValue(undefined),
  notificationPermission: vi.fn(() => 'unsupported' as const),
  setWorkoutBadge: vi.fn(),
  clearWorkoutBadge: vi.fn(),
  canNotify: vi.fn(() => false),
  requestNotifyPermission: vi.fn(async () => false),
  stageIconSvg: vi.fn(() => '<svg/>'),
  stageIconUrl: vi.fn(() => 'data:image/svg+xml,'),
}))

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    value: hidden ? 'hidden' : 'visible',
    configurable: true,
  })
}

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
    vi.unstubAllGlobals()
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

  it('clears a stale rest timer inherited from a reload without buzzing', () => {
    useStore.getState().startSession('push')
    // Simulate a persisted restStartedAt from well before the reload — far
    // past the 90s default duration, unlike the natural single-tick boundary
    // the live countdown crosses on its own (covered by the next test).
    const staleStart = Date.now() - 95_000
    useStore.setState({ restStartedAt: staleStart })
    const vibrateSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { ...navigator, vibrate: vibrateSpy })

    render(<ActiveSessionGate />)

    expect(useStore.getState().restStartedAt).toBeNull()
    expect(vibrateSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('still buzzes when the countdown naturally reaches zero while mounted', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)
    const vibrateSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { ...navigator, vibrate: vibrateSpy })

    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })
    act(() => {
      vi.advanceTimersByTime(90_000)
    })

    expect(vibrateSpy).toHaveBeenCalledWith([10, 60, 20])
    expect(useStore.getState().restStartedAt).toBeNull()
  })
})

describe('ActiveSessionGate — minimize + floating pill', () => {
  beforeEach(() => {
    reset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders no pill when there is no active session', () => {
    render(<ActiveSessionGate />)
    expect(screen.queryByRole('button', { name: /Return to/ })).not.toBeInTheDocument()
  })

  it('minimizing hides the takeover and shows the floating pill; tapping the pill restores the takeover', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    expect(screen.getByText('Finish workout')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Return to/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Hide workout — it keeps running'))

    expect(screen.queryByText('Finish workout')).not.toBeInTheDocument()
    expect(useStore.getState().sessionMinimized).toBe(true)
    const pill = screen.getByRole('button', { name: /^Return to Push workout, 0:00 elapsed$/ })
    expect(pill).toBeInTheDocument()

    fireEvent.click(pill)

    expect(useStore.getState().sessionMinimized).toBe(false)
    expect(screen.getByText('Finish workout')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Return to/ })).not.toBeInTheDocument()
  })

  it('shows the rest countdown on the pill while a rest timer is running and minimized', () => {
    useStore.getState().startSession('push')
    render(<ActiveSessionGate />)

    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })
    fireEvent.click(screen.getByLabelText('Hide workout — it keeps running'))

    expect(
      screen.getByRole('button', {
        name: /^Return to Push workout, 0:00 elapsed, rest 1:30 remaining$/,
      }),
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(
      screen.getByRole('button', {
        name: /^Return to Push workout, 0:05 elapsed, rest 1:25 remaining$/,
      }),
    ).toBeInTheDocument()
  })
})

describe('ActiveSessionGate — rest-done notification gating', () => {
  beforeEach(() => {
    reset()
    vi.useFakeTimers()
    vi.mocked(notifyRestDone).mockClear()
    vi.mocked(notificationPermission).mockReturnValue('granted')
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    setDocumentHidden(false)
  })

  function completeSetAndRunOutTheClock() {
    fireEvent.change(screen.getByLabelText('Bench Press set 1 reps, not logged'), {
      target: { value: '8' },
    })
    act(() => {
      vi.advanceTimersByTime(90_000)
    })
  }

  it('notifies at the natural rest-zero crossing when hidden + restAlerts enabled + permission granted', () => {
    useStore.getState().updateSettings({ restAlerts: true })
    useStore.getState().startSession('push')
    setDocumentHidden(true)
    render(<ActiveSessionGate />)

    completeSetAndRunOutTheClock()

    expect(notifyRestDone).toHaveBeenCalledTimes(1)
    expect(notifyRestDone).toHaveBeenCalledWith('push', expect.any(String))
  })

  it('does not notify when the app is visible (foreground)', () => {
    useStore.getState().updateSettings({ restAlerts: true })
    useStore.getState().startSession('push')
    setDocumentHidden(false)
    render(<ActiveSessionGate />)

    completeSetAndRunOutTheClock()

    expect(notifyRestDone).not.toHaveBeenCalled()
  })

  it('does not notify when restAlerts is off', () => {
    useStore.getState().updateSettings({ restAlerts: false })
    useStore.getState().startSession('push')
    setDocumentHidden(true)
    render(<ActiveSessionGate />)

    completeSetAndRunOutTheClock()

    expect(notifyRestDone).not.toHaveBeenCalled()
  })

  it('does not notify when notification permission is not granted', () => {
    vi.mocked(notificationPermission).mockReturnValue('default')
    useStore.getState().updateSettings({ restAlerts: true })
    useStore.getState().startSession('push')
    setDocumentHidden(true)
    render(<ActiveSessionGate />)

    completeSetAndRunOutTheClock()

    expect(notifyRestDone).not.toHaveBeenCalled()
  })

  it('does not notify on a stale (reload-inherited) rest timer, even if hidden + enabled + granted', () => {
    useStore.getState().updateSettings({ restAlerts: true })
    useStore.getState().startSession('push')
    useStore.setState({ restStartedAt: Date.now() - 95_000 })
    setDocumentHidden(true)

    render(<ActiveSessionGate />)

    expect(notifyRestDone).not.toHaveBeenCalled()
  })
})

describe('ActiveSessionGate — app badge lifecycle', () => {
  beforeEach(() => {
    reset()
    vi.mocked(setWorkoutBadge).mockClear()
    vi.mocked(clearWorkoutBadge).mockClear()
  })

  afterEach(() => cleanup())

  it('sets the badge once a session becomes active, and clears it when the session ends', () => {
    render(<ActiveSessionGate />)
    expect(setWorkoutBadge).not.toHaveBeenCalled()

    act(() => {
      useStore.getState().startSession('push')
    })
    expect(setWorkoutBadge).toHaveBeenCalled()

    vi.mocked(clearWorkoutBadge).mockClear()
    act(() => {
      useStore.getState().cancelSession()
    })
    expect(clearWorkoutBadge).toHaveBeenCalled()
  })

  it('clears the badge on unmount', () => {
    useStore.getState().startSession('push')
    const { unmount } = render(<ActiveSessionGate />)
    vi.mocked(clearWorkoutBadge).mockClear()

    unmount()
    expect(clearWorkoutBadge).toHaveBeenCalled()
  })
})

describe('ActiveSessionGate — document.title reflects the minimized session', () => {
  beforeEach(() => {
    reset()
    vi.useFakeTimers()
    document.title = 'Workout'
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    document.title = 'Workout'
  })

  it('shows elapsed + day type while minimized, restores "Workout" on restore and on unmount', () => {
    useStore.getState().startSession('push')
    const { unmount } = render(<ActiveSessionGate />)
    expect(document.title).toBe('Workout')

    fireEvent.click(screen.getByLabelText('Hide workout — it keeps running'))
    expect(document.title).toBe('0:00 · Push — Workout')

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(document.title).toBe('0:05 · Push — Workout')

    fireEvent.click(screen.getByRole('button', { name: /^Return to/ }))
    expect(document.title).toBe('Workout')

    fireEvent.click(screen.getByLabelText('Hide workout — it keeps running'))
    expect(document.title).toBe('0:05 · Push — Workout')

    unmount()
    expect(document.title).toBe('Workout')
  })
})
