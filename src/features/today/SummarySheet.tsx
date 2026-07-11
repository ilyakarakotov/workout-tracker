import { useEffect, useMemo } from 'react'
import { Sheet } from '../../components/Sheet'
import { WeeklyRing } from '../../components/WeeklyRing'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import type { Session, Unit } from '../../lib/types'
import { DAY_TYPE_LABEL } from '../../lib/types'
import { formatDuration } from '../../lib/dates'
import { completedSetCount, prsInSession, sessionVolume } from '../../lib/stats'
import { buzz } from '../../lib/haptics'

export function SummarySheet({
  session,
  allSessions,
  weekSessions,
  weeklyGoal,
  unit,
  onDone,
}: {
  session: Session | null
  allSessions: Session[]
  weekSessions: Session[]
  weeklyGoal: number
  unit: Unit
  onDone: () => void
}) {
  const prIds = useMemo(
    () => (session ? prsInSession(allSessions, session) : []),
    [allSessions, session],
  )
  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    session?.exercises.forEach((ex) => m.set(ex.exerciseId, ex.name))
    return m
  }, [session])
  const perfect = weekSessions.length >= weeklyGoal

  useEffect(() => {
    if (session && perfect) buzz([10, 60, 20])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, perfect])

  if (!session) return null

  return (
    <Sheet open onClose={onDone} title="Nice work.">
      <div className="sess-summary">
        <DayTypeBadge dayType={session.dayType} />
        <p className="title sess-summary-title">{DAY_TYPE_LABEL[session.dayType]} day, logged.</p>

        <div className="sess-summary-ring">
          <WeeklyRing filled={weekSessions.map((s) => s.dayType)} goal={weeklyGoal} size={140} />
        </div>
        {perfect && <p className="sess-perfect">6 of 6 — perfect week.</p>}

        <div className="sess-summary-stats">
          <div className="sess-summary-stat">
            <span className="display num">{formatDuration(session.endedAt - session.startedAt)}</span>
            <span className="micro">duration</span>
          </div>
          <div className="sess-summary-stat">
            <span className="display num">{completedSetCount(session)}</span>
            <span className="micro">sets</span>
          </div>
          <div className="sess-summary-stat">
            <span className="display num">{sessionVolume(session).toLocaleString()}</span>
            <span className="micro">{unit} volume</span>
          </div>
        </div>

        {prIds.length > 0 && (
          <ul className="sess-pr-list">
            {prIds.map((id) => (
              <li key={id} className="sess-pr-badge">
                ★ {nameById.get(id) ?? 'Exercise'} — new best e1RM
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="btn sess-summary-done" onClick={onDone}>
          Done
        </button>
      </div>
    </Sheet>
  )
}
