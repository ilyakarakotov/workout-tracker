import { useMemo, useState } from 'react'
import { useStore } from '../../store/store'
import {
  selectExerciseName,
  selectLastSessionOf,
  selectNextDayType,
  selectStreak,
  selectWeekSessions,
} from '../../store/selectors'
import { WeeklyRing } from '../../components/WeeklyRing'
import { StreakFlame } from '../../components/StreakFlame'
import { WeekStrip } from '../../components/WeekStrip'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { SettingsSheet } from '../settings/SettingsSheet'
import { DAY_TYPES, DAY_TYPE_LABEL, type DayType } from '../../lib/types'
import { formatClock, formatDate } from '../../lib/dates'
import { sessionVolume } from '../../lib/stats'
import { useTicker } from './useTicker'
import { GearIcon } from './icons'
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

  const next = selectNextDayType({ sessions })
  const week = selectWeekSessions({ sessions, settings })
  const streak = selectStreak({ sessions, settings })
  const lastSession = selectLastSessionOf({ sessions }, next)

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
        <h1 className="today-wordmark">FORGE</h1>
        <button
          type="button"
          className="today-gear"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <GearIcon />
        </button>
      </header>

      <div className="today-hero">
        <WeeklyRing filled={week.map((s) => s.dayType)} goal={settings.weeklyGoal} size={180} />
        <StreakFlame count={streak} />
      </div>

      <WeekStrip sessions={sessions} weekStartsOn={settings.weekStartsOn} />

      {activeSession ? (
        <>
          <button
            type="button"
            className="card today-resume"
            onClick={() => {
              /* the active-session overlay is already showing; nothing else to do */
            }}
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
