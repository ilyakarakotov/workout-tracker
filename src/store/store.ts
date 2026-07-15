import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ActiveSession,
  DayType,
  LoggedSet,
  PersistedData,
  Session,
  Settings,
  TargetSet,
} from '../lib/types'
import { DAY_TYPES } from '../lib/types'
import { newId } from '../lib/id'
import { seedExercises, seedTemplates } from './seed'

export const STORAGE_KEY = 'workout.v1'
const LEGACY_STORAGE_KEY = 'forge.v1'

/**
 * One-time migration: if the new storage key has nothing yet but the old
 * `forge.v1` key does, copy it over so existing installs keep their data.
 * The old key is left in place (harmless, and safe if this runs twice).
 * Wrapped defensively for SSR/jsdom environments without `localStorage`.
 */
export function migrateLegacyStorage(): void {
  try {
    if (typeof localStorage === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY) != null) return
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy != null) localStorage.setItem(STORAGE_KEY, legacy)
  } catch {
    /* storage unavailable — nothing to migrate */
  }
}

migrateLegacyStorage()

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  weekStartsOn: 1,
  weeklyGoal: 6,
  restSeconds: 90,
  restAlerts: false,
}

export interface AppState extends PersistedData {
  /* ---- device-local active-session UI state (persisted, not exported) ---- */
  /** epoch ms anchor of the running rest countdown; null = no rest running */
  restStartedAt: number | null
  /** true when the active-workout takeover is hidden and the user is browsing the app */
  sessionMinimized: boolean

  /* ---- session lifecycle ---- */
  startSession: (dayType: DayType) => void
  cancelSession: () => void
  finishSession: () => string | null

  /* ---- active session editing ---- */
  /** number → sets weight, marks it touched. null (cleared field) → reverts to the ghost value. */
  enterActiveWeight: (exIndex: number, setIndex: number, weight: number | null) => void
  /** number → sets reps, marks it touched, and logs the set (done: true).
   * null (cleared field) → unlogs the set and reverts reps to the ghost value. */
  enterActiveReps: (exIndex: number, setIndex: number, reps: number | null) => void
  addSetToActive: (exIndex: number) => void
  removeSetFromActive: (exIndex: number, setIndex: number) => void
  addExerciseToActive: (exerciseId: string) => void
  removeExerciseFromActive: (exIndex: number) => void
  /** replace the exercise at exIndex in place with a fresh SessionExercise (built like
   * addExerciseToActive); no-op if no active session, bad index, unknown exercise id, or
   * the id already appears in the active lineup. Discards the old exercise's sets/note. */
  replaceExerciseInActive: (exIndex: number, newExerciseId: string) => void
  /** reorder within the active session only; clamped like moveTemplateExercise (out-of-range → no-op) */
  moveExerciseInActive: (exIndex: number, dir: -1 | 1) => void

  /* ---- active session notes ---- */
  setSessionNote: (note: string) => void
  setExerciseNote: (exIndex: number, note: string) => void

  /* ---- persistent rest timer ---- */
  startRest: () => void
  clearRest: () => void

  /* ---- navigation ---- */
  setSessionMinimized: (minimized: boolean) => void

  /* ---- history editing ---- */
  updateSession: (id: string, updater: (s: Session) => Session) => void
  deleteSession: (id: string) => void

  /* ---- templates ---- */
  addTemplateExercise: (dayType: DayType, exerciseId: string) => void
  removeTemplateExercise: (dayType: DayType, index: number) => void
  moveTemplateExercise: (dayType: DayType, index: number, dir: -1 | 1) => void
  updateTemplateSet: (
    dayType: DayType,
    exIndex: number,
    setIndex: number,
    patch: Partial<TargetSet>,
  ) => void
  addTemplateSet: (dayType: DayType, exIndex: number) => void
  removeTemplateSet: (dayType: DayType, exIndex: number) => void

  /* ---- exercise library ---- */
  addExercise: (name: string, dayType?: DayType) => string
  renameExercise: (id: string, name: string) => void
  deleteExercise: (id: string) => void

  /* ---- settings & data ---- */
  updateSettings: (patch: Partial<Settings>) => void
  exportData: () => string
  importData: (json: string) => { ok: true } | { ok: false; error: string }
  resetAll: () => void
}

