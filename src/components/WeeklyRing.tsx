import type { DayType } from '../lib/types'
import './WeeklyRing.css'

const ACCENT: Record<DayType, string> = {
  push: 'var(--push)',
  pull: 'var(--pull)',
  legs: 'var(--legs)',
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const [x1, y1] = polar(cx, cy, r, start)
  const [x2, y2] = polar(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export interface WeeklyRingProps {
  /** day types of this week's sessions, in order logged (length 0–6+) */
  filled: DayType[]
  goal?: number
  /** px size */
  size?: number
  /** center content override; default `n/goal` */
  centerLabel?: string
}

/**
 * The hero consistency ring: `goal` segments, each filled in the day-type
 * color of the corresponding session. All gold when the goal is met.
 */
export function WeeklyRing({ filled, goal = 6, size = 176, centerLabel }: WeeklyRingProps) {
  const done = Math.min(filled.length, goal)
  const perfect = filled.length >= goal
  const gapDeg = 10
  const seg = 360 / goal
  const segments = Array.from({ length: goal }, (_, i) => {
    const start = i * seg + gapDeg / 2
    const end = (i + 1) * seg - gapDeg / 2
    const dt = filled[i]
    const color = perfect ? 'var(--gold)' : dt ? ACCENT[dt] : 'var(--surface-2)'
    return { d: arcPath(60, 60, 52, start, end), color, filledSeg: i < done }
  })

  return (
    <div
      className={`ring${perfect ? ' ring-perfect' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${done} of ${goal} sessions this week${perfect ? ' — perfect week' : ''}`}
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        {segments.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={9}
            strokeLinecap="round"
            className={s.filledSeg ? 'ring-seg ring-seg-filled' : 'ring-seg'}
          />
        ))}
      </svg>
      <div className="ring-center">
        {centerLabel !== undefined ? (
          <span className="ring-label">{centerLabel}</span>
        ) : (
          <>
            <span className="display">
              {done}
              <span className="ring-of">/{goal}</span>
            </span>
            <span className="micro">{perfect ? 'perfect week' : 'this week'}</span>
          </>
        )}
      </div>
    </div>
  )
}
