import type { DayType } from '../../lib/types'
import { DAY_TYPE_LABEL } from '../../lib/types'
import { formatClock } from '../../lib/dates'
import './WorkoutPill.css'

/**
 * Floating "workout still running" indicator shown while the active-session
 * takeover is minimized. Deliberately shows no set data — just enough to
 * orient (day type, elapsed, rest countdown) and a single tap back in.
 */
export function WorkoutPill({
  dayType,
  elapsedMs,
  restRemainingSec,
  onReturn,
}: {
  dayType: DayType
  elapsedMs: number
  restRemainingSec: number | null
  onReturn: () => void
}) {
  const elapsed = formatClock(elapsedMs)
  const label =
    `Return to ${DAY_TYPE_LABEL[dayType]} workout, ${elapsed} elapsed` +
    (restRemainingSec != null ? `, rest ${formatClock(restRemainingSec * 1000)} remaining` : '')

  return (
    <button type="button" className={`wpill wpill-${dayType}`} onClick={onReturn} aria-label={label}>
      <span className={`wpill-dot wpill-dot-${dayType}`} aria-hidden="true" />
      <span className="num wpill-elapsed">{elapsed}</span>
      {restRemainingSec != null && (
        <span className="num wpill-rest" aria-hidden="true">
          rest {formatClock(restRemainingSec * 1000)}
        </span>
      )}
    </button>
  )
}
