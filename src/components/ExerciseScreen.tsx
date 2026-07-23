"use client";

import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { addDays, todayISO } from "@/lib/date";
import { totalOf } from "@/lib/exercise";
import { useDay } from "@/lib/useDay";
import { useExercises, useExerciseStreak } from "@/lib/useExercises";
import { DateHeader } from "./DateHeader";
import { ExerciseCard } from "./ExerciseCard";
import { StreakPill } from "./StreakPill";

export function ExerciseScreen() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const params = useSearchParams();
  const paramDate = params.get("date");
  const [date, setDate] = useState(paramDate ?? todayISO());

  // Follow a ?date= deep link if one is present.
  useEffect(() => {
    if (paramDate) setDate(paramDate);
  }, [paramDate]);

  const exercises = useExercises();
  const streak = useExerciseStreak();
  const { entry, update } = useDay(date);

  const isToday = date === todayISO();
  const goPrev = () => setDate((d) => addDays(d, -1));
  const goNext = () => setDate((d) => (d === todayISO() ? d : addDays(d, 1)));

  // Swipe left → next day, swipe right → previous day (can't step past today).
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

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
    <div
      className="touch-pan-y select-none px-5 pb-4 pt-[22px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* header */}
      <div className="mb-[18px] flex items-start justify-between">
        <div className="text-[22px] font-extrabold tracking-[-0.02em]">Activity</div>
        {streak > 0 && isToday && <StreakPill streak={streak} />}
      </div>

      <DateHeader date={date} onPrev={goPrev} onNext={goNext} />

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
                ? `${hitCount} of ${goalCount} goals hit${isToday ? " today" : ""}`
                : "Set goals & manage exercises"}
            </div>
          </div>
          <div className="text-[12px] font-bold text-accent-muted">Activities ›</div>
        </div>
      </Link>
    </div>
  );
}
