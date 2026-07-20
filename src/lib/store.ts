import { db, exerciseToDomain, toDomain } from "./db";
import { scheduleSync } from "./sync";
import { seedExercises, slugify, type Exercise, type ExerciseUnit } from "./exercise";
import { hasData, type DayEntry } from "./types";

/**
 * Storage-agnostic data access. The UI depends ONLY on this interface.
 *
 * The implementation is local-first: every read/write hits Dexie/IndexedDB
 * (instant, offline-capable). Writes additionally mark the row "dirty" and kick
 * off a debounced background sync to Supabase — so the cloud is a replica of the
 * local store, not a dependency of it. Swapping in a different backend means
 * swapping the sync layer, not this interface.
 */
export interface HealthStore {
  getDay(date: string): Promise<DayEntry | undefined>;
  /** Upsert a day. If the day has no data, it becomes a tombstone (synced delete). */
  saveDay(entry: DayEntry): Promise<void>;
  deleteDay(date: string): Promise<void>;
  /** Inclusive ISO date range, ascending by date. Excludes tombstones. */
  getRange(startISO: string, endISO: string): Promise<DayEntry[]>;
  getAll(): Promise<DayEntry[]>;

  /** All non-deleted exercises, ordered. */
  listExercises(): Promise<Exercise[]>;
  /** Seed the default exercises once, if none exist yet. */
  ensureSeeded(): Promise<void>;
  /** Set (or clear, with null) an exercise's daily goal. */
  setExerciseGoal(id: string, goal: number | null): Promise<void>;
  /** Create (or re-add/resurrect by slug) an exercise, favorited. Returns its id. */
  addExercise(input: {
    name: string;
    unit: ExerciseUnit;
    goal: number | null;
  }): Promise<string>;
  /** Edit an exercise's name / unit / goal. */
  updateExercise(
    id: string,
    patch: { name?: string; unit?: ExerciseUnit; goal?: number | null }
  ): Promise<void>;
  /** Toggle whether an exercise appears on the Today grid. */
  setExerciseFavorite(id: string, favorite: boolean): Promise<void>;
  /** Permanently delete an exercise and purge its sets from every day. */
  deleteExercise(id: string): Promise<void>;
  /** Total sets ever logged for an exercise (for the delete confirmation). */
  countExerciseEntries(id: string): Promise<number>;
}

class DexieHealthStore implements HealthStore {
  async getDay(date: string): Promise<DayEntry | undefined> {
    const s = await db.days.get(date);
    if (!s || s.deleted) return undefined;
    return toDomain(s);
  }

  async saveDay(entry: DayEntry): Promise<void> {
    const next: DayEntry = { ...entry, updatedAt: Date.now() };
    if (!hasData(next)) {
      // Empty now: tombstone an existing row (so the delete syncs); otherwise
      // there is simply nothing to store.
      const existing = await db.days.get(next.date);
      if (existing && !existing.deleted) {
        await db.days.put({ ...next, dirty: 1, deleted: 1 });
        scheduleSync();
      }
      return;
    }
    await db.days.put({ ...next, dirty: 1, deleted: 0 });
    scheduleSync();
  }

  async deleteDay(date: string): Promise<void> {
    const existing = await db.days.get(date);
    if (!existing || existing.deleted) return;
    await db.days.put({
      ...existing,
      updatedAt: Date.now(),
      dirty: 1,
      deleted: 1,
    });
    scheduleSync();
  }

  async getRange(startISO: string, endISO: string): Promise<DayEntry[]> {
    const rows = await db.days
      .where("date")
      .between(startISO, endISO, true, true)
      .sortBy("date");
    return rows.filter((r) => !r.deleted).map(toDomain);
  }

  async getAll(): Promise<DayEntry[]> {
    const rows = await db.days.orderBy("date").toArray();
    return rows.filter((r) => !r.deleted).map(toDomain);
  }

  async listExercises(): Promise<Exercise[]> {
    const rows = await db.exercises.toArray();
    return rows
      .filter((r) => !r.deleted)
      .sort((a, b) => a.order - b.order)
      .map(exerciseToDomain);
  }

  async ensureSeeded(): Promise<void> {
    if ((await db.exercises.count()) > 0) return;
    const seeds = seedExercises(Date.now()).map((e) => ({
      ...e,
      dirty: 1,
      deleted: 0,
    }));
    // bulkPut keyed by id → idempotent if two callers race.
    await db.exercises.bulkPut(seeds);
  }

  async setExerciseGoal(id: string, goal: number | null): Promise<void> {
    const ex = await db.exercises.get(id);
    if (!ex) return;
    await db.exercises.put({ ...ex, goal, updatedAt: Date.now(), dirty: 1 });
    scheduleSync();
  }

  async addExercise({
    name,
    unit,
    goal,
  }: {
    name: string;
    unit: ExerciseUnit;
    goal: number | null;
  }): Promise<string> {
    const id = slugify(name);
    const now = Date.now();
    const existing = await db.exercises.get(id);
    if (existing) {
      // Same slug already tracked → re-favorite / resurrect rather than dupe.
      await db.exercises.put({
        ...existing,
        name,
        unit,
        goal: goal ?? existing.goal,
        favorite: true,
        deleted: 0,
        dirty: 1,
        updatedAt: now,
      });
      scheduleSync();
      return id;
    }
    const all = await db.exercises.toArray();
    const order = all.reduce((m, e) => Math.max(m, e.order), -1) + 1;
    await db.exercises.put({
      id,
      name,
      unit,
      goal,
      favorite: true,
      order,
      updatedAt: now,
      dirty: 1,
      deleted: 0,
    });
    scheduleSync();
    return id;
  }

  async updateExercise(
    id: string,
    patch: { name?: string; unit?: ExerciseUnit; goal?: number | null }
  ): Promise<void> {
    const ex = await db.exercises.get(id);
    if (!ex) return;
    await db.exercises.put({ ...ex, ...patch, updatedAt: Date.now(), dirty: 1 });
    scheduleSync();
  }

  async setExerciseFavorite(id: string, favorite: boolean): Promise<void> {
    const ex = await db.exercises.get(id);
    if (!ex) return;
    await db.exercises.put({ ...ex, favorite, updatedAt: Date.now(), dirty: 1 });
    scheduleSync();
  }

  async deleteExercise(id: string): Promise<void> {
    const ex = await db.exercises.get(id);
    if (ex && !ex.deleted) {
      await db.exercises.put({ ...ex, deleted: 1, dirty: 1, updatedAt: Date.now() });
    }
    // Purge its sets from every day, marking those days dirty so the purge
    // propagates to the cloud (and thus other devices) on the next sync.
    const days = await db.days.toArray();
    const now = Date.now();
    for (const d of days) {
      if (d.exerciseSets && id in d.exerciseSets) {
        const rest = { ...d.exerciseSets };
        delete rest[id];
        await db.days.update(d.date, { exerciseSets: rest, dirty: 1, updatedAt: now });
      }
    }
    scheduleSync();
  }

  async countExerciseEntries(id: string): Promise<number> {
    const days = await db.days.toArray();
    return days.reduce(
      (n, d) => n + (d.deleted ? 0 : d.exerciseSets?.[id]?.length ?? 0),
      0
    );
  }
}

export const healthStore: HealthStore = new DexieHealthStore();
