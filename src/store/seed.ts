import type { DayType, Exercise, Template } from '../lib/types'

interface SeedRow {
  id: string
  name: string
  dayType: DayType
  sets: number
  reps: number
  weight: number
}

const ROWS: SeedRow[] = [
  { id: 'bench-press', name: 'Bench Press', dayType: 'push', sets: 4, reps: 8, weight: 60 },
  { id: 'overhead-press', name: 'Overhead Press', dayType: 'push', sets: 3, reps: 10, weight: 30 },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', dayType: 'push', sets: 3, reps: 10, weight: 22.5 },
  { id: 'cable-fly', name: 'Cable Fly', dayType: 'push', sets: 3, reps: 12, weight: 15 },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', dayType: 'push', sets: 3, reps: 12, weight: 25 },
  { id: 'lateral-raise', name: 'Lateral Raise', dayType: 'push', sets: 3, reps: 15, weight: 7.5 },
  { id: 'deadlift', name: 'Deadlift', dayType: 'pull', sets: 3, reps: 5, weight: 100 },
  { id: 'pull-up', name: 'Pull-Up', dayType: 'pull', sets: 3, reps: 8, weight: 0 },
  { id: 'barbell-row', name: 'Barbell Row', dayType: 'pull', sets: 4, reps: 8, weight: 50 },
  { id: 'face-pull', name: 'Face Pull', dayType: 'pull', sets: 3, reps: 15, weight: 15 },
  { id: 'barbell-curl', name: 'Barbell Curl', dayType: 'pull', sets: 3, reps: 10, weight: 25 },
  { id: 'hammer-curl', name: 'Hammer Curl', dayType: 'pull', sets: 3, reps: 12, weight: 12.5 },
  { id: 'squat', name: 'Squat', dayType: 'legs', sets: 4, reps: 6, weight: 80 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', dayType: 'legs', sets: 3, reps: 10, weight: 60 },
  { id: 'leg-press', name: 'Leg Press', dayType: 'legs', sets: 3, reps: 10, weight: 120 },
  { id: 'leg-curl', name: 'Leg Curl', dayType: 'legs', sets: 3, reps: 12, weight: 35 },
  { id: 'calf-raise', name: 'Calf Raise', dayType: 'legs', sets: 4, reps: 15, weight: 40 },
  { id: 'plank', name: 'Plank (seconds)', dayType: 'legs', sets: 3, reps: 60, weight: 0 },
]

export function seedExercises(): Record<string, Exercise> {
  const out: Record<string, Exercise> = {}
  for (const r of ROWS) out[r.id] = { id: r.id, name: r.name, dayType: r.dayType }
  return out
}

export function seedTemplates(): Record<DayType, Template> {
  const templates: Record<DayType, Template> = {
    push: { dayType: 'push', exercises: [] },
    pull: { dayType: 'pull', exercises: [] },
    legs: { dayType: 'legs', exercises: [] },
  }
  for (const r of ROWS) {
    templates[r.dayType].exercises.push({
      exerciseId: r.id,
      sets: Array.from({ length: r.sets }, () => ({ reps: r.reps, weight: r.weight })),
    })
  }
  return templates
}
