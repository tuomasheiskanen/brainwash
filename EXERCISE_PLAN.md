# Exercise feature — implementation spec

Plan for adding an **Exercise** view (main log + goals + management) to Brainwash,
matching the Claude Design canvas and fitting the existing local-first
Next.js + Dexie + Supabase architecture.

- **Design source:** `Brainwash.dc.html` in the Claude Design project
  (`https://claude.ai/design/p/d4155ddf-b0f1-4f26-b1ce-e038044827a8`) — frames:
  Exercise Today, Goals, Exercise empty, Goals empty, Add exercise (search),
  Create exercise, Manage, Delete confirm.
- **Status:** spec locked (all open questions resolved). Not yet implemented.

---

## 1. Overview

A calm, optional exercise tracker. The user keeps a catalog of exercises; a
favorited subset shows on the **Today** grid where they log sets with a quick
`+step` tap. Each exercise may have an **optional** daily goal that drives a
progress ring. Goals are a gentle nudge, never a test. The feature adds a third
bottom-tab (**Today · Exercise · History**).

---

## 2. Screens (from the design)

| Screen | Route | Purpose |
|---|---|---|
| **Exercise Today** | `/exercise` | Streak pill, grid of favorited exercise cards (ring + `+step`), "Add exercise" tile, Today's log (removable set chips), summary strip → Goals |
| **Goals** | `/exercise/goals` | Per-exercise goal rows: stepper (has goal) / preset chips (new) / "Set goal" (none); optional "Raise" nudge |
| **Add exercise — search** | `/exercise/add` | Search over a built-in library; tap `+` to add; "Create "{query}"" when no exact match |
| **Create / Edit exercise** | `/exercise/add/new`, `/exercise/[id]/edit` | Name (+ fuzzy "did you mean?"), unit picker, optional daily goal (prefilled), primary action |
| **Manage** | `/exercise/manage` | Catalog of all exercises; favorite toggle ("In Today"); ⋯ menu → Edit / Delete |
| **Delete confirm** | modal | Destructive bottom sheet: removes the exercise **and all its logged sets**; "Keep it" cancels |
| **Empty states** | — | No exercises (add first) / No goals (goals optional; list exercises with "Set goal") |

---

## 3. Data model

```ts
type ExerciseUnit = "reps" | "seconds" | "minutes" | "sets";

interface Exercise {
  id: string;            // slug/uuid
  name: string;
  unit: ExerciseUnit;
  goal: number | null;   // optional daily target (persistent config, not per-day)
  favorite: boolean;     // true = shown on the Today grid
  order: number;         // manual ordering
  updatedAt: number;
}

// Per-day sets ride on the existing DayEntry, keyed by exercise id.
// Each number is one logged set (reps / seconds / minutes / sets).
interface DayEntry {
  // ...existing mood / drinks / sleep fields...
  exerciseSets: Record<string, number[]>;   // e.g. { pushups: [10,10,10] }
}
```

