/** The loggable drink types. */
export type DrinkKey = "can" | "canIV" | "pint" | "pintIV" | "wine" | "winePlus";

export type Drinks = Record<DrinkKey, number>;

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
  sleepHours: number | null;
  sleepQuality: number | null; // 1..5
  /** Sets logged that day per exercise id (reps/seconds/minutes/sets). */
  exerciseSets: Record<string, number[]>;
  updatedAt: number;
}

export function emptyDrinks(): Drinks {
  return { can: 0, canIV: 0, pint: 0, pintIV: 0, wine: 0, winePlus: 0 };
}

export function emptyEntry(date: string): DayEntry {
  return {
    date,
    mood: null,
    moodTags: [],
    note: "",
    drinks: emptyDrinks(),
    sleepHours: null,
    sleepQuality: null,
    exerciseSets: {},
    updatedAt: 0,
  };
}

/** A day "has data" worth persisting / showing in history. */
export function hasData(entry: DayEntry): boolean {
  const drinkTotal = Object.values(entry.drinks).reduce((a, b) => a + b, 0);
  const exerciseSetCount = Object.values(entry.exerciseSets).reduce(
    (a, arr) => a + arr.length,
    0
  );
  return (
    entry.mood !== null ||
    entry.moodTags.length > 0 ||
    entry.note.trim() !== "" ||
    drinkTotal > 0 ||
    entry.sleepHours !== null ||
    entry.sleepQuality !== null ||
    exerciseSetCount > 0
  );
}
