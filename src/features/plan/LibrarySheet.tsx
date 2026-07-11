import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { useStore } from '../../store/store'
import { DAY_TYPE_LABEL } from '../../lib/types'
import { groupExercisesByDayType } from './planHelpers'

export function LibrarySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const exercises = useStore((s) => s.exercises)
  const renameExercise = useStore((s) => s.renameExercise)
  const deleteExercise = useStore((s) => s.deleteExercise)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const groups = groupExercisesByDayType(exercises, 'push')

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditValue(name)
  }

  const saveEdit = () => {
    if (editingId && editValue.trim()) renameExercise(editingId, editValue.trim())
    setEditingId(null)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? History keeps its logged data.`)) deleteExercise(id)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Exercise library">
      {groups.length === 0 ? (
        <p className="micro">No exercises yet — add your first from a template.</p>
      ) : (
        groups.map((g) => (
          <section key={g.dayType ?? 'other'} className="plan-libgroup">
            <p className="label">{g.dayType ? DAY_TYPE_LABEL[g.dayType] : 'Other'}</p>
            <ul className="plan-liblist">
              {g.exercises.map((ex) => (
                <li key={ex.id} className="plan-libeditrow">
                  {editingId === ex.id ? (
                    <form
                      className="plan-libeditform"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveEdit()
                      }}
                    >
                      <label className="sr-only" htmlFor={`rename-${ex.id}`}>
                        Rename {ex.name}
                      </label>
                      <input
                        id={`rename-${ex.id}`}
                        type="text"
                        value={editValue}
                        autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                      <button type="submit" className="btn-ghost" disabled={!editValue.trim()}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="plan-libname">{ex.name}</span>
                      <span className="plan-libactions">
                        <button
                          type="button"
                          className="plan-iconbtn"
                          aria-label={`Rename ${ex.name}`}
                          onClick={() => startEdit(ex.id, ex.name)}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                              d="M4 20l.9-3.6L15.6 5.7a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L7.6 19.1 4 20Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="plan-iconbtn plan-iconbtn-danger"
                          aria-label={`Delete ${ex.name}`}
                          onClick={() => handleDelete(ex.id, ex.name)}
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
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Sheet>
  )
}
