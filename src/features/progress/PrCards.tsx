import type { ExercisePR } from '../../lib/stats'
import type { Exercise, Unit } from '../../lib/types'
import { formatDate } from '../../lib/dates'
import { ExerciseThumb } from '../../components/ExerciseThumb'

export interface PrCardsProps {
  prs: ExercisePR[]
  unit: Unit
  exercises: Record<string, Exercise>
}

/** Horizontal-scroll row of PR cards, top exercises by best e1RM. */
export function PrCards({ prs, unit, exercises }: PrCardsProps) {
  if (prs.length === 0) {
    return (
      <div className="card">
        <p className="label">Personal records</p>
        <p className="micro" style={{ marginTop: 8 }}>
          PRs land here after your first workout.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="label prog-section-label">Personal records</p>
      <div className="prog-pr-row">
        {prs.map((pr) => (
          <div className="card prog-pr-card" key={pr.exerciseId}>
            <div className="prog-pr-head">
              <ExerciseThumb
                exerciseId={pr.exerciseId}
                name={pr.name}
                dayType={exercises[pr.exerciseId]?.dayType}
                size="sm"
              />
              <span className="prog-pr-star" aria-hidden="true">
                ★
              </span>
              <p className="prog-pr-name">{pr.name}</p>
            </div>
            <p className="display prog-pr-value">
              {pr.bestE1rm.toFixed(1)}
              <span className="micro"> {unit}</span>
            </p>
            <p className="micro">e1RM</p>
            <div className="prog-pr-meta">
              <span className="micro">
                best {pr.bestWeight.toFixed(1)} {unit}
              </span>
              <span className="micro">{formatDate(pr.bestE1rmAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
