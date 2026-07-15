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

/** Ticker cadence the active-session gate re-renders the rest countdown on. */
export const REST_TICK_MS = 1000

/**
 * True once a running rest window is expired by more than a single tick —
 * i.e. it did not just naturally cross zero while the gate stayed mounted
 * (that boundary is handled live by the buzz effect), it was already over
 * before this render happened at all, e.g. the countdown ran out while the
 * tab was closed or backgrounded and only got checked again on reload. Such
 * a timer should be cleared silently, with no buzz.
 */
export function isStaleRest(
  restStartedAt: number | null,
  restSeconds: number,
  now: number,
): boolean {
  if (restStartedAt == null || restSeconds <= 0) return false
  return now - restStartedAt > restSeconds * 1000 + REST_TICK_MS
}
