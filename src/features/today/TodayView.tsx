import { useStore } from '../../store/store'
import { selectNextDayType, selectStreak, selectWeekSessions } from '../../store/selectors'
import { WeeklyRing } from '../../components/WeeklyRing'
import { StreakFlame } from '../../components/StreakFlame'
import { DAY_TYPE_LABEL } from '../../lib/types'

/**
 * STUB — executor "session" owns this file (see TASK.md in that worktree).
 * Minimal working version so the shell runs end-to-end.
 */
export function TodayView() {
  const sessions = useStore((s) => s.sessions)
  const settings = useStore((s) => s.settings)
  const startSession = useStore((s) => s.startSession)
  const next = selectNextDayType({ sessions })
  const week = selectWeekSessions({ sessions, settings })
  const streak = selectStreak({ sessions, settings })

  return (
    <div className="view">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="title">FORGE</h1>
        <StreakFlame count={streak} />
      </header>
      <div style={{ display: 'grid', placeItems: 'center', padding: 16 }}>
        <WeeklyRing filled={week.map((s) => s.dayType)} goal={settings.weeklyGoal} />
      </div>
      <div className="card">
        <p className="label">Next up</p>
        <p className="title" style={{ margin: '8px 0 16px' }}>
          {DAY_TYPE_LABEL[next]} day
        </p>
        <button type="button" className={`btn ${next}`} onClick={() => startSession(next)}>
          Start {DAY_TYPE_LABEL[next]}
        </button>
      </div>
    </div>
  )
}
