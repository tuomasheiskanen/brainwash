import Dexie, { type Table } from "dexie";
import { emptyDrinks, type DayEntry } from "./types";

/**
 * The on-device record: a DayEntry plus two sync flags.
 *   dirty   = 1  → has local changes not yet pushed to the cloud
 *   deleted = 1  → tombstone (locally removed); kept so the delete can sync,
 *                  and filtered out of every read so the UI never sees it.
 */
export interface StoredDay extends DayEntry {
  dirty: number;
  deleted: number;
}

/** Strip the sync flags before handing a record to the UI/domain layer. */
export function toDomain(s: StoredDay): DayEntry {
  const { dirty, deleted, ...entry } = s;
  void dirty;
  void deleted;
  // Backfill any drink keys missing from older records so the unit math and
  // increment handlers never see `undefined`.
  return { ...entry, drinks: { ...emptyDrinks(), ...entry.drinks } };
}

export class HealthDB extends Dexie {
  days!: Table<StoredDay, string>;

  constructor() {
    super("brainbud-health");
    // v1: original local-only schema.
    this.version(1).stores({ days: "date, updatedAt" });
    // v2: add sync flags. Mark any pre-existing local data dirty so it uploads
    // on first sign-in instead of being stranded on the device.
    this.version(2)
      .stores({ days: "date, updatedAt, dirty, deleted" })
      .upgrade((tx) =>
        tx
          .table("days")
          .toCollection()
          .modify((d) => {
            d.dirty = 1;
            d.deleted = 0;
          })
      );
  }
}

export const db = new HealthDB();
