import { useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import { selectWeekSessions } from '../../store/selectors'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { formatClock } from '../../lib/dates'
import { buzz } from '../../lib/haptics'
import { SessionExerciseCard } from './SessionExerciseCard'
import { RestTimerPill } from './RestTimerPill'
import { AddExerciseSheet } from './AddExerciseSheet'
import { ExerciseActionsSheet } from './ExerciseActionsSheet'
import { SummarySheet } from './SummarySheet'
import { NoteField } from './NoteField'
import { WorkoutPill } from './WorkoutPill'
import { useTicker } from './useTicker'
import { isStaleRest, restRemaining, shouldStartRestTimer } from './restTimer'
import { CloseIcon, ChevronDownIcon } from './icons'
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
  const restStartedAt = useStore((s) => s.restStartedAt)
  const sessionMinimized = useStore((s) => s.sessionMinimized)
  const cancelSession = useStore((s) => s.cancelSession)
  const finishSession = useStore((s) => s.finishSession)
  const enterActiveWeight = useStore((s) => s.enterActiveWeight)
  const enterActiveReps = useStore((s) => s.enterActiveReps)
  const addSetToActive = useStore((s) => s.addSetToActive)
  const removeSetFromActive = useStore((s) => s.removeSetFromActive)
  const addExerciseToActive = useStore((s) => s.addExerciseToActive)
  const removeExerciseFromActive = useStore((s) => s.removeExerciseFromActive)
  const replaceExerciseInActive = useStore((s) => s.replaceExerciseInActive)
  const moveExerciseInActive = useStore((s) => s.moveExerciseInActive)
  const setSessionNote = useStore((s) => s.setSessionNote)
  const setExerciseNote = useStore((s) => s.setExerciseNote)
  const startRest = useStore((s) => s.startRest)
  const clearRest = useStore((s) => s.clearRest)
  const setSessionMinimized = useStore((s) => s.setSessionMinimized)

  const [addExOpen, setAddExOpen] = useState(false)
  const [actionsIdx, setActionsIdx] = useState<number | null>(null)
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null)
  const [justFinished, setJustFinished] = useState<string | null>(null)

  const elapsedNow = useTicker(active != null, 1000)
  const restNow = useTicker(restStartedAt != null, 1000)
  const remaining =
    restStartedAt != null ? restRemaining(restStartedAt, settings.restSeconds, restNow) : 0

  // Single effect owns the rest countdown's terminal state so a stale timer
  // (already expired before this render — e.g. rehydrated after a reload)
  // can never fall through to the buzz branch: a reload always re-evaluates
  // isStaleRest first and clears silently before "remaining <= 0" is checked.
  useEffect(() => {
    if (restStartedAt == null) return
    if (isStaleRest(restStartedAt, settings.restSeconds, restNow)) {
      clearRest()
      return
    }
    if (remaining <= 0) {
      buzz([10, 60, 20])
      clearRest()
    }
  }, [restStartedAt, remaining, restNow, settings.restSeconds, clearRest])

  // reset per-session UI state once a session ends (finish or discard)
  useEffect(() => {
    if (!active) {
      setAddExOpen(false)
      setActionsIdx(null)
      setReplaceIdx(null)
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
    if (shouldStartRestTimer(wasDone, reps, settings.restSeconds)) startRest()
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

  function handleMoveUp() {
    if (actionsIdx == null) return
    moveExerciseInActive(actionsIdx, -1)
    setActionsIdx(null)
  }

  function handleMoveDown() {
    if (actionsIdx == null) return
    moveExerciseInActive(actionsIdx, 1)
    setActionsIdx(null)
  }

  function handleOpenReplace() {
    if (actionsIdx == null) return
    setReplaceIdx(actionsIdx)
    setActionsIdx(null)
  }

  function handleRemoveFromActions() {
    if (actionsIdx == null) return
    const idx = actionsIdx
    setActionsIdx(null)
    handleRemoveExercise(idx)
  }

  function handleCloseAddSheet() {
    setAddExOpen(false)
    setReplaceIdx(null)
  }

  function handleAddSheetSelect(id: string) {
    if (replaceIdx == null) {
      addExerciseToActive(id)
      return
    }
    const ex = active?.exercises[replaceIdx]
    if (!ex) {
      setReplaceIdx(null)
      return
    }
    const loggedCount = ex.sets.filter((s) => s.done).length
    if (
      loggedCount > 0 &&
      !confirm(`Replace ${ex.name}? ${loggedCount} logged set${loggedCount === 1 ? '' : 's'} will be discarded.`)
    ) {
      return
    }
    replaceExerciseInActive(replaceIdx, id)
    setReplaceIdx(null)
  }

  const totalDone = active
    ? active.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0)
    : 0
  const activeExerciseIds = new Set(active?.exercises.map((e) => e.exerciseId) ?? [])
  const actionsExercise = actionsIdx != null ? active?.exercises[actionsIdx] : undefined
  const replaceExercise = replaceIdx != null ? active?.exercises[replaceIdx] : undefined
  const restRemainingSec = restStartedAt != null ? remaining : null

  return (
    <>
      {active && !sessionMinimized && (
        <div className="sess-root">
          <div className="sess-header">
            <button
              type="button"
              className="sess-minimize"
              aria-label="Hide workout — it keeps running"
              onClick={() => setSessionMinimized(true)}
            >
              <ChevronDownIcon />
            </button>
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
                  onOpenActions={setActionsIdx}
                  onExerciseNote={setExerciseNote}
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
            <NoteField
              value={active.note}
              onChange={setSessionNote}
              placeholder="How did it go?"
              addLabel="+ Workout note"
              fieldLabel="Workout note"
              className="sess-note"
            />
            <button
              type="button"
              className={`btn ${active.dayType} sess-finish`}
              disabled={totalDone === 0}
              onClick={handleFinish}
            >
              Finish workout
            </button>
          </div>

          {restStartedAt != null && (
            <div className="sess-footer">
              <RestTimerPill remaining={remaining} total={settings.restSeconds} onSkip={clearRest} />
            </div>
          )}

          <AddExerciseSheet
            open={addExOpen || replaceIdx != null}
            onClose={handleCloseAddSheet}
            exercises={exercises}
            activeExerciseIds={activeExerciseIds}
            onAdd={handleAddSheetSelect}
            title={replaceExercise ? `Replace ${replaceExercise.name}` : undefined}
          />

          <ExerciseActionsSheet
            open={actionsIdx != null}
            exerciseName={actionsExercise?.name ?? ''}
            canMoveUp={actionsIdx != null && actionsIdx > 0}
            canMoveDown={actionsIdx != null && active != null && actionsIdx < active.exercises.length - 1}
            onClose={() => setActionsIdx(null)}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onReplace={handleOpenReplace}
            onRemove={handleRemoveFromActions}
          />
        </div>
      )}

      {active && sessionMinimized && (
        <WorkoutPill
          dayType={active.dayType}
          elapsedMs={elapsedNow - active.startedAt}
          restRemainingSec={restRemainingSec}
          onReturn={() => setSessionMinimized(false)}
        />
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
