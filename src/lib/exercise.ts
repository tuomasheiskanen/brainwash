import { addDays } from "./date";

/** How an exercise is measured. */
export type ExerciseUnit = "reps" | "seconds" | "minutes" | "sets";

/**
 * A tracked exercise. `goal` is an optional persistent daily target (not
 * per-day). `favorite` = shown on the Today grid. Sets themselves live per-day
 * on DayEntry.exerciseSets, keyed by this id.
 */
export interface Exercise {
  id: string;
  name: string;
  unit: ExerciseUnit;
  goal: number | null;
  favorite: boolean;
  order: number;
  updatedAt: number;
}

interface UnitConfig {
  defaultGoal: number; // fallback starting goal for a custom exercise
  logStep: number; // amount the "+" quick-add logs
  goalStep: number; // amount +/- adjusts a goal by
}

/** Per-unit defaults so setting a goal / logging never needs a made-up number. */
export const UNIT_CONFIG: Record<ExerciseUnit, UnitConfig> = {
  reps: { defaultGoal: 20, logStep: 10, goalStep: 5 },
  seconds: { defaultGoal: 60, logStep: 30, goalStep: 5 },
  minutes: { defaultGoal: 15, logStep: 5, goalStep: 5 },
  sets: { defaultGoal: 3, logStep: 1, goalStep: 1 },
};

export interface LibraryEntry {
  name: string;
  unit: ExerciseUnit;
  suggestedGoal: number;
  logStep: number;
}

/** Built-in library that powers Add-exercise search + suggested goals. */
export const EXERCISE_LIBRARY: LibraryEntry[] = [
  { name: "Push-ups", unit: "reps", suggestedGoal: 30, logStep: 10 },
  { name: "Squats", unit: "reps", suggestedGoal: 40, logStep: 10 },
  { name: "Plank", unit: "seconds", suggestedGoal: 60, logStep: 30 },
  { name: "Lunges", unit: "reps", suggestedGoal: 20, logStep: 10 },
  { name: "Sit-ups", unit: "reps", suggestedGoal: 30, logStep: 10 },
  { name: "Burpees", unit: "reps", suggestedGoal: 20, logStep: 5 },
  { name: "Pull-ups", unit: "reps", suggestedGoal: 10, logStep: 5 },
  { name: "Running", unit: "minutes", suggestedGoal: 20, logStep: 5 },
  { name: "Cycling", unit: "minutes", suggestedGoal: 30, logStep: 5 },
  { name: "Jumping jacks", unit: "reps", suggestedGoal: 50, logStep: 10 },
];

/** Compact suffix shown next to a number, e.g. 30 -> "30", 60 -> "60s". */
export function unitSuffix(unit: ExerciseUnit): string {
  switch (unit) {
    case "seconds":
      return "s";
    case "minutes":
      return "min";
    default:
      return "";
  }
}

/** Sub-label under the ring when there's no goal, e.g. "sec logged". */
export function loggedSubLabel(unit: ExerciseUnit): string {
  switch (unit) {
    case "seconds":
      return "sec logged";
    case "minutes":
      return "min logged";
    default:
      return "logged";
  }
}

function libraryFor(name: string): LibraryEntry | undefined {
  const n = normalizeName(name);
  return EXERCISE_LIBRARY.find((e) => normalizeName(e.name) === n);
}

/** Quick-add step for an exercise (library-specific, else per-unit default). */
export function logStepFor(ex: Pick<Exercise, "name" | "unit">): number {
  return libraryFor(ex.name)?.logStep ?? UNIT_CONFIG[ex.unit].logStep;
}

/** Suggested starting goal (library value, else per-unit fallback). */
export function suggestedGoalFor(name: string, unit: ExerciseUnit): number {
  return libraryFor(name)?.suggestedGoal ?? UNIT_CONFIG[unit].defaultGoal;
}

/** Amount a goal is adjusted by with +/-. */
export function goalStepFor(unit: ExerciseUnit): number {
  return UNIT_CONFIG[unit].goalStep;
}

/** Round to the nearest step, never below one step. */
export function roundToStep(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

/** Three starting-point presets around the suggested goal, e.g. Pull-ups → 5/10/15. */
export function presetsFor(name: string, unit: ExerciseUnit): number[] {
  const s = suggestedGoalFor(name, unit);
  const step = goalStepFor(unit);
  const raw = [s / 2, s, s * 1.5].map((v) => roundToStep(v, step));
  return [...new Set(raw)].filter((v) => v > 0);
}

export function totalOf(sets: number[] | undefined): number {
  return (sets ?? []).reduce((a, b) => a + b, 0);
}

/** Normalize a name for de-dup / library matching. */
export function normalizeName(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function slugify(name: string): string {
  return normalizeName(name) || "exercise";
}

/**
 * Streak = consecutive days with ≥1 set logged, counted from today if logged
 * today, else from yesterday (so an un-logged morning doesn't drop it). 0 when
 * neither today nor yesterday has data.
 */
export function computeExerciseStreak(logged: Set<string>, today: string): number {
  let cursor = logged.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (logged.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** First-run seed: Push-ups, Squats, Plank, favorited, no goals (P1). */
export function seedExercises(now: number): Exercise[] {
  const defs: Array<Pick<Exercise, "name" | "unit">> = [
    { name: "Push-ups", unit: "reps" },
    { name: "Squats", unit: "reps" },
    { name: "Plank", unit: "seconds" },
  ];
  return defs.map((d, i) => ({
    id: slugify(d.name),
    name: d.name,
    unit: d.unit,
    goal: null,
    favorite: true,
    order: i,
    updatedAt: now,
  }));
}
