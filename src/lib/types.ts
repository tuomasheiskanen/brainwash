/** The loggable drink types. */
export type DrinkKey = "can" | "canIV" | "pint" | "pintIV" | "wine" | "winePlus";

export type Drinks = Record<DrinkKey, number>;

/**
 * Equipment-free bodyweight exercises, tracked as a total rep count per day.
 */
export type ExerciseKey =
  | "pushups"
  | "squats"
  | "situps"
  | "lunges"
  | "burpees"
  | "jumpingJacks";

export type Exercises = Record<ExerciseKey, number>;

/**
 * One calendar day of logging. `date` is the local-time ISO date (YYYY-MM-DD)
 * and is the primary key. All fields are optional/empty until the user logs
 * something — a day with no interaction is simply absent from storage.
 */
export interface DayEntry {
  date: string;
  mood: number | null; // 1..5
  moodTags: string[];
  note: string;
  drinks: Drinks;
  exercises: Exercises;
  sleepHours: number | null;
  sleepQuality: number | null; // 1..5
  updatedAt: number;
}

export function emptyDrinks(): Drinks {
  return { can: 0, canIV: 0, pint: 0, pintIV: 0, wine: 0, winePlus: 0 };
}

export function emptyExercises(): Exercises {
  return {
    pushups: 0,
    squats: 0,
    situps: 0,
    lunges: 0,
    burpees: 0,
    jumpingJacks: 0,
  };
}

export function emptyEntry(date: string): DayEntry {
  return {
    date,
    mood: null,
    moodTags: [],
    note: "",
    drinks: emptyDrinks(),
    exercises: emptyExercises(),
    sleepHours: null,
    sleepQuality: null,
    updatedAt: 0,
  };
}

/** A day "has data" worth persisting / showing a dot for in history. */
export function hasData(entry: DayEntry): boolean {
  const drinkTotal =
    entry.drinks.can +
    entry.drinks.pint +
    entry.drinks.wine +
    entry.drinks.winePlus;
  const repTotal = Object.values(entry.exercises).reduce((a, b) => a + b, 0);
  return (
    entry.mood !== null ||
    entry.moodTags.length > 0 ||
    entry.note.trim() !== "" ||
    drinkTotal > 0 ||
    repTotal > 0 ||
    entry.sleepHours !== null ||
    entry.sleepQuality !== null
  );
}
