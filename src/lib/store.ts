import { db, toDomain } from "./db";
import { scheduleSync } from "./sync";
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
}

export const healthStore: HealthStore = new DexieHealthStore();
