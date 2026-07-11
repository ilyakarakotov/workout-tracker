import { useMemo, useState } from 'react'
import { useStore } from '../../store/store'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { monthGrid, monthLabel } from './monthGrid'
import { SessionDetailSheet } from './SessionDetailSheet'
import { formatDate, isSameDay, startOfWeek, ymd } from '../../lib/dates'
import { completedSetCount, prsInSession, sessionVolume, weeklyCounts } from '../../lib/stats'
import { DAY_TYPES, DAY_TYPE_LABEL, type DayType, type Session } from '../../lib/types'
import './history.css'

const DOW_MON = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DOW_SUN = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function shiftMonth(
  a: { year: number; month: number },
  dir: 1 | -1,
): { year: number; month: number } {
  const m = a.month + dir
  if (m < 0) return { year: a.year - 1, month: 11 }
  if (m > 11) return { year: a.year + 1, month: 0 }
  return { year: a.year, month: m }
}

export function HistoryView() {
  const sessions = useStore((s) => s.sessions)
  const settings = useStore((s) => s.settings)
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const cells = useMemo(
    () => monthGrid(anchor.year, anchor.month, settings.weekStartsOn),
    [anchor, settings.weekStartsOn],
  )

  const dotsByDay = useMemo(() => {
    const map = new Map<string, DayType[]>()
    for (const s of sessions) {
      const key = ymd(new Date(s.startedAt))
      const arr = map.get(key) ?? []
      if (!arr.includes(s.dayType)) arr.push(s.dayType)
      map.set(key, arr)
    }
    return map
  }, [sessions])

  const sessionsThisMonth = useMemo(
    () =>
      sessions.filter((s) => {
        const d = new Date(s.startedAt)
        return d.getFullYear() === anchor.year && d.getMonth() === anchor.month
      }).length,
    [sessions, anchor],
  )

  const weekCounts = useMemo(
    () => weeklyCounts(sessions, settings.weekStartsOn),
    [sessions, settings.weekStartsOn],
  )

  const groups = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt)
    const out: { key: string; weekStart: Date; sessions: Session[] }[] = []
    for (const s of sorted) {
      const weekStart = startOfWeek(s.startedAt, settings.weekStartsOn)
      const key = ymd(weekStart)
      const last = out[out.length - 1]
      if (last && last.key === key) last.sessions.push(s)
      else out.push({ key, weekStart, sessions: [s] })
    }
    return out
  }, [sessions, settings.weekStartsOn])

  const dow = settings.weekStartsOn === 1 ? DOW_MON : DOW_SUN
  const today = Date.now()
  const selected = selectedId ? (sessions.find((s) => s.id === selectedId) ?? null) : null

  return (
    <div className="view">
      <h1 className="title">History</h1>

      <div className="card hist-cal-card">
        <div className="hist-cal-head">
          <button
            type="button"
            className="hist-cal-nav"
            aria-label="Previous month"
            onClick={() => setAnchor((a) => shiftMonth(a, -1))}
          >
            ‹
          </button>
          <p className="title hist-cal-title">{monthLabel(anchor.year, anchor.month)}</p>
          <button
            type="button"
            className="hist-cal-nav"
            aria-label="Next month"
            onClick={() => setAnchor((a) => shiftMonth(a, 1))}
          >
            ›
          </button>
        </div>

        <div className="hist-cal-dow" aria-hidden="true">
          {dow.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="hist-cal-grid">
          {cells.map((cell) => {
            const dts = dotsByDay.get(cell.key) ?? []
            const isToday = isSameDay(cell.date.getTime(), today)
            return (
              <div
                key={cell.key}
                className={`hist-cal-cell${cell.inMonth ? '' : ' hist-cal-cell-out'}${isToday ? ' hist-cal-cell-today' : ''}`}
              >
                <span className="hist-cal-daynum num">{cell.date.getDate()}</span>
                <span className="hist-cal-dots">
                  {dts.slice(0, 2).map((dt) => (
                    <span key={dt} className={`hist-cal-dot hist-cal-dot-${dt}`} />
                  ))}
                </span>
              </div>
            )
          })}
        </div>

        <div className="hist-legend">
          {DAY_TYPES.map((dt) => (
            <span key={dt} className="hist-legend-item micro">
              <span className={`hist-cal-dot hist-cal-dot-${dt}`} />
              {DAY_TYPE_LABEL[dt]}
            </span>
          ))}
          <span className="micro hist-legend-count">
            {sessionsThisMonth} session{sessionsThisMonth === 1 ? '' : 's'} this month
          </span>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card">
          <p className="title" style={{ marginBottom: 8 }}>
            No sessions yet
          </p>
          <p className="micro">Your first push day is one tap away.</p>
        </div>
      ) : (
        groups.map((g) => {
          const count = weekCounts.get(g.key) ?? 0
          return (
            <section key={g.key} className="hist-week-group">
              <div className="hist-week-head">
                <p className="label">Week of {formatDate(g.weekStart.getTime())}</p>
                {count >= settings.weeklyGoal ? (
                  <span className="hist-perfect-chip num">
                    {count}/{settings.weeklyGoal}
                  </span>
                ) : null}
              </div>
              <div className="hist-session-list">
                {g.sessions.map((s) => {
                  const hasPr = prsInSession(sessions, s).length > 0
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className="hist-session-row"
                      onClick={() => setSelectedId(s.id)}
                    >
                      <DayTypeBadge dayType={s.dayType} />
                      <span className="hist-session-main">
                        <span className="hist-session-date">{formatDate(s.startedAt)}</span>
                        <span className="micro num">
                          {s.exercises.length} exercise{s.exercises.length === 1 ? '' : 's'} ·{' '}
                          {completedSetCount(s)} sets · {sessionVolume(s).toLocaleString()}{' '}
                          {settings.unit}
                        </span>
                      </span>
                      {hasPr ? (
                        <span className="hist-session-pr" aria-label="Personal record">
                          ★
                        </span>
                      ) : null}
                      <span className="hist-session-chevron" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })
      )}

      {selected ? (
        <SessionDetailSheet session={selected} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  )
}
