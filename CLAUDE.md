# Forge — contributor conventions (all agents read this)

You are an executor agent on a shared repo. The orchestrator owns architecture. Follow these rules strictly.

## Ground rules

1. **Read `SPEC.md` and `DESIGN.md` first.** Your feature brief is in `TASK.md` at the repo root of your worktree.
2. **Stay in your lane.** Only create/edit files inside the directories your TASK.md assigns to you. Never edit: `src/App.tsx`, `src/main.tsx`, `src/store/*`, `src/lib/*`, `src/styles/*`, `package.json`, vite config, CI. If you believe a shared file must change, write the request into `HANDOFF.md` at repo root and work around it locally.
3. **No new dependencies.** Everything you need exists (react, zustand, the store, shared components). Charts are hand-rolled SVG.
4. **Use the store, don't reinvent it.** All state and actions live in `src/store/store.ts` (`useStore`). Derived stats helpers are in `src/lib/stats.ts`, date math in `src/lib/dates.ts`. Read them before writing UI.
5. **Use design tokens.** Only `var(--…)` colors/radii from `src/styles/tokens.css`. Component classes `.card`, `.btn`, `.btn-ghost`, `.label` etc. from `global.css`. Feature-specific CSS goes in a `.css` file inside your feature dir, imported by your view. Prefix your classes with your feature name (e.g. `.hist-…`) to avoid collisions.
6. **Mobile-first, accessible.** 390px design width, 44px tap targets, real `<button>`s, labels on inputs, visible focus, `prefers-reduced-motion` respected. Numbers get `tabular-nums`.
7. **Quality gates before you finish:** `npm run check` (typecheck), `npm test`, `npm run build` must all pass. Add vitest tests for any non-trivial logic you write.
8. **Commit** all work to your branch with clear messages. Do not push, do not merge, do not touch other branches.
9. When done, write a short summary (what you built, decisions, anything left) into `HANDOFF.md` and make a final commit.

## Store cheat sheet

`useStore(s => …)` — state: `exercises`, `templates`, `sessions`, `activeSession`, `settings`.
Actions (all on the store): `startSession(dayType)`, `resumeSession()`… see `src/store/store.ts` for the full typed list; selectors in `src/store/selectors.ts` (e.g. `selectNextDayType`, `selectWeekSessions`, `selectPRs`).

## Voice & polish

Copy is short and calm (see DESIGN.md "Voice"). Design empty states. Animate the moments that matter (completion, ring fill) — nothing else.
