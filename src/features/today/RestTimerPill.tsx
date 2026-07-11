import { formatClock } from '../../lib/dates'

const R = 15.5
const CIRC = 2 * Math.PI * R

export function RestTimerPill({
  remaining,
  total,
  onSkip,
}: {
  remaining: number
  total: number
  onSkip: () => void
}) {
  const pct = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0
  return (
    <div className="sess-rest" role="status">
      <svg viewBox="0 0 36 36" width="32" height="32" aria-hidden="true" className="sess-rest-ring">
        <circle cx="18" cy="18" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct)}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="sess-rest-text">
        <span className="num sess-rest-time">{formatClock(remaining * 1000)}</span>
        <span className="micro">rest</span>
      </span>
      <button type="button" className="sess-rest-skip" onClick={onSkip}>
        Skip
      </button>
    </div>
  )
}
