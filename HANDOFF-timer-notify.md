# HANDOFF — Prominent rest timer + stage notifications/badge (`feat/timer-notify`)

## What shipped

1. **Full-width floating rest bar** (`RestTimerPill.tsx`, styles in `ActiveSessionGate.css`)
   - Replaces the small centered pill with an edge-to-edge floating card: thin depleting
     progress track (day-type accent) across the top, big tabular-nums countdown (32px/800),
     small uppercase "rest" label, 44px "Skip" pill button.
   - Final 5 seconds: numerals shift to the day-type accent color (`.sess-rest-final`) — no sound.
   - `role="status"` retained on the outer bar (unchanged from the prior implementation, which a
     past review already signed off on — "announces automatically when it appears/updates. No
     change needed"). I did not add a separate debounced/sr-only live region; the existing
     approach was kept as-is per that precedent rather than risking a behavior change to an
     already-reviewed a11y pattern.
   - Entrance animation reuses the existing `view-in` keyframe; `prefers-reduced-motion` is
     handled globally (`global.css` zeroes all animation/transition durations under the media
     query), so no bar-specific reduced-motion code was needed.
   - `.sess-body` bottom clearance grown from 96px to 152px to clear the taller bar with margin.
   - `RestTimerPill` now takes a required `dayType: DayType` prop (API change, as scoped).
   - `WorkoutPill` (minimized state) is unchanged — still compact, no rest-bar styling leaks in.

2. **`src/lib/notify.ts`** (new) — every export try/catch-guarded, silent no-op where unsupported:
   - `stageIconSvg(dayType, kind)` — pure, returns a 96×96 rounded-square SVG string: day-type
     accent (or neutral `#5e6470` fallback for `null`) background, white glyph — dumbbell for
     `'lift'`, hourglass for `'rest'`. Accent hexes are hardcoded with a comment pointing at
     `tokens.css` (`--push`/`--pull`/`--legs`), since generated notification/badge icons render
     outside the page's CSS cascade.
   - `stageIconUrl` — `data:image/svg+xml,${encodeURIComponent(...)}` wrapper.
   - `canNotify`, `notificationPermission`, `requestNotifyPermission`.
   - `notifyRestDone(dayType, exerciseName?)` — prefers
     `(await navigator.serviceWorker.getRegistration())?.showNotification(...)`, falls back to
     `new Notification(...)`; title "Rest done", body "Back to {Push}" or "Back to {Push} —
     {exercise}", `icon`/`badge` = `stageIconUrl(dayType, 'lift')`, `tag: 'workout-rest'`,
     `silent: false`.
   - `setWorkoutBadge` / `clearWorkoutBadge` — `navigator.setAppBadge?.()` /
     `navigator.clearAppBadge?.()` (Badging API types declared locally via `declare global`
     since they're not in TS's default DOM lib).
   - 19 unit tests (`notify.test.ts`): pure SVG/URL assertions (accent per day type, neutral
     fallback, distinct glyph per kind, purity) + graceful-no-op assertions with no `Notification`
     global (jsdom's default) + a mocked `Notification`/`navigator.serviceWorker` for the
     permission/dispatch/fallback/error paths.

3. **`Settings.restAlerts: boolean`** (non-optional, default `false`)
   - Added to `src/lib/types.ts` and `DEFAULT_SETTINGS` in `store.ts`. `importData` already
     spread `DEFAULT_SETTINGS` first, so old exports missing the field get `false` for free —
     added a store test asserting this (`importing a pre-restAlerts export ... defaults
     restAlerts to false`), plus a toggle round-trip test.
   - Note: `zustand/persist`'s default `merge` is a shallow top-level merge, so a pre-existing
     *localStorage* blob (not an imported file) whose `settings` object predates this field would
     rehydrate with `settings.restAlerts === undefined`, not `false`. Functionally harmless (all
     gates treat it as falsy) but not literally `false` at the type level for that one edge case.
     Fixing it would mean adding a custom `merge` option to the persist config, which is out of
     the scoped "DEFAULT_SETTINGS + import-merge default only" edit to `store.ts` — flagging
     rather than doing it.

4. **SettingsSheet "Rest alerts" row**
   - Reused the existing `Segmented<'on'|'off'>` control (same visual pattern as Units/Week
     start/Rest timer) rather than building a new switch component — `Segmented.tsx` isn't in
     this lane's file ownership and has no `disabled` support, so:
     - **Supported**: Segmented On/Off + micro helper copy "Notifies you when rest ends, if the
       app is in the background." Turning it on calls `requestNotifyPermission()`; granted →
       `updateSettings({ restAlerts: true })`; denied → toggle stays off, inline
       `role="status"` note "Notifications are blocked for this app." appears.
     - **Unsupported** (`canNotify()` false, which is jsdom's default and covers browsers without
       `Notification`): renders a static `.settings-static` "Off" row (reusing the same
       non-interactive pattern already used for the "Weekly goal" row) + "Not supported on this
       device." — the closest equivalent to a "disabled control" without adding a `disabled` prop
       to a shared component outside this lane's ownership.

5. **`ActiveSessionGate.tsx` gate wiring**
   - Rest-zero effect (the existing buzz path — stale timers still short-circuit via
     `isStaleRest` before reaching this branch, verified by a new test): additionally calls
     `notifyRestDone(active.dayType, nextUndoneExerciseName(active))` when
     `settings.restAlerts && notificationPermission() === 'granted' && document.visibilityState
     === 'hidden'`. `nextUndoneExerciseName` is a small local helper — first exercise in the
     lineup with any unlogged set — deliberately trivial per the task brief.
   - New effect: `setWorkoutBadge()`/`clearWorkoutBadge()` keyed off session presence
     (`active != null`), with the badge cleared on unmount too.
   - New effect: while minimized, `document.title = "{mm:ss} · {Push} — Workout"`; restored to
     plain `"Workout"` (matching `index.html`'s `<title>`) when not minimized/no session, and on
     unmount.
   - 8 new gate tests: notification fires only when hidden+enabled+granted (and not on any single
     missing condition, and not on a stale/reload-inherited timer), badge set/cleared across the
     session lifecycle and on unmount, title updates across minimize/restore/unmount.

## Platform caveats

- **Dynamic Island / Live Activities are native-only** — out of scope per the product-owner
  decision in TASK.md. The web equivalents delivered here (prominent in-app bar, Notification API,
  Badging API, `document.title`) are the closest cross-platform approximation; none of them can
  render a persistent glanceable countdown outside the browser/PWA chrome the way a Live Activity
  can.
- `Notification`/service-worker notifications and the Badging API (`navigator.setAppBadge`) are
  both unsupported in Firefox and in-browser (non-installed) Safari; both are guarded to no-op
  silently everywhere `notify.ts` is exercised.
- Background notification delivery while fully backgrounded (not just an inactive tab) generally
  requires the PWA to be installed and the browser to keep its service worker alive — best-effort,
  not guaranteed, which is why this is opt-in rather than a default.

## Quality gates

`npm run check`, `npm test` (184 tests, all green), `npm run build` all pass in the worktree.

## Deviations from a literal reading of TASK.md

- Used the existing `Segmented` control instead of a bespoke switch/toggle widget for "Rest
  alerts" (see §4 above) — `Segmented.tsx` is outside this lane's file ownership, and reusing it
  satisfies "same visual pattern as existing rows" more literally than inventing new CSS would.
- Left the rest-bar's `role="status"` announcing on every tick (unchanged from before), relying
  on a prior, already-merged accessibility review's explicit sign-off on that exact pattern,
  rather than re-litigating it in this lane.
- SPEC.md: only the one rest-timer sentence (Active Session section) was updated, as scoped; the
  "Non-goals" line further down still says "notifications" — now only partially true (rest-timer
  alerts are opt-in, not a blanket non-goal) but left untouched since the task named "the one
  sentence" specifically.
