# Brainwash — project guide

A calm, mobile-first **PWA** for daily self-tracking: mood, sleep, alcohol, and
exercise. Single-user, **local-first**, privacy-minded, non-judgmental tone (no
red/alarming UI except the one destructive delete confirm). Imported from a
Claude Design mockup and built out in phases.

- **Live:** deployed on Vercel behind a custom domain (auto-deploys on push to `main`).
- **Repo:** `github.com/tuomasheiskanen/brainwash` (note: repo name differs from the
  local folder `BrainBud`).
- **Design source:** Claude Design project "Brainwash"
  (`https://claude.ai/design/p/d4155ddf-b0f1-4f26-b1ce-e038044827a8`, file
  `Brainwash.dc.html`) — the visual reference; keep new UI faithful to it.

## Stack

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS v3** — palette/tokens in `tailwind.config.ts` (teal accent
  `#14b8a6`/`#0f766e`, Figtree font). Prefer semantic tokens (`bg-accent-tint`,
  `text-faint`, `rounded-card`, `shadow-card`) over raw hex.
- **Dexie.js** over IndexedDB — on-device store (offline)
- **Supabase** (Postgres + Auth) — cloud sync backend
- **PWA** — `public/manifest.webmanifest` + `public/sw.js`, installable, offline

## Architecture (important)

**Local-first with background sync.** The UI only ever talks to Dexie; all reads
are instant and work offline. Writes mark rows *dirty* and a debounced engine
syncs to Supabase in the background. Cloud is a replica, not a dependency.

- **`src/lib/store.ts`** — `HealthStore` interface (the only data API the UI
  uses) + its Dexie implementation `healthStore`. Swap this to change backends.
- **`src/lib/db.ts`** — Dexie schema (currently **v4**). Two tables: `days`
  (keyed by ISO date) and `exercises` (keyed by slug id). Each stored record
  carries `dirty` (0/1) + `deleted` (0/1 tombstone). `toDomain()`/
  `exerciseToDomain()` strip those and backfill missing fields (drink keys,
  `exerciseSets`) so old records never surface `undefined`. **Add a new
  `.version(n)` when changing schema or needing a data migration.**
- **`src/lib/sync.ts`** — the engine. Push dirty → pull-since-cursor, **last-write-
  wins by `updatedAt`** (client clock), soft-delete **tombstones**. Separate
  cursors per entity (`days`, `exercises`) in localStorage. `scheduleSync()` is
  called after writes (debounced 1.2s); `syncNow()` runs on sign-in, reconnect,
  and tab focus. It is a no-op unless Supabase env is configured.
- **`src/lib/supabase.ts`** — lazy browser client; `isSupabaseConfigured` gates
  everything. With no env keys the app is pure local-only (auth gate falls
  through, sync disabled).
- **Auth gate:** `src/components/Providers.tsx` (AuthProvider, magic-link) +
  `AuthGate.tsx`. When configured, the whole app is gated behind magic-link
  sign-in (`LandingPage.tsx`); a splash covers session resolution.

## Data model (`src/lib/types.ts`, `src/lib/exercise.ts`)

- **`DayEntry`** (per calendar day): `mood`, `moodTags[]`, `note`, `drinks`
  (`{can,canIV,pint,pintIV,wine,winePlus}`), `sleepHours`, `sleepQuality`,
  `exerciseSets` (`{ exerciseId: number[] }` — sets logged that day), `updatedAt`.
  `hasData()` decides if a day is worth persisting; empty days are tombstoned.
- **`Exercise`** (persistent config, not per-day): `id` (slug), `name`,
  `unit` (`reps|seconds|minutes|sets`), `goal|null`, `favorite` ("In Today"),
  `order`, `updatedAt`. Sets live per-day on `DayEntry.exerciseSets`.
  Helpers in `exercise.ts`: library/defaults, `suggestedGoalFor`, `logStepFor`,
  `goalStepFor`, `presetsFor`, `fuzzySuggest` (Levenshtein dedup),
  `computeExerciseStreak`. Alcohol unit config is in `src/lib/config.ts`
  (Finnish units, computed internally, never shown as math while logging).

