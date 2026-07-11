import { useStore } from '../../store/store'

/**
 * STUB — executor "session" owns this file. Renders the full-screen active
 * session experience whenever a session is in progress; otherwise null.
 */
export function ActiveSessionGate() {
  const active = useStore((s) => s.activeSession)
  const finishSession = useStore((s) => s.finishSession)
  const cancelSession = useStore((s) => s.cancelSession)

  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        maxWidth: 'var(--max-w)',
        margin: '0 auto',
      }}
    >
      <h1 className="title">Session in progress (stub)</h1>
      <button type="button" className="btn" onClick={finishSession}>
        Finish
      </button>
      <button type="button" className="btn-ghost" onClick={cancelSession}>
        Cancel
      </button>
    </div>
  )
}
