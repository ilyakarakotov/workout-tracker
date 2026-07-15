export type DayType = 'push' | 'pull' | 'legs'

export const DAY_TYPES: DayType[] = ['push', 'pull', 'legs']

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
}

export type Unit = 'kg' | 'lb'

export interface Exercise {
  id: string
  name: string
  /** primary day this exercise belongs to, used for grouping in pickers */
  dayType?: DayType
}

export interface TargetSet {
  reps: number
  weight: number
}

export interface TemplateExercise {
  exerciseId: string
  sets: TargetSet[]
}

export interface Template {
  dayType: DayType
  exercises: TemplateExercise[]
}

export interface LoggedSet {
  weight: number
  reps: number
  done: boolean
  /** active-session only: true once the user explicitly entered the value this session */
  weightTouched?: boolean
  repsTouched?: boolean
  /** active-session only: the prefilled "ghost" value captured at prefill time, used to
   * restore weight/reps when the user clears their entry */
  ghostWeight?: number
  ghostReps?: number
}

export interface SessionExercise {
  exerciseId: string
  /** name snapshot so history survives library edits/deletes */
  name: string
  sets: LoggedSet[]
  /** per-exercise note; trimmed on finish, absent when empty */
  note?: string
}

export interface Session {
  id: string
  dayType: DayType
  /** epoch ms */
  startedAt: number
  /** epoch ms */
  endedAt: number
  exercises: SessionExercise[]
  /** workout-level note; trimmed on finish, absent when empty */
  note?: string
}

/** a session in progress — no endedAt yet */
export type ActiveSession = Omit<Session, 'endedAt'>

export interface Settings {
  unit: Unit
  /** 0 = Sunday, 1 = Monday */
  weekStartsOn: 0 | 1
  /** fixed at 6 in v1 — the product identity */
  weeklyGoal: number
  /** rest timer seconds; 0 = off */
  restSeconds: number
  /** opt-in: notify + badge when rest ends while the app is backgrounded */
  restAlerts: boolean
}

export interface PersistedData {
  exercises: Record<string, Exercise>
  templates: Record<DayType, Template>
  sessions: Session[]
  activeSession: ActiveSession | null
  settings: Settings
}
