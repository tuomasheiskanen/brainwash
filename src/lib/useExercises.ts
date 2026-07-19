"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, exerciseToDomain } from "./db";
import { healthStore } from "./store";
import { computeExerciseStreak, type Exercise } from "./exercise";
import { addDays, todayISO } from "./date";

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

export interface ExerciseStat {
  /** Daily totals for the last 7 days, index 0 = today. */
  last7: number[];
  /** Whether this exercise has ever been logged (used to detect "new"). */
  everLogged: boolean;
}

/** Per-exercise stats for goal context, prefill, and the raise nudge. */
export function useExerciseStats(): Map<string, ExerciseStat> | undefined {
  return useLiveQuery(async () => {
    const rows = await db.days.toArray();
    const last7 = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), -i));
    const dayIndex = new Map(last7.map((d, i) => [d, i]));
    const map = new Map<string, ExerciseStat>();
    const get = (id: string): ExerciseStat => {
      let st = map.get(id);
      if (!st) {
        st = { last7: new Array(7).fill(0), everLogged: false };
        map.set(id, st);
      }
      return st;
    };
    for (const r of rows) {
      if (r.deleted) continue;
      const sets = r.exerciseSets ?? {};
      const i = dayIndex.get(r.date);
      for (const [id, arr] of Object.entries(sets)) {
        if (arr.length === 0) continue;
        const st = get(id);
        st.everLogged = true;
        if (i !== undefined) st.last7[i] += arr.reduce((a, b) => a + b, 0);
      }
    }
    return map;
  }, []);
}
