import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { NumberStepper } from '../../components/NumberStepper'
import { useStore } from '../../store/store'
import type { Session } from '../../lib/types'
import { DAY_TYPE_LABEL } from '../../lib/types'
import { formatDate, formatDuration } from '../../lib/dates'

export function SessionDetailSheet({
  session,
  onClose,
}: {
  session: Session
  onClose: () => void
}) {
  const unit = useStore((s) => s.settings.unit)
  const updateSession = useStore((s) => s.updateSession)
  const deleteSession = useStore((s) => s.deleteSession)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const weightStep = unit === 'kg' ? 2.5 : 5

  const setWeight = (exIndex: number, setIndex: number, weight: number) => {
    updateSession(session.id, (s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex
          ? ex
          : { ...ex, sets: ex.sets.map((set, j) => (j !== setIndex ? set : { ...set, weight })) },
      ),
    }))
  }

  const setReps = (exIndex: number, setIndex: number, reps: number) => {
    updateSession(session.id, (s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex
          ? ex
          : { ...ex, sets: ex.sets.map((set, j) => (j !== setIndex ? set : { ...set, reps })) },
      ),
    }))
  }

  const toggleDone = (exIndex: number, setIndex: number) => {
    updateSession(session.id, (s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== exIndex
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((set, j) => (j !== setIndex ? set : { ...set, done: !set.done })),
            },
      ),
    }))
  }

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    deleteSession(session.id)
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${DAY_TYPE_LABEL[session.dayType]} — ${formatDate(session.startedAt)}`}
    >
      <div className="hist-detail-head">
        <DayTypeBadge dayType={session.dayType} />
        <span className="micro num">{formatDuration(session.endedAt - session.startedAt)}</span>
        <button
          type="button"
          className="btn-ghost hist-edit-toggle"
          onClick={() => setEditing((e) => !e)}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {session.exercises.map((ex, exIndex) => (
        <div key={`${ex.exerciseId}-${exIndex}`} className="hist-ex-block">
          <p className="hist-ex-name">{ex.name}</p>
          <ul className="hist-set-list">
            {ex.sets.map((set, setIndex) =>
              editing ? (
                <li key={setIndex} className="hist-set-row hist-set-row-edit">
                  <span className="micro num hist-set-idx">{setIndex + 1}</span>
                  <NumberStepper
                    label={`${ex.name} set ${setIndex + 1} weight`}
                    value={set.weight}
                    step={weightStep}
                    suffix={unit}
                    onChange={(v) => setWeight(exIndex, setIndex, v)}
                  />
                  <NumberStepper
                    label={`${ex.name} set ${setIndex + 1} reps`}
                    value={set.reps}
                    step={1}
                    suffix="reps"
                    onChange={(v) => setReps(exIndex, setIndex, v)}
                  />
                  <button
                    type="button"
                    className={`hist-done-toggle${set.done ? ' hist-done-toggle-on' : ''}`}
                    aria-pressed={set.done}
                    aria-label={`set ${setIndex + 1} ${set.done ? 'completed' : 'not completed'}`}
                    onClick={() => toggleDone(exIndex, setIndex)}
                  >
                    ✓
                  </button>
                </li>
              ) : (
                <li key={setIndex} className="hist-set-row num">
                  {setIndex + 1} · {set.weight} {unit} × {set.reps} {set.done ? '✓' : ''}
                </li>
              ),
            )}
          </ul>
        </div>
      ))}

      <button
        type="button"
        className="btn-danger hist-delete-btn"
        onClick={handleDelete}
        onBlur={() => setConfirmingDelete(false)}
      >
        {confirmingDelete ? 'Tap again to delete' : 'Delete session'}
      </button>
    </Sheet>
  )
}
