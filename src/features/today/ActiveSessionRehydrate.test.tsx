import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY } from '../../store/store'

/**
 * Simulates a full page reload: the gate mounts fresh against localStorage
 * that already has `sessionMinimized: true` / a running `restStartedAt`
 * persisted from before the reload, rather than reaching that state via
 * live user interaction within a single mounted instance (already covered
 * by ActiveSessionGate.test.tsx). This exercises the first-paint path,
 * where a stale-vs-live rest timer must be judged correctly before any
 * user interaction has happened at all.
 */
describe('ActiveSessionGate — mounting fresh against reload-persisted minimize/rest state', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.resetModules()
    localStorage.clear()
  })

  it('mounts straight into the floating pill (no takeover flash) and surfaces a live, non-stale rest countdown', async () => {
    const now = Date.now()
    const persisted = {
      state: {
        exercises: { 'bench-press': { id: 'bench-press', name: 'Bench Press', dayType: 'push' } },
        templates: {
          push: {
            dayType: 'push',
            exercises: [{ exerciseId: 'bench-press', sets: [{ reps: 8, weight: 60 }] }],
          },
          pull: { dayType: 'pull', exercises: [] },
          legs: { dayType: 'legs', exercises: [] },
        },
        sessions: [],
        activeSession: {
          id: 'resumed',
          dayType: 'push',
          startedAt: now - 60_000,
          exercises: [
            {
              exerciseId: 'bench-press',
              name: 'Bench Press',
              sets: [{ weight: 60, reps: 8, done: true }],
            },
          ],
        },
        settings: { unit: 'kg', weekStartsOn: 1, weeklyGoal: 6, restSeconds: 90 },
        // 20s into a live 90s rest — must NOT be judged stale
        restStartedAt: now - 20_000,
        sessionMinimized: true,
      },
      version: 0,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

    vi.resetModules()
    const { ActiveSessionGate } = await import('./ActiveSessionGate')
    const { useStore } = await import('../../store/store')

    render(<ActiveSessionGate />)

    // never renders the full-screen takeover on first paint
    expect(screen.queryByText('Finish workout')).not.toBeInTheDocument()
    // mounts straight into the pill, with the live rest countdown surfaced
    expect(
      screen.getByRole('button', {
        name: /^Return to Push workout, 1:00 elapsed, rest 1:1\d remaining$/,
      }),
    ).toBeInTheDocument()
    // the rest window survived the reload — it was live, not stale
    expect(useStore.getState().restStartedAt).not.toBeNull()
    expect(useStore.getState().sessionMinimized).toBe(true)
  })

  it('silently clears an already-expired rest timer on first mount, even while minimized, without ever buzzing', async () => {
    const now = Date.now()
    const persisted = {
      state: {
        exercises: {},
        templates: {
          push: { dayType: 'push', exercises: [] },
          pull: { dayType: 'pull', exercises: [] },
          legs: { dayType: 'legs', exercises: [] },
        },
        sessions: [],
        activeSession: { id: 'resumed', dayType: 'push', startedAt: now - 600_000, exercises: [] },
        settings: { unit: 'kg', weekStartsOn: 1, weeklyGoal: 6, restSeconds: 90 },
        // long expired before the reload ever happened
        restStartedAt: now - 500_000,
        sessionMinimized: true,
      },
      version: 0,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

    vi.resetModules()
    const { ActiveSessionGate } = await import('./ActiveSessionGate')
    const { useStore } = await import('../../store/store')
    const vibrateSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { ...navigator, vibrate: vibrateSpy })

    render(<ActiveSessionGate />)

    expect(useStore.getState().restStartedAt).toBeNull()
    expect(vibrateSpy).not.toHaveBeenCalled()
    // pill shows elapsed only — no rest suffix, since the rest was cleared
    expect(
      screen.getByRole('button', { name: /^Return to Push workout, 10:00 elapsed$/ }),
    ).toBeInTheDocument()
  })
})
