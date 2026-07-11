import type { DayType, Session } from '../lib/types'
import { addDays, isSameDay, startOfWeek } from '../lib/dates'
import './WeekStrip.css'

const DOW_MON = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DOW_SUN = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function WeekStrip({
  sessions,
  weekStartsOn,
  now = Date.now(),
}: {
  sessions: Session[]
  weekStartsOn: 0 | 1
  now?: number
}) {
  const start = startOfWeek(now, weekStartsOn)
  const labels = weekStartsOn === 1 ? DOW_MON : DOW_SUN
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    const t = date.getTime()
    const dts: DayType[] = sessions
      .filter((s) => isSameDay(s.startedAt, t))
      .map((s) => s.dayType)
    return { label: labels[i], dts, isToday: isSameDay(t, now) }
  })

  return (
    <div className="weekstrip" aria-label="This week's sessions">
      {days.map((d, i) => (
        <div key={i} className={`weekstrip-day${d.isToday ? ' weekstrip-today' : ''}`}>
          <span className="weekstrip-label">{d.label}</span>
          <span className="weekstrip-dots">
            {d.dts.length === 0 ? (
              <span className="weekstrip-dot" />
            ) : (
              d.dts.slice(0, 2).map((dt, j) => (
                <span key={j} className={`weekstrip-dot weekstrip-dot-${dt}`} />
              ))
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
