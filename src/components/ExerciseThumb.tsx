import { getExerciseImage } from '../lib/exerciseImages'
import type { DayType } from '../lib/types'
import './ExerciseThumb.css'

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="55%" height="55%" aria-hidden="true">
      <path
        d="M4 10v4M2.5 9.5v5M7 8v8M17 8v8M19.5 9.5v5M21 10v4M7 12h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export interface ExerciseThumbProps {
  exerciseId: string
  name: string
  dayType?: DayType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Square demonstration thumbnail for a seed exercise, lazy-loaded.
 * Custom exercises (no entry in the image manifest) render a calm
 * day-type-tinted fallback badge instead of a broken image.
 */
export function ExerciseThumb({ exerciseId, name, dayType, size = 'md', className = '' }: ExerciseThumbProps) {
  const image = getExerciseImage(exerciseId)
  const cls = `ex-thumb ex-thumb-${size}${dayType ? ` ex-thumb-${dayType}` : ''}${className ? ` ${className}` : ''}`

  if (!image) {
    return (
      <span className={cls} aria-hidden="true">
        <DumbbellIcon />
      </span>
    )
  }

  return (
    <span className={cls}>
      <img
        src={`${import.meta.env.BASE_URL}exercises/${image.file}`}
        alt={`${name} — ${image.alt}`}
        loading="lazy"
        decoding="async"
        width={96}
        height={96}
      />
    </span>
  )
}
