import { useState } from 'react'
import { useStore } from '../../store/store'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { ExerciseThumb } from '../../components/ExerciseThumb'
import { NumberStepper } from '../../components/NumberStepper'
import type { DayType, TemplateExercise } from '../../lib/types'
import { DAY_TYPE_LABEL } from '../../lib/types'
import { formatSetSummary, totalSets } from './planHelpers'
import { AddExerciseSheet } from './AddExerciseSheet'

const WEIGHT_STEP = { kg: 2.5, lb: 5 } as const

function ExerciseRow({
  te,
  index,
  dayType,
  name,
  unit,
  isFirst,
  isLast,
}: {
  te: TemplateExercise
  index: number
  dayType: DayType
  name: string
  unit: 'kg' | 'lb'
  isFirst: boolean
  isLast: boolean
}) {
  const exerciseId = te.exerciseId
  const moveTemplateExercise = useStore((s) => s.moveTemplateExercise)
  const removeTemplateExercise = useStore((s) => s.removeTemplateExercise)
  const updateTemplateSet = useStore((s) => s.updateTemplateSet)
  const addTemplateSet = useStore((s) => s.addTemplateSet)
  const removeTemplateSet = useStore((s) => s.removeTemplateSet)

  const first = te.sets[0] ?? { reps: 10, weight: 0 }

  const setSetCount = (next: number) => {
    if (next > te.sets.length) addTemplateSet(dayType, index)
    else if (next < te.sets.length) removeTemplateSet(dayType, index)
  }

  const setReps = (reps: number) => {
    te.sets.forEach((_, i) => updateTemplateSet(dayType, index, i, { reps }))
  }

  const setWeight = (weight: number) => {
    te.sets.forEach((_, i) => updateTemplateSet(dayType, index, i, { weight }))
  }

  const handleRemove = () => {
    if (confirm(`Remove ${name} from ${DAY_TYPE_LABEL[dayType]}?`)) removeTemplateExercise(dayType, index)
  }

  return (
    <li className="plan-exrow card">
      <div className="plan-exrow-head">
        <span className="plan-exrow-main">
          <ExerciseThumb exerciseId={exerciseId} name={name} dayType={dayType} size="sm" />
          <span className="plan-exrow-title">
            <span className="plan-exrow-name">{name}</span>
            <span className="micro">{formatSetSummary(te.sets, unit)}</span>
          </span>
        </span>
        <span className="plan-exrow-actions">
          <button
            type="button"
            className="plan-iconbtn"
            aria-label={`Move ${name} up`}
            disabled={isFirst}
            onClick={() => moveTemplateExercise(dayType, index, -1)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="plan-iconbtn"
            aria-label={`Move ${name} down`}
            disabled={isLast}
            onClick={() => moveTemplateExercise(dayType, index, 1)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="plan-iconbtn plan-iconbtn-danger"
            aria-label={`Remove ${name}`}
            onClick={handleRemove}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </span>
      </div>
      <div className="plan-editrow">
        <span className="label">Sets</span>
        <NumberStepper label={`${name} sets`} value={te.sets.length} step={1} min={1} max={10} onChange={setSetCount} />
      </div>
      <div className="plan-editrow">
        <span className="label">Reps</span>
        <NumberStepper label={`${name} reps`} value={first.reps} step={1} min={1} max={300} onChange={setReps} />
      </div>
      <div className="plan-editrow">
        <span className="label">Weight</span>
        <NumberStepper
          label={`${name} weight`}
          value={first.weight}
          step={WEIGHT_STEP[unit]}
          min={0}
          max={1000}
          suffix={unit}
          onChange={setWeight}
        />
      </div>
    </li>
  )
}

export function TemplateCard({
  dayType,
  expanded,
  onToggle,
}: {
  dayType: DayType
  expanded: boolean
  onToggle: () => void
}) {
  const template = useStore((s) => s.templates[dayType])
  const exercises = useStore((s) => s.exercises)
  const unit = useStore((s) => s.settings.unit)
  const [addOpen, setAddOpen] = useState(false)

  const sets = totalSets(template)

  return (
    <div className="card plan-tplcard">
      <button
        type="button"
        className="plan-tplhead"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="plan-tplhead-main">
          <DayTypeBadge dayType={dayType} />
          <span className="plan-tplhead-meta micro">
            {template.exercises.length} exercise{template.exercises.length === 1 ? '' : 's'} ·{' '}
            {sets} set{sets === 1 ? '' : 's'}
          </span>
        </span>
        <svg
          className={`plan-chevron${expanded ? ' plan-chevron-open' : ''}`}
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!expanded ? (
        template.exercises.length === 0 ? (
          <p className="micro plan-tplempty">No exercises yet — add your first.</p>
        ) : (
          <p className="micro plan-tplpreview">
            {template.exercises
              .map((te) => exercises[te.exerciseId]?.name ?? 'Unknown exercise')
              .join(', ')}
          </p>
        )
      ) : (
        <div className="plan-tplbody">
          {template.exercises.length === 0 ? (
            <p className="micro plan-tplempty">No exercises yet — add your first.</p>
          ) : (
            <ul className="plan-exlist">
              {template.exercises.map((te, i) => (
                <ExerciseRow
                  key={`${te.exerciseId}-${i}`}
                  te={te}
                  index={i}
                  dayType={dayType}
                  name={exercises[te.exerciseId]?.name ?? 'Unknown exercise'}
                  unit={unit}
                  isFirst={i === 0}
                  isLast={i === template.exercises.length - 1}
                />
              ))}
            </ul>
          )}
          <button type="button" className="btn-ghost plan-addbtn" onClick={() => setAddOpen(true)}>
            + Add exercise
          </button>
          <AddExerciseSheet dayType={dayType} open={addOpen} onClose={() => setAddOpen(false)} />
        </div>
      )}
    </div>
  )
}
