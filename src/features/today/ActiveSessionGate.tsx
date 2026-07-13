import { useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import { selectWeekSessions } from '../../store/selectors'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { formatClock } from '../../lib/dates'
import { buzz } from '../../lib/haptics'
import { SessionExerciseCard } from './SessionExerciseCard'
import { RestTimerPill } from './RestTimerPill'
import { AddExerciseSheet } from './AddExerciseSheet'
import { SummarySheet } from './SummarySheet'
import { useTicker } from './useTicker'
import { restRemaining, shouldStartRestTimer } from './restTimer'
import { CloseIcon } from './icons'
import './ActiveSessionGate.css'

/**
 * Full-screen overlay rendered whenever a session is in progress, and while
 * a just-finished session's summary is still on screen (activeSession is
 * already null at that point — justFinished carries the local state).
 */
export function ActiveSessionGate() {
  const active = useStore((s) => s.activeSession)
  const sessions = useStore((s) => s.sessions)
  const settings = useStore((s) => s.settings)
  const exercises = useStore((s) => s.exercises)
  const cancelSession = useStore((s) => s.cancelSession)
  const finishSession = useStore((s) => s.finishSession)
  const enterActiveWeight = useStore((s) => s.enterActiveWeight)
  const enterActiveReps = useStore((s) => s.enterActiveReps)
  const addSetToActive = useStore((s) => s.addSetToActive)
  const removeSetFromActive = useStore((s) => s.removeSetFromActive)
  const addExerciseToActive = useStore((s) => s.addExerciseToActive)
  const removeExerciseFromActive = useStore((s) => s.removeExerciseFromActive)

  const [restStart, setRestStart] = useState<number | null>(null)
  const [addExOpen, setAddExOpen] = useState(false)
  const [justFinished, setJustFinished] = useState<string | null>(null)

  const elapsedNow = useTicker(active != null, 1000)
  const restNow = useTicker(restStart != null, 1000)
  const remaining = restStart != null ? restRemaining(restStart, settings.restSeconds, restNow) : 0

  useEffect(() => {
    if (restStart != null && remaining <= 0) {
      buzz([10, 60, 20])
      setRestStart(null)
    }
  }, [remaining, restStart])

  // reset per-session UI state once a session ends (finish or discard)
  useEffect(() => {
    if (!active) {
      setRestStart(null)
      setAddExOpen(false)
    }
  }, [active])

  if (!active && !justFinished) return null

  const finishedSession = justFinished
    ? sessions.find((s) => s.id === justFinished) ?? null
    : null
  const weekSessions = selectWeekSessions({ sessions, settings })

  function handleCommitWeight(exIdx: number, setIdx: number, weight: number | null) {
    enterActiveWeight(exIdx, setIdx, weight)
  }

  function handleCommitReps(exIdx: number, setIdx: number, reps: number | null) {
    const wasDone = active?.exercises[exIdx]?.sets[setIdx]?.done ?? false
    const newlyDone = !wasDone && reps !== null
    enterActiveReps(exIdx, setIdx, reps)
    if (newlyDone) buzz(10)
    if (shouldStartRestTimer(wasDone, reps, settings.restSeconds)) setRestStart(Date.now())
  }

  function handleRemoveExercise(exIdx: number) {
    if (!active) return
    const ex = active.exercises[exIdx]
    if (confirm(`Remove ${ex.name} from this workout?`)) removeExerciseFromActive(exIdx)
  }

  function handleDiscard() {
    if (confirm('Discard this workout?')) cancelSession()
  }

  function handleFinish() {
    const id = finishSession()
    if (id) setJustFinished(id)
  }

  const totalDone = active
    ? active.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0)
    : 0
  const activeExerciseIds = new Set(active?.exercises.map((e) => e.exerciseId) ?? [])

  return (
    <>
      {active && (
        <div className="sess-root">
          <div className="sess-header">
            <DayTypeBadge dayType={active.dayType} />
            <span className="num sess-timer">{formatClock(elapsedNow - active.startedAt)}</span>
            <button
              type="button"
              className="sess-close"
              aria-label="Discard workout"
              onClick={handleDiscard}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="sess-body">
            {active.exercises.length === 0 ? (
              <p className="micro sess-empty">
                No exercises in this workout yet. Add one to get started.
              </p>
            ) : (
              active.exercises.map((ex, exIdx) => (
                <SessionExerciseCard
                  key={`${ex.exerciseId}-${exIdx}`}
                  ex={ex}
                  exIdx={exIdx}
                  dayType={active.dayType}
                  unit={settings.unit}
                  onCommitWeight={handleCommitWeight}
                  onCommitReps={handleCommitReps}
                  onRemoveSet={removeSetFromActive}
                  onAddSet={addSetToActive}
                  onRemoveExercise={handleRemoveExercise}
                />
              ))
            )}
            <button
              type="button"
              className="btn-ghost sess-add-exercise"
              onClick={() => setAddExOpen(true)}
            >
              + add exercise
            </button>
            <button
              type="button"
              className={`btn ${active.dayType} sess-finish`}
              disabled={totalDone === 0}
              onClick={handleFinish}
            >
              Finish workout
            </button>
          </div>

          {restStart != null && (
            <div className="sess-footer">
              <RestTimerPill
                remaining={remaining}
                total={settings.restSeconds}
                onSkip={() => setRestStart(null)}
              />
            </div>
          )}

          <AddExerciseSheet
            open={addExOpen}
            onClose={() => setAddExOpen(false)}
            exercises={exercises}
            activeExerciseIds={activeExerciseIds}
            onAdd={addExerciseToActive}
          />
        </div>
      )}

      <SummarySheet
        session={finishedSession}
        allSessions={sessions}
        weekSessions={weekSessions}
        weeklyGoal={settings.weeklyGoal}
        unit={settings.unit}
        onDone={() => setJustFinished(null)}
      />
    </>
  )
}