## Screens, routes, navigation

Bottom tab bar (`TabBar.tsx`), 4 tabs: **Today · Alcohol · Exercise · Trends**.

| Route | Screen | Notes |
|---|---|---|
| `/` | `DailyLog` | Sleep + Mood (date nav for backfill) |
| `/alcohol` | `AlcoholScreen` | Drink tiles (`AlcoholSection`/`DrinkIcon`), date nav |
| `/exercise` | `ExerciseScreen` | Today grid: rings (`ProgressRing`), quick-add, streak; summary strip + add tile |
| `/exercise/manage` | `ExercisesScreen` | **Combined goals + manage** (per-row: goal control, favorite, ⋯ Edit/Delete). `/exercise/goals` redirects here |
| `/exercise/add`, `/add/new`, `/[id]/edit` | search / create / edit | `AddExerciseSearch`, `ExerciseForm` (via `Create`/`EditExerciseForm` wrappers) |
| `/history` | `History` → `TrendsCard` | **"Trends"** metric chart (route name unchanged). Calendar was removed. |

- Sub-flows (add/manage/edit) use `<AppShell showTabBar={false}>` + `BackHeader`.
- **`TrendsCard`** = metric selector (mood/alcohol/sleep h/quality) × week|month,
  bars + right-side value scale; **tap a bar to reveal its value** (no routing);
  **swipe left/right** to page. The **rolling average line is alcohol-only**
  (21-day in week, flat mean in month); tapping an alcohol bar also shows `avg`.

## Supabase + CI migrations

- Schema in `supabase/migrations/*.sql`. Tables: `day_entries`, `exercises`
  (both RLS "own rows" only; anon can read schema but rows are hidden and writes
  rejected). Per-day exercise sets are a `day_entries.exercise_sets jsonb` column.
- **Migrations auto-deploy via GitHub Actions** (`.github/workflows/
  deploy-migrations.yml`) on push to `main` that touches `supabase/migrations/**`.
  Needs repo secrets `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` (already set).
  Project ref: `qgllfglrtwlvarafwxue` (in `supabase/config.toml`).
- **Migration-first rule:** when a code change depends on new columns, ship the
  migration in its **own commit first**, confirm the Actions run is green, then
  push the code — so the app never writes a column that doesn't exist yet.
- Setup details in `SUPABASE_SETUP.md`. Local keys go in `.env.local`
  (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Dev workflow & gotchas

- `npm run dev` (reads `.env.local` at startup — editing env needs a restart).
- **Never run `npm run build` while `npm run dev` is running** — `build`
  overwrites the shared `.next/` and the dev server then 404s its own chunks.
  Kill dev first, or just typecheck.
- **Typecheck without a build:** `npx tsc --noEmit` (safe, doesn't touch `.next`).
- **Service worker only registers in production**; a stale SW from a prior prod
  run can serve old JS in dev (in dev it now auto-unregisters —
  `ServiceWorkerRegistrar.tsx`). On device, **hard-refresh / relaunch the PWA**
  after a deploy to pick up new code.
- **Pure-logic tests:** ad-hoc `tsx` scripts (e.g. run with
  `npx tsx --tsconfig ./tsconfig.json <file>.ts` importing `@/lib/...`). No test
  runner is set up. `node` can't resolve the extensionless `@/` imports — use tsx.
- **Ship loop:** commit → `git push origin main` → Vercel + (if migrations) the
  Actions run deploy. Watch Vercel via the commit's `Vercel` status:
  `gh api repos/tuomasheiskanen/brainwash/commits/<sha>/status`.

## Status & what's next

Mood/sleep/alcohol + full **exercise** feature (log, goals, catalog manage,
delete, **cloud sync**) are all shipped and multi-device. Trends chart reworked
(tap values, scale, swipe, alcohol-only average).

- **Remaining (P5, see `EXERCISE_PLAN.md`):** exercise as a Trends metric; exact-
  amount ("I did 12") logging beyond the fixed `+step`; optional exercise
  reordering UI.
- The `EXERCISE_PLAN.md` file has the full exercise spec + locked design
  decisions (streak/raise/goal-default rules) — read it before extending exercise.
