import type { DrinkKey, Drinks, ExerciseKey, Exercises } from "./types";

/**
 * Drink-type configuration. Finnish alcohol "units" per serving live HERE as
 * config (not inlined in UI) so the conversion can be tuned without touching
 * components. Units are computed internally and never shown while logging.
 *
 *   Small can, III beer (330 ml) = 1.0 units
 *   Small can, IV beer  (330 ml) = 1.2 units
 *   Pint, III beer (500 ml)      = 1.5 units
 *   Pint, IV beer  (500 ml)      = 1.8 units
 *   Wine glass (120 ml)          = 1.0 units
 *   Wine larger pour (160 ml)    = 1.3 units
 */
export interface DrinkConfig {
  key: DrinkKey;
  label: string;
  volume: string;
  unitsPerServing: number;
}

export const DRINKS: DrinkConfig[] = [
  { key: "can", label: "III", volume: "330ml", unitsPerServing: 1.0 },
  { key: "canIV", label: "IV", volume: "330ml", unitsPerServing: 1.2 },
  { key: "pint", label: "III", volume: "500ml", unitsPerServing: 1.5 },
  { key: "pintIV", label: "IV", volume: "500ml", unitsPerServing: 1.8 },
  { key: "wine", label: "Wine", volume: "120ml", unitsPerServing: 1.0 },
  { key: "winePlus", label: "Wine+", volume: "160ml", unitsPerServing: 1.3 },
];

/** daily_units = Σ (servings × units_per_serving) */
export function dailyUnits(drinks: Drinks): number {
  return DRINKS.reduce(
    (sum, d) => sum + (drinks[d.key] ?? 0) * d.unitsPerServing,
    0
  );
}

export function totalServings(drinks: Drinks): number {
  return DRINKS.reduce((sum, d) => sum + (drinks[d.key] ?? 0), 0);
}

/**
 * Equipment-free bodyweight exercises. `step` is how many reps one tap adds,
 * tuned per movement so logging a typical set is a single tap (and the same
 * step decrements, for undo). No gear, doable in a living room.
 */
export interface ExerciseConfig {
  key: ExerciseKey;
  label: string;
  emoji: string;
  step: number;
}

export const EXERCISES: ExerciseConfig[] = [
  { key: "pushups", label: "Push-ups", emoji: "💪", step: 5 },
  { key: "squats", label: "Squats", emoji: "🦵", step: 5 },
  { key: "situps", label: "Sit-ups", emoji: "🔥", step: 5 },
  { key: "lunges", label: "Lunges", emoji: "🚶", step: 5 },
  { key: "burpees", label: "Burpees", emoji: "🤸", step: 5 },
  { key: "jumpingJacks", label: "Jumping jacks", emoji: "⭐", step: 10 },
];

/** Total reps logged across all movements for a day. */
export function totalReps(exercises: Exercises): number {
  return EXERCISES.reduce((sum, e) => sum + (exercises[e.key] ?? 0), 0);
}

/** 1–5 mood scale, calm tone, emoji over numbers. */
export interface MoodOption {
  value: number;
  emoji: string;
  label: string;
}

export const MOODS: MoodOption[] = [
  { value: 1, emoji: "😔", label: "Low" },
  { value: 2, emoji: "🙁", label: "Down" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

/** Optional, multi-select mood tags. */
export const MOOD_TAGS: string[] = [
  "calm",
  "content",
  "anxious",
  "irritable",
  "tired",
  "energized",
];

/** Sleep duration input range, in hours. */
export const SLEEP = {
  min: 0,
  max: 12,
  step: 0.5,
  default: 7.5,
};

/** Quality reuses the 1–5 picker pattern. */
export const SLEEP_QUALITY_MAX = 5;
