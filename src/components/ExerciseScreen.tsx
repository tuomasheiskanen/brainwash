"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDayHeader, todayISO } from "@/lib/date";
import { totalOf } from "@/lib/exercise";
import { useDay } from "@/lib/useDay";
import { useExercises, useExerciseStreak } from "@/lib/useExercises";
import { ExerciseCard } from "./ExerciseCard";
import { StreakPill } from "./StreakPill";

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

  const removeLast = (id: string) =>
    update((p) => {
      const arr = [...(p.exerciseSets[id] ?? [])];
      arr.pop();
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
  const withGoals = favorites.filter((e) => e.goal != null);
  const goalCount = withGoals.length;
  const hitCount = withGoals.filter(
    (e) => totalOf(entry.exerciseSets[e.id]) >= (e.goal as number)
  ).length;

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

      {/* exercise grid + add tile */}
      <div className="grid grid-cols-2 gap-3">
        {favorites.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            sets={entry.exerciseSets[ex.id] ?? []}
            onAdd={(amount) => addSet(ex.id, amount)}
            onRemoveLast={() => removeLast(ex.id)}
          />
        ))}
        <Link
          href="/exercise/add"
          className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[#dcdfe4] text-faint"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-field text-[22px]">
            +
          </div>
          <div className="text-[12px] font-bold">Add exercise</div>
        </Link>
      </div>

      {/* summary strip → combined Exercises screen (goals + manage) */}
      <Link href="/exercise/manage" className="mt-[22px] block">
        <div className="flex items-center justify-between rounded-[18px] bg-accent-tint px-[18px] py-[15px]">
          <div className="flex items-center gap-[11px]">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <div className="text-[13.5px] font-bold text-accent-deep">
              {goalCount > 0
                ? `${hitCount} of ${goalCount} goals hit today`
                : "Set goals & manage exercises"}
            </div>
          </div>
          <div className="text-[12px] font-bold text-accent-muted">Exercises ›</div>
        </div>
      </Link>
    </div>
  );
}
