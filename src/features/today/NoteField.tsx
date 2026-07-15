import { useEffect, useId, useRef, useState } from 'react'
import './NoteField.css'

/**
 * Shared expand/collapse note pattern used for both the workout-level note
 * and per-exercise notes: a quiet ghost "add" button that expands into a
 * labeled, autofocused textarea; once a note exists, the button is replaced
 * by the note text itself (tappable, reopens editing). Collapses on blur or
 * via the explicit "Done" control — either way the value is already live in
 * the store on every keystroke, so there is nothing to "save".
 */
export function NoteField({
  value,
  onChange,
  placeholder,
  addLabel,
  fieldLabel,
  className,
}: {
  value: string | undefined
  onChange: (next: string) => void
  placeholder: string
  addLabel: string
  fieldLabel: string
  /** class prefix, e.g. "sess-note" or "sess-exnote" — kept unique per feature per CLAUDE.md */
  className: string
}) {
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fieldId = useId()

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  const hasNote = !!value?.trim()

  if (!editing) {
    if (hasNote) {
      return (
        <button
          type="button"
          className={`${className}-view`}
          onClick={() => setEditing(true)}
          aria-label={`Edit ${fieldLabel}`}
        >
          <span className="label">{fieldLabel}</span>
          <p className={`${className}-text`}>{value}</p>
        </button>
      )
    }
    return (
      <button type="button" className={`btn-ghost ${className}-add`} onClick={() => setEditing(true)}>
        {addLabel}
      </button>
    )
  }

  return (
    <div className={`${className}-edit`}>
      <label className="label" htmlFor={fieldId}>
        {fieldLabel}
      </label>
      <textarea
        id={fieldId}
        ref={textareaRef}
        className={`${className}-textarea`}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
      />
      <button
        type="button"
        className={`btn-ghost ${className}-done`}
        onClick={() => setEditing(false)}
      >
        Done
      </button>
    </div>
  )
}
