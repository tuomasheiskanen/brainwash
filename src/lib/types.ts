/** The four loggable drink types. */
export type DrinkKey = "can" | "pint" | "wine" | "winePlus";

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
  updatedAt: number;
}

export function emptyDrinks(): Drinks {
  return { can: 0, pint: 0, wine: 0, winePlus: 0 };
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
  return (
    entry.mood !== null ||
    entry.moodTags.length > 0 ||
    entry.note.trim() !== "" ||
    drinkTotal > 0 ||
    entry.sleepHours !== null ||
    entry.sleepQuality !== null
  );
}