- **Goal is persistent config** on the `Exercise`, not per day (confirmed from
  the design's `allEx[].goal`).
- **`favorite`** is the "In Today" flag. The Today grid = favorited exercises;
  Manage = the full catalog.
- **Sets are per-day** and sync via `DayEntry` (see §7).

---

## 4. Locked decisions

### 4.1 Favorite vs delete (from the design)
- **Remove from Today = un-favorite.** Non-destructive; the exercise and all its
  history stay in Manage, addable back anytime.
- **Delete = destructive.** Permanently removes the exercise **and cascade-purges
  its sets from every day**. Requires the confirm sheet. This is the one place
  the app intentionally uses a warning/red color (`#c1615f`); everywhere else
  stays calm and non-alarming.

### 4.2 Streak (Q2)
- Count of **consecutive days with ≥1 set logged** (any exercise, any amount).
  Not tied to hitting goals (that would make it a test).
- Counts back from **today if logged today, else from yesterday**, so an
  un-logged morning doesn't show a discouraging drop.
- When the streak is **0, hide the pill** (no "0-day streak").

### 4.3 Raise nudge (Q3)
- Per exercise with a goal: show "try {goal + goalStep}?" when the goal was
  **hit on ≥5 of the last 7 days**.
- Dismiss **snoozes ~14 days** for that exercise (stored per-exercise, e.g.
  `raiseSnoozedUntil`, unlike the design's single global flag).

### 4.4 History integration (Q4)
- **MVP:** a day counts as "logged" for the History **calendar dot** if it has
  mood/alcohol/sleep **or** an exercise set.
- **Deferred:** a dedicated exercise trends chart (keep History uncluttered now).

### 4.5 Goal starting points (low mental effort)
Goals stay optional, but when the user wants one a reasonable number is already
present:
- Every **library** exercise carries a **suggested default goal** (see §5).
- **By-unit fallback** for custom exercises: reps **20** · seconds **60** ·
  minutes **15** · sets **3**.
- **Prefill:**
  - Create form → "Add a daily goal" pre-fills the suggestion (library value else
    fallback); user nudges ± from there.
  - Goals "Set goal" → pre-fills the **trailing-7-day average** (rounded to the
    goal step) once ≥3 days of data exist, else the suggested default.

### 4.6 Quick-add + steps
- **Quick-add log step** (the `+` button) defaults per unit: reps **+10** ·
  seconds **+30** · minutes **+5** · sets **+1** (library may override; matches
  the design's +10 / +30s). Logging an **exact amount** is a deferred secondary
  path.
- **Goal-adjust step:** ±5 for reps/seconds/minutes, ±1 for sets.

### 4.7 Create form details (from the design)
- **Fuzzy de-dup:** on the name field, suggest a close existing/library name
  (normalized string + Levenshtein distance ≤ 2) — "Did you mean Push-ups?".
- **Unit picker:** Reps / Seconds / Minutes / Sets.
- **Optional goal:** skippable; "You can skip this and add one anytime."

---

## 5. Config — exercise library

Static `EXERCISE_LIBRARY` powering search + suggested defaults. Suggested goals
are gentle starting points, not prescriptions.

| Name | Unit | Suggested goal | Log step |
|---|---|---|---|
| Push-ups | reps | 30 | +10 |
| Squats | reps | 40 | +10 |
| Plank | seconds | 60 | +30 |
| Lunges | reps | 20 | +10 |
| Sit-ups | reps | 30 | +10 |
| Burpees | reps | 20 | +5 |
| Pull-ups | reps | 10 | +5 |
| Running | minutes | 20 | +5 |
| Cycling | minutes | 30 | +5 |
| Jumping jacks | reps | 50 | +10 |

**By-unit fallbacks** (custom exercise, no library entry):

| Unit | Default goal | Log step | Goal step |
|---|---|---|---|
| reps | 20 | +10 | 5 |
| seconds | 60 | +30 | 5 |
| minutes | 15 | +5 | 5 |
| sets | 3 | +1 | 1 |

Seed on first run: **Push-ups, Squats, Plank** as favorited (matches the design's
default Today grid).

---

## 6. Derived logic

- `total(id, date) = Σ exerciseSets[id]`
- ring `pct = goal ? min(1, total/goal) : 0`; goal hit = `goal != null && total >= goal`
- `summaryText = "{hit} of {goalCount} goals hit today"` (favorited exercises with goals)
- **streak** — see §4.2
- **weekly average** — mean daily total over the last 7 days (used for goal
  prefill and the Goals "Averaging …/day" context line)
- **raise eligibility** — see §4.3
- **fuzzy match** — normalize (lowercase, strip non-alphanumeric) + Levenshtein ≤ 2

---

## 7. Architecture mapping

### 7.1 Dexie (v3 migration)
- New table **`exercises`**: `id, order, updatedAt, dirty, deleted` (indexes for
  sync + ordering). Stores `Exercise` + sync flags (`dirty`, `deleted`).
- Extend `days`/`DayEntry` with **`exerciseSets`**; upgrade backfills `{}` (same
  pattern as the drinks backfill).
- `toDomain` backfills `exerciseSets: {}` and drops sets for unknown/deleted
  exercise ids on read.

### 7.2 HealthStore interface
Extend (keep storage-swappable):
- `listExercises()`, `addExercise(ex)`, `updateExercise(ex)`,
  `setFavorite(id, bool)`, `setGoal(id, val|null)`, `deleteExercise(id)`
  (cascade-purges sets from all days).
- Set logging goes through the existing day methods (sets live on `DayEntry`):
  `addSet(date, id, amount)`, `removeSet(date, id, index)`.

### 7.3 Supabase (new migration → first real run of the GH Actions auto-deploy)
- New table **`exercises`**: `user_id, id, name, unit, goal, favorite, order,
  deleted, updated_at`, PK `(user_id, id)`, RLS "own rows".
- Add **`exercise_sets jsonb`** to `day_entries` (map `id -> number[]`).
- Ship via `supabase/migrations/…_exercise.sql` and let the CI workflow deploy on
  push to `main`.

### 7.4 Sync (`sync.ts`)
- **Sets** sync for free via `DayEntry` — just add `exercise_sets` to the row
  mapping (push + pull).
- **Exercises** are a new synced entity → add a parallel push/pull with the same
  dirty-flag + last-write-wins-by-`updatedAt` + tombstone approach used for days.
- **Delete** propagates as an exercise tombstone; readers filter unknown ids from
  `exerciseSets` so orphaned sets never surface (cascade purge is best-effort
  locally, tombstone-driven across devices).

### 7.5 Navigation
- TabBar → **3 tabs** (Today · Exercise · History); update both existing screens'
  tab bars too.
- Routes per §2. Add-exercise/Manage/Edit are pushed screens; Delete is a modal
  sheet.

---

## 8. Components

- `ExerciseScreen` (Today) — `StreakPill`, `ExerciseCard` (`ProgressRing` + `+step`),
  add tile, `TodaysLog` (removable chips), summary strip.
- `GoalsScreen` — `GoalRow` (stepper / presets / set-goal modes) + raise nudge.
- `AddExerciseSearch` — search field + library results + create row.
- `ExerciseForm` — create & edit (name + fuzzy suggestion, unit picker, optional goal).
- `ManageScreen` — catalog rows (favorite toggle + ⋯ menu).
- `DeleteExerciseSheet` — destructive confirm.
- Empty states for Today and Goals.
- Reuse: add/remove-set mirrors the alcohol ± pattern; goal stepper mirrors the
  sleep stepper.

---

## 9. Tone / UX constraints (carry over from the app)
- Goals are optional; logging works with zero goals.
- Never alarming or judgmental — no red/warning styling except the **delete**
  confirm (an intentional exception for a destructive action).
- Emoji/rings over bare numbers where it fits; calm teal palette, Figtree.

---

## 10. Phasing

- **P1 — Data + Today (local-first):** types, `config` (library + defaults),
  Dexie v3, `HealthStore` extension; Exercise Today screen (log/remove sets,
  rings, streak); seed Push-ups/Squats/Plank. No goals, no sync.
- **P2 — Goals:** Goals screen (stepper/preset/set-goal + prefill), goal-driven
  rings, summary strip, empty-goals state.
- **P3 — Catalog + management:** Add-exercise search + library, Create/Edit form
  (fuzzy de-dup, unit picker), Manage (favorite toggle), Delete confirm + cascade.
- **P4 — Sync + Supabase:** migration (CI deploy), exercises entity sync,
  `exercise_sets` on `day_entries`.
- **P5 — Polish:** raise nudge, History calendar integration, empty-exercises
  state, exact-amount logging (optional).

---

## 11. Deferred / not in scope now
- Dedicated exercise trends chart in History.
- Logging an exact custom amount (beyond the quick `+step`).
- Reordering exercises via drag (order field exists; UI later).
