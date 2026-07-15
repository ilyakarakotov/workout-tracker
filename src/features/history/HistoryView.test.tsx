import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../../store/store'
import { HistoryView } from './HistoryView'

function reset() {
  useStore.getState().cancelSession()
  useStore.getState().resetAll()
}

function finishSession(dayType: 'push' | 'pull' | 'legs') {
  useStore.getState().startSession(dayType)
  useStore.getState().enterActiveReps(0, 0, 8)
  return useStore.getState().finishSession()!
}

describe('HistoryView — has-notes glyph', () => {
  beforeEach(reset)
  afterEach(cleanup)

  it('shows the has-notes glyph only on session rows that carry a note', () => {
    const withNoteId = finishSession('push')
    finishSession('pull')
    useStore.getState().updateSession(withNoteId, (s) => ({ ...s, note: 'good session' }))

    render(<HistoryView />)

    const sessionRows = document.querySelectorAll('.hist-session-row')
    expect(sessionRows.length).toBe(2)

    const rowsWithGlyph = Array.from(sessionRows).filter(
      (row) => within(row as HTMLElement).queryByLabelText('has notes') != null,
    )
    expect(rowsWithGlyph).toHaveLength(1)
  })

  it('renders no glyph at all when no sessions have notes', () => {
    finishSession('push')
    render(<HistoryView />)
    expect(screen.queryByLabelText('has notes')).not.toBeInTheDocument()
  })
})
