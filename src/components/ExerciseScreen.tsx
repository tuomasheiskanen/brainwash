"use client";

import { useEffect, useState } from "react";
import { formatDayHeader, todayISO } from "@/lib/date";
import { useDay } from "@/lib/useDay";
import { useExercises, useExerciseStreak } from "@/lib/useExercises";
import { ExerciseCard } from "./ExerciseCard";
import { StreakPill } from "./StreakPill";
import { TodaysExerciseLog } from "./TodaysExerciseLog";

export function ExerciseScreen() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = todayISO();
  const exercises = useExercises();
  const streak = useExerciseStreak();
  const { entry, update } = useDay(today);

  const addSet = (id: string, amount: number) =>
    update((p) => ({
      ...p,
      exerciseSets: { ...p.exerciseSets, [id]: [...(p.exerciseSets[id] ?? []), amount] },
    }));

  const removeSet = (id: string, index: number) =>
    update((p) => {
      const arr = [...(p.exerciseSets[id] ?? [])];
      arr.splice(index, 1);
      return { ...p, exerciseSets: { ...p.exerciseSets, [id]: arr } };
    });

  if (!mounted || !exercises) {
    return (
      <div className="px-5 pt-[22px]">
        <div className="mt-10 text-center text-[13px] text-faint">Loading…</div>
      </div>
    );
  }

  const favorites = exercises.filter((e) => e.favorite);

  return (
    <div className="px-5 pb-4 pt-[22px]">
      {/* header */}
      <div className="mb-[18px] flex items-start justify-between">
        <div>
          <div className="text-[22px] font-extrabold tracking-[-0.02em]">Exercise</div>
          <div className="mt-0.5 text-[12.5px] font-medium text-faint">
            {formatDayHeader(today)}
          </div>
        </div>
        {streak > 0 && <StreakPill streak={streak} />}
      </div>

      {/* exercise grid */}
      {favorites.length > 0 ? (
        <div className="mb-[22px] grid grid-cols-2 gap-3">
          {favorites.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              sets={entry.exerciseSets[ex.id] ?? []}
              onAdd={(amount) => addSet(ex.id, amount)}
            />
          ))}
        </div>
      ) : (
        <div className="mb-[22px] mt-16 text-center text-[13px] text-faint">
          No exercises on Today yet.
        </div>
      )}

      {/* today's log */}
      <TodaysExerciseLog
        exercises={favorites}
        sets={entry.exerciseSets}
        onRemove={removeSet}
      />
    </div>
  );
}
