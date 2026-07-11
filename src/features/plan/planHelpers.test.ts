import { describe, expect, it } from 'vitest'
import type { Exercise, Template } from '../../lib/types'
import { formatSetSummary, groupExercisesByDayType, totalSets } from './planHelpers'

describe('totalSets', () => {
  it('sums set counts across all exercises', () => {
    const tpl: Template = {
      dayType: 'push',
      exercises: [
        { exerciseId: 'a', sets: [{ reps: 8, weight: 60 }, { reps: 8, weight: 60 }] },
        { exerciseId: 'b', sets: [{ reps: 10, weight: 30 }] },
      ],
    }
    expect(totalSets(tpl)).toBe(3)
  })

  it('is 0 for an empty template', () => {
    expect(totalSets({ dayType: 'legs', exercises: [] })).toBe(0)
  })
})

describe('formatSetSummary', () => {
  it('includes weight when > 0', () => {
    expect(formatSetSummary([{ reps: 8, weight: 60 }, { reps: 8, weight: 60 }], 'kg')).toBe(
      '2 × 8 @ 60kg',
    )
  })

  it('omits weight when 0 (bodyweight)', () => {
    expect(formatSetSummary([{ reps: 8, weight: 0 }], 'kg')).toBe('1 × 8')
  })

  it('handles no sets', () => {
    expect(formatSetSummary([], 'lb')).toBe('No sets')
  })
})

describe('groupExercisesByDayType', () => {
  const exercises: Record<string, Exercise> = {
    bench: { id: 'bench', name: 'Bench Press', dayType: 'push' },
    squat: { id: 'squat', name: 'Squat', dayType: 'legs' },
    row: { id: 'row', name: 'Barbell Row', dayType: 'pull' },
    mystery: { id: 'mystery', name: 'Mystery Move' },
  }

  it('puts the primary day type first', () => {
    const groups = groupExercisesByDayType(exercises, 'legs')
    expect(groups[0].dayType).toBe('legs')
    expect(groups[0].exercises).toEqual([{ id: 'squat', name: 'Squat', dayType: 'legs' }])
  })

  it('groups the rest in canonical order, ungrouped last', () => {
    const groups = groupExercisesByDayType(exercises, 'push')
    expect(groups.map((g) => g.dayType)).toEqual(['push', 'pull', 'legs', null])
  })

  it('omits empty groups', () => {
    const groups = groupExercisesByDayType(
      { bench: exercises.bench },
      'push',
    )
    expect(groups).toEqual([
      { dayType: 'push', exercises: [{ id: 'bench', name: 'Bench Press', dayType: 'push' }] },
    ])
  })

  it('sorts exercises alphabetically within a group', () => {
    const groups = groupExercisesByDayType(exercises, 'push')
    const pull = groups.find((g) => g.dayType === 'pull')!
    expect(pull.exercises.map((e) => e.name)).toEqual(['Barbell Row'])
  })
})
