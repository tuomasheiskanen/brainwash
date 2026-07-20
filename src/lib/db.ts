import Dexie, { type Table } from "dexie";
import { emptyDrinks, type DayEntry } from "./types";
import type { Exercise } from "./exercise";

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

/** An exercise definition with the same sync flags. */
export interface StoredExercise extends Exercise {
  dirty: number;
  deleted: number;
}

/** Strip the sync flags before handing a record to the UI/domain layer. */
export function toDomain(s: StoredDay): DayEntry {
  const { dirty, deleted, ...entry } = s;
  void dirty;
  void deleted;
  // Backfill fields missing from older records so downstream code never sees
  // `undefined` (drink keys added later, exerciseSets added later).
  return {
    ...entry,
    drinks: { ...emptyDrinks(), ...entry.drinks },
    exerciseSets: entry.exerciseSets ?? {},
  };
}

export function exerciseToDomain(s: StoredExercise): Exercise {
  const { dirty, deleted, ...ex } = s;
  void dirty;
  void deleted;
  return ex;
}

export class HealthDB extends Dexie {
  days!: Table<StoredDay, string>;
  exercises!: Table<StoredExercise, string>;

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
    // v3: add the exercises table. Per-day sets ride on DayEntry.exerciseSets
    // (not indexed), backfilled on read — so `days` needs no schema change.
    this.version(3).stores({
      days: "date, updatedAt, dirty, deleted",
      exercises: "id, order, updatedAt, dirty, deleted",
    });
    // v4: exercise cloud sync arrives. Mark existing exercise data dirty so the
    // first sync uploads what was logged while exercises were local-only.
    this.version(4)
      .stores({
        days: "date, updatedAt, dirty, deleted",
        exercises: "id, order, updatedAt, dirty, deleted",
      })
      .upgrade(async (tx) => {
        await tx
          .table("days")
          .toCollection()
          .modify((d) => {
            const sets = d.exerciseSets ?? {};
            if (Object.values(sets).some((a) => (a as number[]).length > 0)) {
              d.dirty = 1;
            }
          });
        await tx
          .table("exercises")
          .toCollection()
          .modify((e) => {
            e.dirty = 1;
          });
      });
  }
}

export const db = new HealthDB();
