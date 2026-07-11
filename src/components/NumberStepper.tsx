import { useRef } from 'react'
import './NumberStepper.css'

export interface NumberStepperProps {
  label: string
  value: number
  step: number
  min?: number
  max?: number
  /** suffix shown after the value, e.g. "kg" */
  suffix?: string
  onChange: (next: number) => void
}

function round1(n: number): number {
  return Math.round(n * 100) / 100
}

/** `− value +` control with press-and-hold repeat. */
export function NumberStepper({
  label,
  value,
  step,
  min = 0,
  max = 2000,
  suffix,
  onChange,
}: NumberStepperProps) {
  const timer = useRef<number | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  const bump = (dir: 1 | -1) => {
    const next = round1(Math.min(max, Math.max(min, valueRef.current + dir * step)))
    onChange(next)
  }

  const startHold = (dir: 1 | -1) => {
    bump(dir)
    let delay = 400
    const tick = () => {
      bump(dir)
      delay = Math.max(80, delay - 60)
      timer.current = window.setTimeout(tick, delay)
    }
    timer.current = window.setTimeout(tick, delay)
  }

  const endHold = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        aria-label={`decrease ${label}`}
        onPointerDown={() => startHold(-1)}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        −
      </button>
      <span className="stepper-value num" aria-live="polite">
        {value}
        {suffix ? <span className="stepper-suffix">{suffix}</span> : null}
      </span>
      <button
        type="button"
        className="stepper-btn"
        aria-label={`increase ${label}`}
        onPointerDown={() => startHold(1)}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        +
      </button>
    </div>
  )
}
