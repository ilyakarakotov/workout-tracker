import type { DayType } from './types'
import { DAY_TYPE_LABEL } from './types'

// The Badging API isn't in TS's default DOM lib yet — declare the bits we use.
declare global {
  interface Navigator {
    setAppBadge?: (contents?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
}

/**
 * Day-type accent hexes, hardcoded here to mirror the CSS custom properties
 * in src/styles/tokens.css (--push, --pull, --legs). Notification/badge icons
 * are rasterized outside the page's CSS cascade (no var(--…) access at
 * generation time), so the values are duplicated rather than referenced.
 */
const ACCENT: Record<DayType, string> = {
  push: '#ff6b57',
  pull: '#4da3ff',
  legs: '#8fe388',
}
/** neutral fallback (mirrors --text-3 in tokens.css) for icons with no day-type context */
const NEUTRAL_ACCENT = '#5e6470'

const GLYPH_FILL = '#ffffff'

function liftGlyph(): string {
  // stylized dumbbell: two plates connected by a bar
  return (
    `<rect x="24" y="44" width="48" height="8" rx="4" fill="${GLYPH_FILL}"/>` +
    `<rect x="13" y="31" width="9" height="34" rx="3" fill="${GLYPH_FILL}"/>` +
    `<rect x="20" y="36" width="6" height="24" rx="2" fill="${GLYPH_FILL}"/>` +
    `<rect x="74" y="31" width="9" height="34" rx="3" fill="${GLYPH_FILL}"/>` +
    `<rect x="70" y="36" width="6" height="24" rx="2" fill="${GLYPH_FILL}"/>`
  )
}

function restGlyph(): string {
  // stylized hourglass
  return (
    `<rect x="24" y="16" width="48" height="6" rx="3" fill="${GLYPH_FILL}"/>` +
    `<rect x="24" y="74" width="48" height="6" rx="3" fill="${GLYPH_FILL}"/>` +
    `<path d="M28 22 L68 22 L48 47 Z" fill="${GLYPH_FILL}"/>` +
    `<path d="M28 74 L68 74 L48 49 Z" fill="${GLYPH_FILL}"/>`
  )
}

/**
 * PURE. Renders a small rounded-square "stage icon": a day-type accent tile
 * with a white glyph, used as the notification icon/badge. `dayType` null
 * falls back to a neutral tile. `kind` picks the glyph — a dumbbell for
 * "back to lifting", an hourglass for "resting".
 */
export function stageIconSvg(dayType: DayType | null, kind: 'lift' | 'rest'): string {
  const bg = dayType ? ACCENT[dayType] : NEUTRAL_ACCENT
  const glyph = kind === 'lift' ? liftGlyph() : restGlyph()
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" data-kind="${kind}">` +
    `<rect width="96" height="96" rx="20" fill="${bg}"/>` +
    glyph +
    `</svg>`
  )
}

/** `stageIconSvg` encoded as a `data:image/svg+xml` URL. */
export function stageIconUrl(dayType: DayType | null, kind: 'lift' | 'rest'): string {
  return `data:image/svg+xml,${encodeURIComponent(stageIconSvg(dayType, kind))}`
}

/** True when the Notification API exists in this environment. */
export function canNotify(): boolean {
  try {
    return typeof window !== 'undefined' && 'Notification' in window
  } catch {
    return false
  }
}

/** Current notification permission, or 'unsupported' where the API is absent. */
export function notificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  try {
    if (!canNotify()) return 'unsupported'
    return Notification.permission
  } catch {
    return 'unsupported'
  }
}

/** Requests notification permission; resolves false (never throws) where unsupported or denied. */
export async function requestNotifyPermission(): Promise<boolean> {
  try {
    if (!canNotify()) return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

/**
 * Fires the "rest done" notification via the active service worker
 * registration where available (works while backgrounded on more
 * platforms), falling back to a plain `Notification`. A silent, best-effort
 * no-op if neither is available or permission isn't granted — this is called
 * from a UI effect and must never throw into its caller.
 */
export async function notifyRestDone(dayType: DayType, exerciseName?: string): Promise<void> {
  try {
    if (!canNotify() || Notification.permission !== 'granted') return
    const title = 'Rest done'
    const body = exerciseName
      ? `Back to ${DAY_TYPE_LABEL[dayType]} — ${exerciseName}`
      : `Back to ${DAY_TYPE_LABEL[dayType]}`
    const icon = stageIconUrl(dayType, 'lift')
    const options: NotificationOptions = {
      body,
      icon,
      badge: icon,
      tag: 'workout-rest',
      silent: false,
    }
    const reg = await navigator.serviceWorker?.getRegistration?.()
    if (reg) {
      await reg.showNotification(title, options)
      return
    }
    new Notification(title, options)
  } catch {
    /* best-effort — notifications are never load-bearing */
  }
}

/** Sets the app icon badge (installed PWA) while a workout is in progress. */
export function setWorkoutBadge(): void {
  try {
    void navigator.setAppBadge?.()
  } catch {
    /* unsupported */
  }
}

/** Clears the app icon badge. */
export function clearWorkoutBadge(): void {
  try {
    void navigator.clearAppBadge?.()
  } catch {
    /* unsupported */
  }
}
