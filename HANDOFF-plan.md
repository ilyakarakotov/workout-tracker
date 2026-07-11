# HANDOFF — Plan (Plan view + Settings sheet)

## What was built

### `src/features/plan/`
- **PlanView.tsx** — header + three `TemplateCard`s (push/pull/legs, accordion, one open at a time) + "Manage library" ghost button opening `LibrarySheet`.
- **TemplateCard.tsx** — collapsed: badge, "N exercises · M sets", exercise names preview. Expanded: per-exercise rows with name, "N × reps @ weight" summary, move up/down, remove (confirm), and three `NumberStepper`s (sets / reps / weight — reps & weight apply to all sets of that exercise via a loop over `updateTemplateSet`; sets count diffs to `addTemplateSet`/`removeTemplateSet`). Weight step is 2.5 kg / 5 lb per `settings.unit`. "+ Add exercise" opens `AddExerciseSheet`. Empty state per template.
- **AddExerciseSheet.tsx** — bottom sheet: inline "New exercise…" form (`addExercise` → `addTemplateExercise`), library grouped by day type (matching day first) via `groupExercisesByDayType`, exercises already in the template are filtered out live.
- **LibrarySheet.tsx** — all exercises grouped by day type; pencil → inline rename form (`renameExercise`); trash → `confirm()` ("History keeps its logged data.") → `deleteExercise`.
- **planHelpers.ts** — pure, unit-tested: `totalSets`, `formatSetSummary`, `groupExercisesByDayType`.
- **PlanView.css** — all classes prefixed `plan-`, plus a small `.sr-only` utility.

### `src/features/settings/`
- **SettingsSheet.tsx** — Units / Week starts on / Weekly goal (static row) / Rest timer (0/30/60/90/120/180s) sections via a local `Segmented` control; Export JSON (Blob download `forge-export-YYYY-MM-DD.json`); Import JSON (hidden file input, `confirm()` before replacing, inline success/error message from `importData`'s `.ok`/`.error`); Reset everything (`.btn-danger`, double `confirm()`, `resetAll()` + closes sheet). Footer micro-copy.
- **Segmented.tsx** — small generic `role="group"` pill-button control, `aria-pressed` per option. Reused for all three segmented rows in Settings.
- **SettingsSheet.test.tsx** — RTL tests: renders all sections, unit/week-start/rest-timer toggles hit the store, reset requires two `confirm()`s and is abortable.

## Decisions
- Confirms use native `confirm()` (remove exercise from template, delete from library, replace-on-import, double reset) — kept it lightweight per "calm and reversible", no new confirm-dialog component needed.
- Exercise row shows the *first* set's reps/weight as the editable value, per TASK.md ("if sets differ, show the first set's values").
- Bumped `NumberStepper` caps beyond the seed data: reps max 300 (accommodates timed holds like Plank, where reps = seconds) and weight max 1000 (headroom above the store's raw clamp isn't needed, just past typical leg-press weight).
- `groupExercisesByDayType` puts the requested day type first, then the other two in canonical order, then an "Other" bucket for exercises with no `dayType`, and drops empty groups — used by both the add-exercise picker and the library sheet.
- Settings' `.sr-only` and Plan's `.sr-only` are duplicated (small, feature-local) rather than sharing a cross-feature import, per the "stay in your lane" rule.

## Verified
- `npm run check`, `npm test` (37 tests, incl. 9 new `planHelpers` tests + 7 new `SettingsSheet` tests), `npm run build` all green.
- Manually drove PlanView in a real browser at 390×844 (Playwright): expand/collapse, sets/reps/weight steppers, add a new exercise (custom + from library), remove/rename/delete in the library sheet including the native confirm dialogs, no console errors/warnings.
- Could not drive `SettingsSheet` in-browser since it isn't wired to the Today header gear yet (that's owned by the "session"/Today executor per SPEC.md) — covered by RTL interaction tests instead, which render the real component tree and assert on store state after clicks.

## Nothing left / no cross-feature requests
Store already exposed every action needed; no changes requested to shared files.
