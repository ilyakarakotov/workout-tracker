# Forge — Product Spec

**Forge** is a mobile-first, offline, installable PWA for lifters running a **Push / Pull / Legs split performed twice weekly** (6 sessions/week). Local-only persistence, no accounts, no backend. Deployed publicly on GitHub Pages.

Tagline: *Push. Pull. Legs. Twice.*

## Product principles

1. **Logging a set is the atomic joy.** One tap marks a set done (pre-filled from last time). Adjusting weight/reps is two taps away, never buried.
2. **Consistency is the hero stat.** The week is a 6-segment ring. Filling it should feel like closing a game level. Strength progress (PRs, charts) is the long arc; the ring is the daily dopamine.
3. **Zero ceremony.** No onboarding, no accounts, no config required. Open → sensible PPL plan is already there → Start Push.
4. **Everything editable.** Templates, exercises, sets, reps, weights, past sessions — all editable, nothing sacred.
5. **Own your data.** JSON export/import in Settings.

## Core loop

Open app → Today shows the weekly ring + "Next up: **Push**" (auto-rotation P→P→L based on last logged session) → Start → log sets (tap to complete, prefilled from last session's actuals) → Finish → summary with ring segment filling, volume, any PRs → back to Today.

## Views (bottom tab bar, 4 tabs)

### 1. Today (home)
- Header: app wordmark, settings gear (opens Settings sheet).
- **Weekly ring**: large 6-segment ring, `n/6` in the center, segments colored by the day type performed; turns gold when 6/6.
- **Streak flame**: count of consecutive *perfect weeks* (weeks meeting the 6-session goal). Current week doesn't break the streak until it ends.
- **Next up card**: suggested day type (next in rotation), template preview (exercise names), big Start button in the day-type accent. Secondary: "or start Push / Pull / Legs" quick-picks.
- If a session is in progress: card becomes "Resume workout".
- This week strip: Mon–Sun dots showing logged day types.

### 2. Active Session (full-screen takeover, not a tab)
- Opens on Start/Resume; persists across reloads (in-progress session is stored).
- Header: day-type badge + elapsed time + close (cancel with confirm) .
- One card per exercise: set rows `weight × reps` with a big check target. Tap the check → set completed (with prefilled values), spring animation + `navigator.vibrate(10)`.
- Tap the weight/reps of a row → inline steppers (weight ±2.5 kg / ±5 lb, reps ±1).
- **Rest timer**: after completing a set, a countdown chip (default 90 s) appears at the bottom; tap to skip. Pure in-app (no notifications).
- Add set (per exercise), add exercise (from library), remove via row swipe-or-menu.
- **Finish** → summary sheet: duration, total volume, sets completed, PRs hit (gold badges), ring animates +1 segment. "Done" returns to Today.

### 3. History
- Month calendar: each day shows dots colored by the day type(s) logged; today outlined. Month navigation.
- Below: reverse-chronological session list (day type badge, date, exercise count, volume, PR marker).
- Tap session → detail sheet: all exercises/sets, editable (weights/reps, delete session with confirm).

### 4. Progress
- **PR cards**: per key exercise — best e1RM (Epley: `w × (1 + reps/30)`), best weight, date.
- **Exercise chart**: exercise picker → line chart of best e1RM per session over time; secondary series: session volume for that exercise.
- **Weekly volume bars**: last 8–12 weeks total volume.
- **Consistency stats**: sessions this week / total sessions / perfect weeks count / current streak.

### 5. Plan (4th tab)
- Three template cards: Push, Pull, Legs (accent-colored).
- Edit template: add/remove/reorder exercises (up/down controls are fine), per exercise: number of sets, target reps, target weight.
- Exercise library management: rename, add custom exercises, delete (blocked/warned if used in history — history keeps its own name snapshot? No: sessions reference exerciseId; deletion from library is allowed but history rendering falls back to a stored name snapshot on the session exercise).

### Settings (sheet from Today)
- Units kg/lb (display + steppers; stored values are unit-agnostic numbers, converting display only — v1: store numbers as-entered and treat the unit as a global display label; switching units does NOT convert stored numbers, we show a note).
- Week starts on Monday/Sunday.
- Weekly goal fixed at 6 (shown, not editable in v1 — it's the product identity).
- Rest timer duration (30/60/90/120/180 s, or off).
- Export data (downloads JSON), Import data (file picker, validates, replaces after confirm), Reset all data (double confirm).

## Consistency system (the hero)

- **Week** = weekStartsOn (default Monday). **Goal = 6 sessions.**
- Weekly ring: 6 segments; each completed session fills the next segment in its day-type color; 6/6 flips the ring gold with a small celebration.
- **Perfect week** = week with ≥ 6 sessions. **Streak** = consecutive perfect weeks counting backwards from the last *completed* week; the in-progress week extends it live if it reaches 6.
- Calendar dots + week strip reinforce the pattern (P coral, P azure, L lime — see DESIGN.md).
- PR moments get gold badges in the finish summary and history.

## Data model (canonical — see `src/lib/types.ts`)

- `DayType = 'push' | 'pull' | 'legs'`
- `Exercise { id, name, dayType?: DayType }` — library entry.
- `Template { dayType, exercises: TemplateExercise[] }`, `TemplateExercise { exerciseId, sets: TargetSet[] }`, `TargetSet { reps, weight }`
- `Session { id, dayType, startedAt, endedAt, exercises: SessionExercise[] }`
- `SessionExercise { exerciseId, name, sets: LoggedSet[] }` (name snapshot for resilience)
- `LoggedSet { weight, reps, done }`
- `Settings { unit, weekStartsOn, weeklyGoal: 6, restSeconds }`
- Active session = `Session` without `endedAt`, held in `activeSession`, persisted.

Prefill rule: starting a session builds sets from the template; per-exercise targets are overridden by that exercise's actuals from the most recent session containing it (progressive overload memory).

## Seed data (first run)

Sensible 2× PPL defaults (editable):
- **Push**: Bench Press 4×[8 @ 60], Overhead Press 3×[10 @ 30], Incline Dumbbell Press 3×[10 @ 22.5], Cable Fly 3×[12 @ 15], Triceps Pushdown 3×[12 @ 25], Lateral Raise 3×[15 @ 7.5]
- **Pull**: Deadlift 3×[5 @ 100], Pull-Up 3×[8 @ 0], Barbell Row 4×[8 @ 50], Face Pull 3×[15 @ 15], Barbell Curl 3×[10 @ 25], Hammer Curl 3×[12 @ 12.5]
- **Legs**: Squat 4×[6 @ 80], Romanian Deadlift 3×[10 @ 60], Leg Press 3×[10 @ 120], Leg Curl 3×[12 @ 35], Calf Raise 4×[15 @ 40], Plank 3×[60 @ 0] (reps = seconds)

## Non-goals (v1)

Accounts/sync, exercise illustrations, warm-up calculators, supersets, notifications, Apple Watch, A/B template variants, unit conversion of stored data.

## Tech

Vite + React 18 + TypeScript, zustand (persist → localStorage `forge.v1`), hand-rolled SVG charts, vanilla CSS with design tokens, vite-plugin-pwa (autoUpdate, full precache), vitest for logic tests, GitHub Actions → GitHub Pages at `/workout-tracker/`.

## Quality bar

- Installable (manifest + SW + icons incl. maskable), fully offline after first load.
- Works one-handed at 390×844; tap targets ≥ 44 px; respects safe-area insets.
- Accessible: semantic buttons, labels on inputs, visible focus, contrast ≥ 4.5:1 for text, `prefers-reduced-motion` honored.
- No layout shift on data load; empty states designed, never blank screens.
