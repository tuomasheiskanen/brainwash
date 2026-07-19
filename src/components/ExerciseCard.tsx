"use client";

import {
  logStepFor,
  loggedSubLabel,
  totalOf,
  unitSuffix,
  type Exercise,
} from "@/lib/exercise";
import { ProgressRing } from "./ProgressRing";

/** One exercise on the Today grid: ring (total vs goal) + quick-add button. */
export function ExerciseCard({
  exercise,
  sets,
  onAdd,
}: {
  exercise: Exercise;
  sets: number[];
  onAdd: (amount: number) => void;
}) {
  const total = totalOf(sets);
  const suffix = unitSuffix(exercise.unit);
  const step = logStepFor(exercise);
  const hasGoal = exercise.goal != null;
  const pct = hasGoal ? total / (exercise.goal as number) : 0;
  const sub = hasGoal ? `of ${exercise.goal}${suffix}` : loggedSubLabel(exercise.unit);

  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] bg-surface px-3 pb-3.5 pt-4 shadow-card">
      <div className="text-[13px] font-bold text-body">{exercise.name}</div>
      <div className="relative h-[76px] w-[76px]">
        <ProgressRing pct={pct} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[20px] font-extrabold leading-none">{total}</div>
          <div className="mt-[3px] text-[9.5px] font-semibold text-faint">{sub}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAdd(step)}
        className="w-full rounded-[14px] bg-accent-tint py-[9px] text-[13px] font-bold text-accent-deep"
      >
        +{step}
        {suffix}
      </button>
    </div>
  );
}
