# HANDOFF — Home (Today) redesign + product rename

## What I built

### Part 1 — Rename to "Workout"
- `index.html`: `<title>Workout</title>`, description meta, `apple-mobile-web-app-title` all updated.
- `vite.config.ts`: manifest `name`/`short_name` → `Workout` (description and everything else untouched).
- `package.json`: `"name"` → `"workout"`.
- `TodayView.tsx`: wordmark now renders `WORKOUT`.
- `SettingsSheet.tsx`: export filename `workout-export-<date>.json`, footer "Workout v1 — your data never leaves this device."; test updated to match.
- `SPEC.md` / `DESIGN.md` / `ATTRIBUTIONS.md`: swapped product-name prose ("Forge" → "Workout" in headings, opening description, wordmark spec, Face Pull attribution note). Left the `forge.v1` localStorage key mention in `SPEC.md`'s Tech section alone, as instructed — that's the store lane's concern.

### Part 2 — Month heatmap replaces the weekly ring
- New `src/features/today/monthHeat.ts`: pure `monthHeatCells(year, month, weekStartsOn, sessions, now?)` returning `{ cells, monthLabel, workoutDays }`, plus a small `weekdayInitials(weekStartsOn)` helper for the header row. Each cell carries `key` (ymd), `date`, `inMonth`, `day`, `level` (0/1/2 based on session count that day), `isToday`, `isFuture`. Grid is always week-aligned (multiple of 7), built with `startOfWeek`/`addDays`/`ymd`/`startOfDay` from `src/lib/dates.ts` — written independently of `src/features/history/monthGrid.ts`, not imported across feature dirs.
- New `src/features/today/monthHeat.test.ts`: 10 tests — boundary alignment for weekStartsOn 0 and 1 (July 2026, matching the existing `monthGrid` fixture), a month starting exactly on the week start (June 2026, no leading padding), February both aligned-exact (Sun-start, no padding) and padded (Mon-start), level counting (0/1/2+ sessions same day), out-of-month sessions not counted, today/future flags, and `weekdayInitials` ordering both ways.
- `TodayView.tsx`: removed `WeeklyRing`, `StreakFlame`, `WeekStrip` imports/usage (component files untouched — `SummarySheet` still uses `WeeklyRing`). New heatmap `.card` sits where the ring hero used to be: month label, weekday-initial header row, the grid (empty in-month cells = subtle surface, level 1 = translucent `--ok` green, level 2 = solid `--ok`, today = inset gold ring, future days = dashed hollow outline, out-of-month padding cells invisible), footer line `"{n} workouts this month"` + `" · {streak}-week streak"` when `selectStreak` > 0. "Workouts this month" counts total sessions in the calendar month (not just distinct days), matching the "workout" wording in the brief; the grid's own `aria-label` reports distinct workout *days* (e.g. "July 2026 activity, 5 workout days") since that's what the heatmap itself visualizes.
- Accessibility: grid has `role="grid"` with a summary `aria-label`; each in-month cell is `role="gridcell"` with its own `aria-label` (e.g. "Mon, Jul 13 — 1 workout"); out-of-month padding cells are `aria-hidden`. Verified via Playwright accessibility snapshot.
- Motion: cells fade/scale in on mount via a keyframe animation with a small per-cell stagger (capped at 260ms total), gated by the existing global `prefers-reduced-motion` rule in `global.css` (already zeroes all animation/transition durations app-wide, so no extra media query needed here).
- CSS added to `TodayView.css` under `.today-heat…` prefix; removed the now-unused `.today-hero` rule.

## Decisions / deviations
- No shared-file changes needed or requested — everything fit inside the owned files.
- `workoutsThisMonth` (footer) vs `workoutDays` (grid aria-label) are intentionally different numbers — one counts sessions, the other counts distinct calendar days with ≥1 session — since the brief's example wording for each ("`{n} workouts this month`" vs "`5 workout days`") implied both.
- Verified visually with a live `npm run dev` + Playwright pass at 390×844: rename confirmed in the page `<title>`, heatmap renders correctly for an empty month and (after injecting sample session data into `localStorage` for the QA pass only, not committed) correctly shows level-1/level-2 fills, the gold today ring, and updates the "Next up" rotation and workout count.

## Left for others / nothing outstanding
Nothing left undone from the brief. `npm run check`, `npm test` (64 tests, all green), and `npm run build` all pass.
