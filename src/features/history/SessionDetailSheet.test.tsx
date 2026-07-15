import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../../store/store'
import { SessionDetailSheet } from './SessionDetailSheet'

function reset() {
  useStore.getState().cancelSession()
  useStore.getState().resetAll()
}

/** Finishes a fresh push session (one logged set) and returns its live store record. */
function seedSession() {
  useStore.getState().startSession('push')
  useStore.getState().enterActiveReps(0, 0, 8)
  const id = useStore.getState().finishSession()!
  return () => useStore.getState().sessions.find((s) => s.id === id)!
}

/**
 * SessionDetailSheet takes `session` as a plain prop rather than subscribing
 * to the store itself — in the real app its parent, HistoryView, subscribes
 * to `s.sessions` and re-renders with a fresh session object on every store
 * write, which is what keeps the controlled note textareas in sync while
 * typing. A bare `render(<SessionDetailSheet session={snapshot} .../>)`
 * doesn't reproduce that: the prop is frozen at mount, so keystrokes commit
 * correctly to the store but the textarea visually snaps back to the stale
 * prop value (a real behavior difference worth knowing, not a bug — it's
 * exactly the contract HistoryView satisfies). This wrapper subscribes the
 * same way HistoryView does so these tests exercise the actual usage.
 */
function Live({ id, onClose }: { id: string; onClose: () => void }) {
  const session = useStore((s) => s.sessions.find((x) => x.id === id))
  if (!session) return null
  return <SessionDetailSheet session={session} onClose={onClose} />
}

describe('SessionDetailSheet — notes display and editing', () => {
  beforeEach(reset)
  afterEach(cleanup)

  it('a session with no notes renders no note blocks in read mode', () => {
    const getSession = seedSession()
    const { container } = render(<Live id={getSession().id} onClose={() => {}} />)
    expect(container.querySelector('.hist-note')).toBeNull()
    expect(screen.queryByLabelText('Workout note')).not.toBeInTheDocument()
  })

  it('typing into the workout note on a previously note-less session commits a trimmed note on blur', () => {
    const getSession = seedSession()
    render(<Live id={getSession().id} onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const textarea = screen.getByLabelText('Workout note')
    fireEvent.change(textarea, { target: { value: '  good session  ' } })
    // live on every keystroke, untrimmed, while still focused
    expect(getSession().note).toBe('  good session  ')
    expect(textarea).toHaveValue('  good session  ')

    fireEvent.blur(textarea)
    expect(getSession().note).toBe('good session')
  })

  it('clearing an existing note down to whitespace removes the note key entirely on blur', () => {
    const getSession = seedSession()
    useStore.getState().updateSession(getSession().id, (s) => ({ ...s, note: 'existing note' }))
    render(<Live id={getSession().id} onClose={() => {}} />)

    expect(screen.getByText('existing note')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const textarea = screen.getByLabelText('Workout note')
    fireEvent.change(textarea, { target: { value: '   ' } })
    fireEvent.blur(textarea)

    expect(getSession()).not.toHaveProperty('note')
    // toggling back to read mode shows no blockquote for the now-empty note
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByText('existing note')).not.toBeInTheDocument()
  })

  it('per-exercise notes follow the same add / commit / clear pattern, scoped to that exercise', () => {
    const getSession = seedSession()
    render(<Live id={getSession().id} onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const exTextarea = screen.getByLabelText('Bench Press note')
    fireEvent.change(exTextarea, { target: { value: '  left shoulder tweak  ' } })
    fireEvent.blur(exTextarea)

    expect(getSession().exercises[0].note).toBe('left shoulder tweak')

    fireEvent.change(screen.getByLabelText('Bench Press note'), { target: { value: '' } })
    fireEvent.blur(screen.getByLabelText('Bench Press note'))
    expect(getSession().exercises[0]).not.toHaveProperty('note')
  })

  it('toggling out of edit mode without blurring the textarea still leaves the live (untrimmed) value in the store — open finding, see HANDOFF', () => {
    // Documents current behavior: the top Edit/Done toggle does not itself
    // trigger the blur-commit path (it's a different control than the
    // textarea), so a note closed this way can persist untrimmed indefinitely.
    const getSession = seedSession()
    render(<Live id={getSession().id} onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    const textarea = screen.getByLabelText('Workout note')
    fireEvent.change(textarea, { target: { value: 'trailing space ' } })
    // no blur fired here — simulates leaving edit mode by other means
    expect(getSession().note).toBe('trailing space ')
  })
})
