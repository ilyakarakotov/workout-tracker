import { Sheet } from '../../components/Sheet'

/**
 * Small action sheet opened from an exercise card's "⋯" button. Move/replace
 * are lineup-only operations — they never touch the day's template.
 */
export function ExerciseActionsSheet({
  open,
  exerciseName,
  canMoveUp,
  canMoveDown,
  onClose,
  onMoveUp,
  onMoveDown,
  onReplace,
  onRemove,
}: {
  open: boolean
  exerciseName: string
  canMoveUp: boolean
  canMoveDown: boolean
  onClose: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onReplace: () => void
  onRemove: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={exerciseName || 'Exercise options'}>
      <div className="sess-actions-list">
        <button
          type="button"
          className="sess-action-item"
          disabled={!canMoveUp}
          onClick={onMoveUp}
        >
          Move up
        </button>
        <button
          type="button"
          className="sess-action-item"
          disabled={!canMoveDown}
          onClick={onMoveDown}
        >
          Move down
        </button>
        <button type="button" className="sess-action-item" onClick={onReplace}>
          Replace exercise…
        </button>
        <button
          type="button"
          className="sess-action-item sess-action-danger"
          onClick={onRemove}
        >
          Remove from workout
        </button>
      </div>
    </Sheet>
  )
}
