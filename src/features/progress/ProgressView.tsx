import { useMemo } from 'react'
import { useStore } from '../../store/store'
import { selectStreak, selectWeekSessions } from '../../store/selectors'
import { perfectWeekTotal, prMap, weeklyVolumes } from '../../lib/stats'
import { PrCards } from './PrCards'
import { ExerciseTrend } from './ExerciseTrend'
import { WeeklyVolumeCard } from './WeeklyVolumeCard'
import './ProgressView.css'

function StatTile({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="card prog-tile">
      <p className={`display prog-tile-value${gold ? ' prog-tile-value-gold' : ''}`}>{value}</p>
      <p className="label">{label}</p>
    </div>
  )
}

export function ProgressView() {
  const sessions = useStore((s) => s.sessions)
  const settings = useStore((s) => s.settings)
  const exercises = useStore((s) => s.exercises)

  const week = selectWeekSessions({ sessions, settings })
  const streak = selectStreak({ sessions, settings })
  const perfectWeeks = perfectWeekTotal(sessions, settings)

  const prs = useMemo(
    () => [...prMap(sessions).values()].sort((a, b) => b.bestE1rm - a.bestE1rm).slice(0, 6),
    [sessions],
  )
  const weeks = weeklyVolumes(sessions, settings.weekStartsOn, Date.now(), 8)

  return (
    <div className="view">
      <h1 className="title">Progress</h1>

      <div className="prog-tiles">
        <StatTile label="This week" value={`${week.length}/${settings.weeklyGoal}`} gold={week.length >= settings.weeklyGoal} />
        <StatTile label="Streak" value={`${streak} wk`} gold={streak > 0} />
        <StatTile label="Perfect weeks" value={`${perfectWeeks}`} gold={perfectWeeks > 0} />
        <StatTile label="Total sessions" value={`${sessions.length}`} />
      </div>

      <PrCards prs={prs} unit={settings.unit} />

      <ExerciseTrend sessions={sessions} exercises={exercises} unit={settings.unit} />

      <WeeklyVolumeCard weeks={weeks} />
    </div>
  )
}
