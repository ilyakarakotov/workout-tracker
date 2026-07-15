import type { DayType } from '../../lib/types'
import { formatClock } from '../../lib/dates'

/** Numerals shift to the day-type accent for the last stretch of the countdown. */
const FINAL_STRETCH_SEC = 5

/**
 * The prominent floating rest bar — the "hero moment" of resting between
 * sets. Full-width, big tabular numerals, a thin depleting progress track in
 * the session's day-type accent, and a 44px Skip target. Rendered as a
 * sibling of `.sess-body`; `.sess-footer` in ActiveSessionGate.css positions
 * and floats it.
 */
export function RestTimerPill({
  remaining,
  total,
  dayType,
  onSkip,
}: {
  remaining: number
  total: number
  dayType: DayType
  onSkip: () => void
}) {
  const pct = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0
  const final = remaining > 0 && remaining <= FINAL_STRETCH_SEC

  return (
    <div className={`sess-rest sess-rest-${dayType}`} role="status">
      <div className="sess-rest-track" aria-hidden="true">
        <div className="sess-rest-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="sess-rest-row">
        <span className="sess-rest-text">
          <span className="micro sess-rest-label">rest</span>
          <span className={`num sess-rest-time${final ? ' sess-rest-final' : ''}`}>
            {formatClock(remaining * 1000)}
          </span>
        </span>
        <button type="button" className="sess-rest-skip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  )
}
