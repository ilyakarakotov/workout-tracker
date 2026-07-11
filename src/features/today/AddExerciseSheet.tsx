import { useMemo } from 'react'
import { Sheet } from '../../components/Sheet'
import { DAY_TYPES, DAY_TYPE_LABEL, type Exercise } from '../../lib/types'

const GROUPS = [...DAY_TYPES, 'other'] as const
type GroupKey = (typeof GROUPS)[number]

export function AddExerciseSheet({
  open,
  onClose,
  exercises,
  activeExerciseIds,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  exercises: Record<string, Exercise>
  activeExerciseIds: Set<string>
  onAdd: (exerciseId: string) => void
}) {
  const grouped = useMemo(() => {
    const by: Record<GroupKey, Exercise[]> = { push: [], pull: [], legs: [], other: [] }
    for (const ex of Object.values(exercises)) {
      if (activeExerciseIds.has(ex.id)) continue
      by[ex.dayType ?? 'other'].push(ex)
    }
    return by
  }, [exercises, activeExerciseIds])

  const isEmpty = GROUPS.every((g) => grouped[g].length === 0)

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      {isEmpty ? (
        <p className="micro">Every library exercise is already in this workout.</p>
      ) : (
        GROUPS.map(
          (g) =>
            grouped[g].length > 0 && (
              <div key={g} className="sess-add-group">
                <p className="label">{g === 'other' ? 'Other' : DAY_TYPE_LABEL[g]}</p>
                <ul className="sess-add-list">
                  {grouped[g].map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        className="sess-add-item"
                        onClick={() => onAdd(ex.id)}
                      >
                        {ex.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ),
        )
      )}
    </Sheet>
  )
}
