# Forge — Design System

Dark-only v1. The mood: a quiet gym at night — near-black surfaces, iron greys, and one hot ember of color per day type. Numbers are the typography heroes (big, heavy, tabular). Motion is snappy and physical.

## Tokens (canonical: `src/styles/tokens.css`)

### Color
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0C0F` | app background |
| `--surface` | `#15171C` | cards |
| `--surface-2` | `#1D2026` | nested/raised elements, inputs |
| `--hairline` | `#272B33` | borders, dividers |
| `--text` | `#F2F3F5` | primary text |
| `--text-2` | `#9BA1AC` | secondary text |
| `--text-3` | `#5E6470` | muted/disabled |
| `--push` | `#FF6B57` | Push accent (ember coral) |
| `--pull` | `#4DA3FF` | Pull accent (azure) |
| `--legs` | `#8FE388` | Legs accent (lime) |
| `--gold` | `#FFC53D` | streaks, 6/6 ring, PR badges |
| `--danger` | `#FF5C5C` | destructive |
| `--ok` | `#3DD68C` | success/confirm |

Day-type accents also exist as `--push-dim` etc. (18% alpha versions like `rgba(255,107,87,.16)`) for tinted chips/backgrounds. On-accent text is `#0B0C0F` (dark text on accent fills).

### Shape & space
- Radius: `--r-card: 16px`, `--r-control: 12px`, pills `999px`.
- Spacing on a 4px grid; page gutter 16px; card padding 16px.
- Hairline borders `1px solid var(--hairline)` — no drop shadows except sheets (`0 -8px 32px rgba(0,0,0,.5)`).

### Type
- Stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- Numbers always `font-variant-numeric: tabular-nums`.
- Scale: display 34/800 (ring center, PR values), title 20/700, body 15/400, label 13/600 uppercase tracking `.04em` (section headers), micro 12/500.

### Motion
- Standard: 180ms `cubic-bezier(.2,.8,.2,1)`.
- Set-check & ring fill: springy `cubic-bezier(.34,1.56,.64,1)` 300ms scale/stroke animations.
- Everything gated by `@media (prefers-reduced-motion: reduce)` → transitions ~0.
- Haptics: `navigator.vibrate?.(10)` on set complete, `[10,60,20]` on 6/6 & PR.

## Components (shared, in `src/components/`)

- **WeeklyRing** — SVG, 6 arc segments with 6° gaps, stroke-dasharray fill animation, center `n/6` display number. Gold mode at 6/6.
- **StreakFlame** — 🔥-shaped SVG glyph + count, gold; grey at 0.
- **DayTypeBadge** — pill, tinted bg + accent text ("PUSH" / "PULL" / "LEGS").
- **NumberStepper** — `− value +` inline control, 44px targets, press-and-hold repeats.
- **Sheet** — bottom sheet (`role="dialog"`, focus trap, Esc/scrim close, safe-area padding).
- **WeekStrip** — 7 dots labeled M T W T F S S with day-type colored fills.
- Buttons: `.btn` (accent fill, dark text), `.btn-ghost` (hairline), `.btn-danger`. Cards: `.card`.

## Layout

- Mobile-first, max content width 480px centered (desktop shows the phone column on `--bg`).
- Bottom **TabBar**: 4 items (Today ▸ History ▸ Progress ▸ Plan), SVG icons + 11px labels, active = accent `--gold`… no — active = `--text` with 3px gold top indicator; inactive `--text-3`. Height 56px + `env(safe-area-inset-bottom)`.
- Views scroll independently; header content sits under a 12px top safe-area pad.

## Voice

Short, lowercase-calm, zero exclamation inflation. "Push day. Let's go." / "6 of 6 — perfect week." / "New PR — Bench Press 82.5 kg e1RM." Empty states are encouraging and specific ("No sessions yet. Your first push day is one tap away.").

## Icon / brand

Wordmark "FORGE" 800 weight, tracking .08em. App icon: rounded-square `#0B0C0F` bg, gold ember arc (partial ring) + coral spark — see `public/icon.svg` (masters for 192/512/maskable/apple-touch PNGs).
