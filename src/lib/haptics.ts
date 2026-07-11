/** best-effort haptic feedback; silently no-ops where unsupported */
export function buzz(pattern: number | number[] = 10): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}
