"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, exerciseToDomain } from "./db";
import { healthStore } from "./store";
import { computeExerciseStreak, type Exercise } from "./exercise";
import { todayISO } from "./date";

/** Live list of all exercises (ordered). Seeds the defaults on first use. */
export function useExercises(): Exercise[] | undefined {
  useEffect(() => {
    void healthStore.ensureSeeded();
  }, []);

  return useLiveQuery(async () => {
    const rows = await db.exercises.toArray();
    return rows
      .filter((r) => !r.deleted)
      .sort((a, b) => a.order - b.order)
      .map(exerciseToDomain);
  }, []);
}

/** Live consecutive-day streak of days with ≥1 set logged. */
export function useExerciseStreak(): number {
  const streak = useLiveQuery(async () => {
    const rows = await db.days.toArray();
    const logged = new Set<string>();
    for (const r of rows) {
      if (r.deleted) continue;
      const sets = r.exerciseSets ?? {};
      if (Object.values(sets).some((arr) => arr.length > 0)) logged.add(r.date);
    }
    return computeExerciseStreak(logged, todayISO());
  }, []);
  return streak ?? 0;
}
