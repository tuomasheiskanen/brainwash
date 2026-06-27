"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, toDomain } from "./db";
import type { DayEntry } from "./types";

/**
 * Live map of ISO date → entry, kept in sync with IndexedDB. Reads go straight
 * to Dexie here (the reactive layer); writes still flow through HealthStore.
 * Tombstoned (deleted) records are filtered out. Re-runs on any sync write too.
 */
export function useEntriesMap(): Map<string, DayEntry> | undefined {
  return useLiveQuery(async () => {
    const all = await db.days.toArray();
    return new Map(
      all.filter((e) => !e.deleted).map((e) => [e.date, toDomain(e)])
    );
  }, []);
}
