import { useState } from 'react'
import type { SessionExercise, DayType, Unit, LoggedSet } from '../../lib/types'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { CloseIcon, CheckIcon } from './icons'

/** Formats a stored number the way we want it to appear once a field is "touched". */
function formatNum(n: number): string {
  return String(n)
}

/**
 * Parses raw input text into a commit value:
 * - `null` for an empty field (explicit clear)
 * - `undefined` for text that doesn't parse yet (mid-edit, e.g. "-" or "")
 * - a `number` once it parses, even if not "finished" (e.g. "12." → 12) —
 *   this is deliberate: the caller commits on every parseable keystroke,
 *   while the local text buffer keeps the raw string so a trailing "." or
 *   "," isn't clobbered before the user finishes typing.
 */
function parseFieldInput(raw: string): number | null | undefined {
  if (raw.trim() === '') return null
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '' || normalized === '-' || normalized === '.') return undefined
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

interface SetRowProps {
  exIdx: number
  setIdx: number
  exerciseName: string
  set: LoggedSet
  dayType: DayType
  unit: Unit
  onCommitWeight: (exIdx: number, setIdx: number, weight: number | null) => void
  onCommitReps: (exIdx: number, setIdx: number, reps: number | null) => void
  onRemove: (exIdx: number, setIdx: number) => void
}

/**
 * Keeps a local text buffer per field so intermediate strings like "12." or
 * "" never fight the store's numeric value while the user is mid-edit.
 * Resyncs from the store (the React-recommended "adjust state during
 * render" pattern) only when the underlying committed value actually
 * changes for a reason other than this row's own last edit — e.g. a set
 * above it was removed and this row's index now refers to different data,
 * or the session was resumed from storage.
 */
function useGhostField(touched: boolean | undefined, value: number) {
  const [snapshot, setSnapshot] = useState({ touched: !!touched, value })
  const [text, setText] = useState(() => (touched ? formatNum(value) : ''))

  if (snapshot.touched !== !!touched || (touched && snapshot.value !== value)) {
    setSnapshot({ touched: !!touched, value })
    setText(touched ? formatNum(value) : '')
  }

  return [text, setText] as const
}

function SetRow({
  exIdx,
  setIdx,
  exerciseName,
  set,
  dayType,
  unit,
  onCommitWeight,
  onCommitReps,
  onRemove,
}: SetRowProps) {
  // a done set always shows its real values solid, even when the touched
  // flags are absent (sets logged before the flags existed, or logged via
  // reps-only entry where the weight fell back to the ghost)
  const [weightText, setWeightText] = useGhostField(set.weightTouched ?? set.done, set.weight)
  const [repsText, setRepsText] = useGhostField(set.repsTouched ?? set.done, set.reps)

  const ghostWeight = formatNum(set.ghostWeight ?? set.weight)
  const ghostReps = formatNum(set.ghostReps ?? set.reps)

  function handleWeightChange(raw: string) {
    setWeightText(raw)
    const parsed = parseFieldInput(raw)
    if (parsed === undefined) return
    onCommitWeight(exIdx, setIdx, parsed)
  }

  function handleWeightBlur() {
    setWeightText((set.weightTouched ?? set.done) ? formatNum(set.weight) : '')
  }

  function handleRepsChange(raw: string) {
    setRepsText(raw)
    const parsed = parseFieldInput(raw)
    if (parsed === undefined) return
    onCommitReps(exIdx, setIdx, parsed)
  }

  function handleRepsBlur() {
    setRepsText((set.repsTouched ?? set.done) ? formatNum(set.reps) : '')
  }

  const status = set.done ? ', logged' : ', not logged'

  return (
    <li className={`sess-set sess-set-${dayType}${set.done ? ' sess-set-done' : ''}`}>
      <span className="sess-set-idx num">{setIdx + 1}</span>
      <span className="sess-set-check" aria-hidden="true">
        {set.done && <CheckIcon />}
      </span>
      <input
        type="text"
        inputMode="decimal"
        className="sess-set-input num"
        aria-label={`${exerciseName} set ${setIdx + 1} weight (${unit})${status}`}
        placeholder={ghostWeight}
        value={weightText}
        onChange={(e) => handleWeightChange(e.target.value)}
        onBlur={handleWeightBlur}
      />
      <span className="sess-set-x" aria-hidden="true">
        ×
      </span>
      <input
        type="text"
        inputMode="numeric"
        className="sess-set-input num"
        aria-label={`${exerciseName} set ${setIdx + 1} reps${status}`}
        placeholder={ghostReps}
        value={repsText}
        onChange={(e) => handleRepsChange(e.target.value)}
        onBlur={handleRepsBlur}
      />
      <button
        type="button"
        className="sess-set-remove"
        aria-label={`Remove ${exerciseName} set ${setIdx + 1}`}
        onClick={() => onRemove(exIdx, setIdx)}
      >
        <CloseIcon />
      </button>
    </li>
  )
}

export interface SessionExerciseCardProps {
  ex: SessionExercise
  exIdx: number
  dayType: DayType
  unit: Unit
  onCommitWeight: (exIdx: number, setIdx: number, weight: number | null) => void
  onCommitReps: (exIdx: number, setIdx: number, reps: number | null) => void
  onRemoveSet: (exIdx: number, setIdx: number) => void
  onAddSet: (exIdx: number) => void
  onRemoveExercise: (exIdx: number) => void
}

export function SessionExerciseCard({
  ex,
  exIdx,
  dayType,
  unit,
  onCommitWeight,
  onCommitReps,
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
            exerciseName={ex.name}
            set={set}
            dayType={dayType}
            unit={unit}
            onCommitWeight={onCommitWeight}
            onCommitReps={onCommitReps}
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