function clampNum(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/** targets for a new session: last actuals for this exercise, else template */
function prefillSets(
  sessions: Session[],
  exerciseId: string,
  fallback: TargetSet[],
): LoggedSet[] {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const ex = sessions[i].exercises.find((e) => e.exerciseId === exerciseId)
    if (ex) {
      const done = ex.sets.filter((s) => s.done)
      const src = done.length > 0 ? done : ex.sets
      if (src.length > 0)
        return src.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          done: false,
          ghostWeight: s.weight,
          ghostReps: s.reps,
        }))
    }
  }
  return fallback.map((t) => ({
    weight: t.weight,
    reps: t.reps,
    done: false,
    ghostWeight: t.weight,
    ghostReps: t.reps,
  }))
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      exercises: seedExercises(),
      templates: seedTemplates(),
      sessions: [],
      activeSession: null,
      settings: DEFAULT_SETTINGS,
      restStartedAt: null,
      sessionMinimized: false,

      startSession: (dayType) => {
        const { templates, sessions, exercises, activeSession } = get()
        if (activeSession) return
        const tpl = templates[dayType]
        const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt)
        const active: ActiveSession = {
          id: newId(),
          dayType,
          startedAt: Date.now(),
          exercises: tpl.exercises
            .filter((te) => exercises[te.exerciseId])
            .map((te) => ({
              exerciseId: te.exerciseId,
              name: exercises[te.exerciseId].name,
              sets: prefillSets(sorted, te.exerciseId, te.sets),
            })),
        }
        set({ activeSession: active, restStartedAt: null, sessionMinimized: false })
      },

      cancelSession: () =>
        set({ activeSession: null, restStartedAt: null, sessionMinimized: false }),

      finishSession: () => {
        const { activeSession, sessions } = get()
        if (!activeSession) return null
        // strip active-session-only helper fields so persisted history stays clean;
        // trim notes and drop them entirely when empty/whitespace-only
        const cleanExercises = activeSession.exercises.map((ex) => {
          const trimmedNote = ex.note?.trim()
          const clean: Session['exercises'][number] = {
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.sets.map(({ weight, reps, done }) => ({ weight, reps, done })),
          }
          if (trimmedNote) clean.note = trimmedNote
          return clean
        })
        const trimmedSessionNote = activeSession.note?.trim()
        const done: Session = {
          id: activeSession.id,
          dayType: activeSession.dayType,
          startedAt: activeSession.startedAt,
          endedAt: Date.now(),
          exercises: cleanExercises,
        }
        if (trimmedSessionNote) done.note = trimmedSessionNote
        set({
          activeSession: null,
          sessions: [...sessions, done].sort((a, b) => a.startedAt - b.startedAt),
          restStartedAt: null,
          sessionMinimized: false,
        })
        return done.id
      },

      enterActiveWeight: (exIndex, setIndex, weight) =>
        set((st) => {
          if (!st.activeSession) return st
          const exercises = st.activeSession.exercises.map((ex, i) =>
            i !== exIndex
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((s, j) => {
                    if (j !== setIndex) return s
                    if (weight === null) {
                      return { ...s, weightTouched: false, weight: s.ghostWeight ?? s.weight }
                    }
                    return { ...s, weight: clampNum(weight, 0, 2000), weightTouched: true }
                  }),
                },
          )
          return { activeSession: { ...st.activeSession, exercises } }
        }),

      enterActiveReps: (exIndex, setIndex, reps) =>
        set((st) => {
          if (!st.activeSession) return st
          const exercises = st.activeSession.exercises.map((ex, i) =>
            i !== exIndex
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((s, j) => {
                    if (j !== setIndex) return s
                    if (reps === null) {
                      return {
                        ...s,
                        repsTouched: false,
                        done: false,
                        reps: s.ghostReps ?? s.reps,
                      }
                    }
                    return {
                      ...s,
                      reps: Math.round(clampNum(reps, 0, 999)),
                      repsTouched: true,
                      done: true,
                    }
                  }),
                },
          )
          return { activeSession: { ...st.activeSession, exercises } }
        }),

      addSetToActive: (exIndex) =>
        set((st) => {
          if (!st.activeSession) return st
          const exercises = st.activeSession.exercises.map((ex, i) => {
            if (i !== exIndex) return ex
            const last = ex.sets[ex.sets.length - 1]
            const blank: LoggedSet = last
              ? {
                  weight: last.weight,
                  reps: last.reps,
                  done: false,
                  ghostWeight: last.weight,
                  ghostReps: last.reps,
                }
              : { weight: 0, reps: 8, done: false, ghostWeight: 0, ghostReps: 8 }
            return { ...ex, sets: [...ex.sets, blank] }
          })
          return { activeSession: { ...st.activeSession, exercises } }
        }),

      removeSetFromActive: (exIndex, setIndex) =>
        set((st) => {
          if (!st.activeSession) return st
          const exercises = st.activeSession.exercises.map((ex, i) =>
            i !== exIndex ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) },
          )
          return { activeSession: { ...st.activeSession, exercises } }
        }),

      addExerciseToActive: (exerciseId) =>
        set((st) => {
          if (!st.activeSession) return st
          const ex = st.exercises[exerciseId]
          if (!ex) return st
          const tpl = st.templates[st.activeSession.dayType].exercises.find(
            (te) => te.exerciseId === exerciseId,
          )
          const sorted = [...st.sessions].sort((a, b) => a.startedAt - b.startedAt)
          const sets = prefillSets(sorted, exerciseId, tpl?.sets ?? [{ reps: 10, weight: 0 }])
          return {
            activeSession: {
              ...st.activeSession,
              exercises: [
                ...st.activeSession.exercises,
                { exerciseId, name: ex.name, sets },
              ],
            },
          }
        }),

      removeExerciseFromActive: (exIndex) =>
        set((st) => {
          if (!st.activeSession) return st
          return {
            activeSession: {
              ...st.activeSession,
              exercises: st.activeSession.exercises.filter((_, i) => i !== exIndex),
            },
          }
        }),

      replaceExerciseInActive: (exIndex, newExerciseId) =>
        set((st) => {
          if (!st.activeSession) return st
          const exercises = st.activeSession.exercises
          if (exIndex < 0 || exIndex >= exercises.length) return st
          const ex = st.exercises[newExerciseId]
          if (!ex) return st
          if (exercises.some((e) => e.exerciseId === newExerciseId)) return st
          const tpl = st.templates[st.activeSession.dayType].exercises.find(
            (te) => te.exerciseId === newExerciseId,
          )
          const sorted = [...st.sessions].sort((a, b) => a.startedAt - b.startedAt)
          const sets = prefillSets(sorted, newExerciseId, tpl?.sets ?? [{ reps: 10, weight: 0 }])
          const nextExercises = exercises.map((e, i) =>
            i !== exIndex ? e : { exerciseId: newExerciseId, name: ex.name, sets },
          )
          return { activeSession: { ...st.activeSession, exercises: nextExercises } }
        }),

      moveExerciseInActive: (exIndex, dir) =>
        set((st) => {
          if (!st.activeSession) return st
          const exercises = st.activeSession.exercises
          const to = exIndex + dir
          if (to < 0 || to >= exercises.length) return st
          const arr = [...exercises]
          const [item] = arr.splice(exIndex, 1)
          arr.splice(to, 0, item)
          return { activeSession: { ...st.activeSession, exercises: arr } }
        }),

      setSessionNote: (note) =>
        set((st) => {
          if (!st.activeSession) return st
          return { activeSession: { ...st.activeSession, note } }
        }),

      setExerciseNote: (exIndex, note) =>
        set((st) => {
          if (!st.activeSession) return st
          const exercises = st.activeSession.exercises.map((ex, i) =>
            i !== exIndex ? ex : { ...ex, note },
          )
          return { activeSession: { ...st.activeSession, exercises } }
        }),

      startRest: () => set({ restStartedAt: Date.now() }),

      clearRest: () => set({ restStartedAt: null }),

      setSessionMinimized: (minimized) => set({ sessionMinimized: minimized }),

      updateSession: (id, updater) =>
        set((st) => ({
          sessions: st.sessions
            .map((s) => (s.id === id ? updater(s) : s))
            .sort((a, b) => a.startedAt - b.startedAt),
        })),

      deleteSession: (id) =>
        set((st) => ({ sessions: st.sessions.filter((s) => s.id !== id) })),

      addTemplateExercise: (dayType, exerciseId) =>
        set((st) => {
          if (!st.exercises[exerciseId]) return st
          const tpl = st.templates[dayType]
          if (tpl.exercises.some((te) => te.exerciseId === exerciseId)) return st
          return {
            templates: {
              ...st.templates,
              [dayType]: {
                ...tpl,
                exercises: [
                  ...tpl.exercises,
                  { exerciseId, sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }] },
                ],
              },
            },
          }
        }),

      removeTemplateExercise: (dayType, index) =>
        set((st) => {
          const tpl = st.templates[dayType]
          return {
            templates: {
              ...st.templates,
              [dayType]: { ...tpl, exercises: tpl.exercises.filter((_, i) => i !== index) },
            },
          }
        }),

      moveTemplateExercise: (dayType, index, dir) =>
        set((st) => {
          const tpl = st.templates[dayType]
          const to = index + dir
          if (to < 0 || to >= tpl.exercises.length) return st
          const arr = [...tpl.exercises]
          const [item] = arr.splice(index, 1)
          arr.splice(to, 0, item)
          return { templates: { ...st.templates, [dayType]: { ...tpl, exercises: arr } } }
        }),

      updateTemplateSet: (dayType, exIndex, setIndex, patch) =>
        set((st) => {
          const tpl = st.templates[dayType]
          const exercises = tpl.exercises.map((te, i) =>
            i !== exIndex
              ? te
              : {
                  ...te,
                  sets: te.sets.map((s, j) =>
                    j !== setIndex
                      ? s
                      : {
                          reps:
                            patch.reps !== undefined
                              ? Math.round(clampNum(patch.reps, 0, 999))
                              : s.reps,
                          weight:
                            patch.weight !== undefined
                              ? clampNum(patch.weight, 0, 2000)
                              : s.weight,
                        },
                  ),
                },
          )
          return { templates: { ...st.templates, [dayType]: { ...tpl, exercises } } }
        }),

      addTemplateSet: (dayType, exIndex) =>
        set((st) => {
          const tpl = st.templates[dayType]
          const exercises = tpl.exercises.map((te, i) => {
            if (i !== exIndex) return te
            const last = te.sets[te.sets.length - 1] ?? { reps: 10, weight: 0 }
            return { ...te, sets: [...te.sets, { ...last }] }
          })
          return { templates: { ...st.templates, [dayType]: { ...tpl, exercises } } }
        }),

      removeTemplateSet: (dayType, exIndex) =>
        set((st) => {
          const tpl = st.templates[dayType]
          const exercises = tpl.exercises.map((te, i) => {
            if (i !== exIndex || te.sets.length <= 1) return te
            return { ...te, sets: te.sets.slice(0, -1) }
          })
          return { templates: { ...st.templates, [dayType]: { ...tpl, exercises } } }
        }),

      addExercise: (name, dayType) => {
        const id = newId()
        const trimmed = name.trim()
        if (!trimmed) return ''
        set((st) => ({
          exercises: { ...st.exercises, [id]: { id, name: trimmed, dayType } },
        }))
        return id
      },

      renameExercise: (id, name) =>
        set((st) => {
          const ex = st.exercises[id]
          const trimmed = name.trim()
          if (!ex || !trimmed) return st
          return { exercises: { ...st.exercises, [id]: { ...ex, name: trimmed } } }
        }),

      deleteExercise: (id) =>
        set((st) => {
          const exercises = { ...st.exercises }
          delete exercises[id]
          const templates = { ...st.templates }
          for (const dt of DAY_TYPES) {
            templates[dt] = {
              ...templates[dt],
              exercises: templates[dt].exercises.filter((te) => te.exerciseId !== id),
            }
          }
          return { exercises, templates }
        }),

      updateSettings: (patch) =>
        set((st) => ({ settings: { ...st.settings, ...patch, weeklyGoal: 6 } })),

      exportData: () => {
        const { exercises, templates, sessions, activeSession, settings } = get()
        const data: PersistedData & { app: string; exportedAt: number } = {
          app: 'workout/v1',
          exportedAt: Date.now(),
          exercises,
          templates,
          sessions,
          activeSession,
          settings,
        }
        return JSON.stringify(data, null, 2)
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json) as Partial<PersistedData>
          if (
            !data ||
            typeof data !== 'object' ||
            !data.exercises ||
            !data.templates ||
            !Array.isArray(data.sessions) ||
            !data.templates.push ||
            !data.templates.pull ||
            !data.templates.legs
          ) {
            return { ok: false as const, error: 'Not a valid Workout export file.' }
          }
          set({
            exercises: data.exercises,
            templates: data.templates as PersistedData['templates'],
            sessions: [...data.sessions].sort((a, b) => a.startedAt - b.startedAt),
            activeSession: data.activeSession ?? null,
            settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}), weeklyGoal: 6 },
            // device-local UI state — never taken from an imported file
            restStartedAt: null,
            sessionMinimized: false,
          })
          return { ok: true as const }
        } catch {
          return { ok: false as const, error: 'Could not read that file as JSON.' }
        }
      },

      resetAll: () =>
        set({
          exercises: seedExercises(),
          templates: seedTemplates(),
          sessions: [],
          activeSession: null,
          settings: DEFAULT_SETTINGS,
          restStartedAt: null,
          sessionMinimized: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // deep-merge settings so blobs persisted before a settings field existed
      // rehydrate with that field's default instead of undefined
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        }
      },
      partialize: (st) => ({
        exercises: st.exercises,
        templates: st.templates,
        sessions: st.sessions,
        activeSession: st.activeSession,
        settings: st.settings,
        restStartedAt: st.restStartedAt,
        sessionMinimized: st.sessionMinimized,
      }),
    },
  ),
)
