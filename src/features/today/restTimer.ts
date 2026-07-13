/** Whole seconds remaining in a rest window that started at `startedAt` for
 * `durationSec`, measured at `now`. Never negative. */
export function restRemaining(startedAt: number, durationSec: number, now: number): number {
  const elapsed = (now - startedAt) / 1000
  return Math.max(0, Math.ceil(durationSec - elapsed))
}

/**
 * A set's done state only ever flips to `true` via a reps commit (typing a
 * number of reps). The rest timer must start exactly once on that
 * false → true transition — not on every keystroke that keeps the set done,
 * not on weight edits, and not when reps are cleared (unlogging the set).
 */
export function shouldStartRestTimer(
  wasDone: boolean,
  repsCommitted: number | null,
  restSeconds: number,
): boolean {
  return !wasDone && repsCommitted !== null && restSeconds > 0
}
