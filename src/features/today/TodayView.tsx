import { useMemo, useState } from 'react'
import { useStore } from '../../store/store'
import {
  selectExerciseName,
  selectLastSessionOf,
  selectNextDayType,
  selectStreak,
} from '../../store/selectors'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { SettingsSheet } from '../settings/SettingsSheet'
import { DAY_TYPES, DAY_TYPE_LABEL, type DayType } from '../../lib/types'
import { formatClock, formatDate } from '../../lib/dates'
import { sessionVolume } from '../../lib/stats'
import { useTicker } from './useTicker'
import { GearIcon } from './icons'
import { monthHeatCells, weekdayInitials } from './monthHeat'
import './TodayView.css'

export function TodayView() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const sessions = useStore((s) => s.sessions)
  const settings = useStore((s) => s.settings)
  const templates = useStore((s) => s.templates)
  const exercises = useStore((s) => s.exercises)
  const activeSession = useStore((s) => s.activeSession)
  const startSession = useStore((s) => s.startSession)
  const cancelSession = useStore((s) => s.cancelSession)
  const setSessionMinimized = useStore((s) => s.setSessionMinimized)

  const next = selectNextDayType({ sessions })
  const streak = selectStreak({ sessions, settings })
  const lastSession = selectLastSessionOf({ sessions }, next)

  // minute ticker so the heatmap rolls over correctly if the tab stays
  // mounted across a day/month boundary
  const now = useTicker(true, 60_000)
  const heat = useMemo(() => {
    const d = new Date(now)
    return monthHeatCells(d.getFullYear(), d.getMonth(), settings.weekStartsOn, sessions, now)
  }, [now, settings.weekStartsOn, sessions])
  const weekdayLabels = useMemo(() => weekdayInitials(settings.weekStartsOn), [settings.weekStartsOn])
  const heatAriaLabel = `${heat.monthLabel} activity, ${heat.workoutDays} workout day${heat.workoutDays === 1 ? '' : 's'}`
  const heatWeeks = useMemo(() => {
    const weeks: (typeof heat.cells)[] = []
    for (let i = 0; i < heat.cells.length; i += 7) weeks.push(heat.cells.slice(i, i + 7))
    return weeks
  }, [heat.cells])
  const workoutsThisMonth = useMemo(() => {
    const d = new Date(now)
    return sessions.filter((s) => {
      const sd = new Date(s.startedAt)
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth()
    }).length
  }, [now, sessions])

  const preview = useMemo(() => {
    const names = templates[next].exercises
      .slice(0, 5)
      .map((te) => selectExerciseName({ exercises, sessions }, te.exerciseId))
    return names.join(', ')
  }, [templates, next, exercises, sessions])

  const otherTypes = DAY_TYPES.filter((dt) => dt !== next)

  const elapsedNow = useTicker(activeSession != null)
  const elapsedMs = activeSession ? elapsedNow - activeSession.startedAt : 0

  function handleDiscard() {
    if (confirm('Discard this workout? Nothing logged will be saved.')) cancelSession()
  }

  return (
    <div className="view">
      <header className="today-header">
        <h1 className="today-wordmark">WORKOUT</h1>
        <button
          type="button"
          className="today-gear"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <GearIcon />
        </button>
      </header>

      <section className="card today-heat">
        <div className="today-heat-head">
          <p className="title today-heat-month">{heat.monthLabel}</p>
        </div>
        <div className="today-heat-weekdays" aria-hidden="true">
          {weekdayLabels.map((label, i) => (
            <span key={i} className="today-heat-weekday">
              {label}
            </span>
          ))}
        </div>
        <div className="today-heat-grid" role="grid" aria-label={heatAriaLabel}>
          {heatWeeks.map((week, wi) => (
            <div key={week[0]?.key ?? wi} role="row" className="today-heat-row">
              {week.map((cell, ci) => {
                const i = wi * 7 + ci
                return (
                  <div
                    key={cell.key}
                    role="gridcell"
                    className={[
                      'today-heat-cell',
                      cell.inMonth ? '' : 'today-heat-cell-pad',
                      cell.inMonth ? `today-heat-level-${cell.level}` : '',
                      cell.isToday ? 'today-heat-cell-today' : '',
                      cell.isFuture ? 'today-heat-cell-future' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ animationDelay: `${Math.min(i * 6, 260)}ms` }}
                    aria-hidden={cell.inMonth ? undefined : true}
                    aria-label={
                      cell.inMonth
                        ? `${formatDate(cell.date.getTime())}${cell.level > 0 ? ` — ${cell.level === 2 ? '2+ workouts' : '1 workout'}` : ''}`
                        : undefined
                    }
                  >
                    {cell.inMonth && <span className="today-heat-daynum num">{cell.day}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <p className="micro today-heat-footer">
          {workoutsThisMonth} workout{workoutsThisMonth === 1 ? '' : 's'} this month
          {streak > 0 ? ` · ${streak}-week streak` : ''}
        </p>
      </section>

      {activeSession ? (
        <>
          <button
            type="button"
            className="card today-resume"
            onClick={() => setSessionMinimized(false)}
          >
            <DayTypeBadge dayType={activeSession.dayType} />
            <p className="title today-resume-title">Workout in progress</p>
            <p className="display num today-resume-timer">{formatClock(elapsedMs)}</p>
            <span className="today-resume-cta">Resume →</span>
          </button>
          <button type="button" className="today-discard" onClick={handleDiscard}>
            Discard workout
          </button>
        </>
      ) : (
        <>
          <div className={`card today-next today-next-${next}`}>
            <div className="today-next-head">
              <p className="label">Next up</p>
              <DayTypeBadge dayType={next} />
            </div>
            <p className="title today-next-title">{DAY_TYPE_LABEL[next]} day</p>
            {preview && <p className="micro today-preview">{preview}</p>}
            {lastSession && (
              <p className="micro today-last">
                Last time — {formatDate(lastSession.startedAt)} ·{' '}
                {sessionVolume(lastSession).toLocaleString()} {settings.unit} volume
              </p>
            )}
            <button
              type="button"
              className={`btn ${next} today-start`}
              onClick={() => startSession(next)}
            >
              Start {DAY_TYPE_LABEL[next]}
            </button>
          </div>

          <div className="today-quickstart">
            <span className="micro">or start</span>
            {otherTypes.map((dt: DayType) => (
              <button
                key={dt}
                type="button"
                className="btn-ghost today-quick-btn"
                onClick={() => startSession(dt)}
              >
                {DAY_TYPE_LABEL[dt]}
              </button>
            ))}
          </div>
        </>
      )}

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
