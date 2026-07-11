import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { DayTypeBadge } from '../../components/DayTypeBadge'
import { useStore } from '../../store/store'
import type { DayType } from '../../lib/types'
import { DAY_TYPE_LABEL } from '../../lib/types'
import { groupExercisesByDayType } from './planHelpers'

export function AddExerciseSheet({
  dayType,
  open,
  onClose,
}: {
  dayType: DayType
  open: boolean
  onClose: () => void
}) {
  const exercises = useStore((s) => s.exercises)
  const template = useStore((s) => s.templates[dayType])
  const addExercise = useStore((s) => s.addExercise)
  const addTemplateExercise = useStore((s) => s.addTemplateExercise)
  const [newName, setNewName] = useState('')

  const inTemplate = new Set(template.exercises.map((te) => te.exerciseId))
  const groups = groupExercisesByDayType(exercises, dayType).map((g) => ({
    ...g,
    exercises: g.exercises.filter((ex) => !inTemplate.has(ex.id)),
  }))

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const id = addExercise(trimmed, dayType)
    if (id) addTemplateExercise(dayType, id)
    setNewName('')
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Add to ${DAY_TYPE_LABEL[dayType]}`}>
      <form
        className="plan-newex"
        onSubmit={(e) => {
          e.preventDefault()
          handleCreate()
        }}
      >
        <label className="plan-newex-label" htmlFor="plan-new-exercise-name">
          New exercise…
        </label>
        <div className="plan-newex-row">
          <input
            id="plan-new-exercise-name"
            type="text"
            placeholder="e.g. Cable Crossover"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn-ghost" disabled={!newName.trim()}>
            Add
          </button>
        </div>
      </form>

      {groups.every((g) => g.exercises.length === 0) ? (
        <p className="micro">All library exercises are already in this template.</p>
      ) : (
        groups.map((g) =>
          g.exercises.length === 0 ? null : (
            <section key={g.dayType ?? 'other'} className="plan-libgroup">
              <p className="label">{g.dayType ? DAY_TYPE_LABEL[g.dayType] : 'Other'}</p>
              <ul className="plan-liblist">
                {g.exercises.map((ex) => (
                  <li key={ex.id}>
                    <button
                      type="button"
                      className="plan-additem"
                      onClick={() => addTemplateExercise(dayType, ex.id)}
                    >
                      <span>{ex.name}</span>
                      {ex.dayType ? <DayTypeBadge dayType={ex.dayType} size="sm" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )
      )}
    </Sheet>
  )
}
