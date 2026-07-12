import type { SessionExercise, DayType, Unit, LoggedSet } from '../../lib/types'
import { NumberStepper } from '../../components/NumberStepper'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { CheckIcon, CloseIcon } from './icons'

export interface EditorKey {
  exIdx: number
  setIdx: number
}

function sameKey(a: EditorKey | null, b: EditorKey): boolean {
  return !!a && a.exIdx === b.exIdx && a.setIdx === b.setIdx
}

interface SetRowProps {
  exIdx: number
  setIdx: number
  set: LoggedSet
  dayType: DayType
  unit: Unit
  isOpen: boolean
  onToggleEditor: (key: EditorKey) => void
  onToggleDone: (exIdx: number, setIdx: number, wasDone: boolean) => void
  onUpdate: (exIdx: number, setIdx: number, patch: Partial<LoggedSet>) => void
  onRemove: (exIdx: number, setIdx: number) => void
}

function SetRow({
  exIdx,
  setIdx,
  set,
  dayType,
  unit,
  isOpen,
  onToggleEditor,
  onToggleDone,
  onUpdate,
  onRemove,
}: SetRowProps) {
  const weightStep = unit === 'kg' ? 2.5 : 5
  return (
    <li className={`sess-set sess-set-${dayType}${set.done ? ' sess-set-done' : ''}`}>
      <div className="sess-set-row">
        <span className="sess-set-idx num">{setIdx + 1}</span>
        <button
          type="button"
          className="sess-set-values"
          aria-expanded={isOpen}
          aria-label={`Edit set ${setIdx + 1}, ${set.weight} ${unit} by ${set.reps} reps`}
          onClick={() => onToggleEditor({ exIdx, setIdx })}
        >
          <span className="num sess-set-weight">
            {set.weight}
            <span className="sess-unit">{unit}</span>
          </span>
          <span className="sess-set-x">×</span>
          <span className="num sess-set-reps">{set.reps}</span>
        </button>
        <button
          type="button"
          className={`sess-check${set.done ? ' sess-check-done' : ''}`}
          aria-pressed={set.done}
          aria-label={set.done ? `Set ${setIdx + 1} done, tap to undo` : `Mark set ${setIdx + 1} done`}
          onClick={() => onToggleDone(exIdx, setIdx, set.done)}
        >
          <CheckIcon />
        </button>
      </div>
      {isOpen && (
        <div className="sess-editor">
          <NumberStepper
            label={`set ${setIdx + 1} weight`}
            value={set.weight}
            step={weightStep}
            suffix={unit}
            onChange={(w) => onUpdate(exIdx, setIdx, { weight: w })}
          />
          <NumberStepper
            label={`set ${setIdx + 1} reps`}
            value={set.reps}
            step={1}
            onChange={(r) => onUpdate(exIdx, setIdx, { reps: r })}
          />
          <button
            type="button"
            className="sess-remove-set"
            onClick={() => onRemove(exIdx, setIdx)}
          >
            Remove set
          </button>
        </div>
      )}
    </li>
  )
}

export interface SessionExerciseCardProps {
  ex: SessionExercise
  exIdx: number
  dayType: DayType
  unit: Unit
  openEditor: EditorKey | null
  onToggleEditor: (key: EditorKey) => void
  onToggleDone: (exIdx: number, setIdx: number, wasDone: boolean) => void
  onUpdateSet: (exIdx: number, setIdx: number, patch: Partial<LoggedSet>) => void
  onRemoveSet: (exIdx: number, setIdx: number) => void
  onAddSet: (exIdx: number) => void
  onRemoveExercise: (exIdx: number) => void
}

export function SessionExerciseCard({
  ex,
  exIdx,
  dayType,
  unit,
  openEditor,
  onToggleEditor,
  onToggleDone,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onRemoveExercise,
}: SessionExerciseCardProps) {
  const doneCount = ex.sets.filter((s) => s.done).length
  return (
    <div className="card sess-exercise">
      <div className="sess-exercise-head">
        <div className="sess-exercise-main">
          <ExerciseThumb exerciseId={ex.exerciseId} name={ex.name} dayType={dayType} size="sm" />
          <div>
            <p className="title sess-exercise-name">{ex.name}</p>
            <p className="micro">
              {doneCount} of {ex.sets.length} sets
            </p>
          </div>
        </div>
        <button
          type="button"
          className="sess-ex-remove"
          aria-label={`Remove ${ex.name} from this workout`}
          onClick={() => onRemoveExercise(exIdx)}
        >
          <CloseIcon />
        </button>
      </div>
      <ul className="sess-sets">
        {ex.sets.map((set, setIdx) => (
          <SetRow
            key={setIdx}
            exIdx={exIdx}
            setIdx={setIdx}
            set={set}
            dayType={dayType}
            unit={unit}
            isOpen={sameKey(openEditor, { exIdx, setIdx })}
            onToggleEditor={onToggleEditor}
            onToggleDone={onToggleDone}
            onUpdate={onUpdateSet}
            onRemove={onRemoveSet}
          />
        ))}
      </ul>
      <button type="button" className="btn-ghost sess-add-set" onClick={() => onAddSet(exIdx)}>
        + add set
      </button>
    </div>
  )
}
