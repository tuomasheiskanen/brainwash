import type { DrinkKey, Drinks } from "./types";

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
