import type { DayType, Exercise, TargetSet, Template, Unit } from '../../lib/types'
import { DAY_TYPES } from '../../lib/types'

/** total logged-set count across every exercise in a template */
export function totalSets(template: Template): number {
  return template.exercises.reduce((sum, te) => sum + te.sets.length, 0)
}

/** "4 × 8 @ 60kg" style summary from the first set (sets are kept uniform by the editor UI) */
export function formatSetSummary(sets: TargetSet[], unit: Unit): string {
  if (sets.length === 0) return 'No sets'
  const first = sets[0]
  const weightPart = first.weight > 0 ? ` @ ${first.weight}${unit}` : ''
  return `${sets.length} × ${first.reps}${weightPart}`
}

export interface ExerciseGroup {
  dayType: DayType | null
  exercises: Exercise[]
}

/**
 * Exercise library grouped by day type, `primary` group first, then the
 * remaining day types in canonical order, then ungrouped ("Other") last.
 * Empty groups are omitted.
 */
export function groupExercisesByDayType(
  exercises: Record<string, Exercise>,
  primary: DayType,
): ExerciseGroup[] {
  const order: (DayType | null)[] = [primary, ...DAY_TYPES.filter((d) => d !== primary), null]
  const buckets = new Map<DayType | null, Exercise[]>(order.map((dt) => [dt, []]))
  for (const ex of Object.values(exercises)) {
    const key = ex.dayType ?? null
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(ex)
  }
  return order
    .map((dt) => ({
      dayType: dt,
      exercises: [...(buckets.get(dt) ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.exercises.length > 0)
}
