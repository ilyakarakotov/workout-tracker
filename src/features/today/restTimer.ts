/** Whole seconds remaining in a rest window that started at `startedAt` for
 * `durationSec`, measured at `now`. Never negative. */
export function restRemaining(startedAt: number, durationSec: number, now: number): number {
  const elapsed = (now - startedAt) / 1000
  return Math.max(0, Math.ceil(durationSec - elapsed))
}
