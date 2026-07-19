"use client";

import {
  goalStepFor,
  presetsFor,
  roundToStep,
  suggestedGoalFor,
  unitSuffix,
  type Exercise,
} from "@/lib/exercise";
import type { ExerciseStat } from "@/lib/useExercises";

export function GoalRow({
  exercise,
  stat,
  snoozed,
  onSetGoal,
  onAdjust,
  onRaise,
  onDismissRaise,
}: {
  exercise: Exercise;
  stat: ExerciseStat | undefined;
  snoozed: boolean;
  onSetGoal: (value: number) => void;
  onAdjust: (delta: number) => void;
  onRaise: (newGoal: number) => void;
  onDismissRaise: () => void;
}) {
  const suffix = unitSuffix(exercise.unit);
  const step = goalStepFor(exercise.unit);
  const goal = exercise.goal;
  const hasGoal = goal != null;

  const last7 = stat?.last7 ?? [];
  const done = last7.filter((t) => t > 0);
  const avg = done.length
    ? Math.round(done.reduce((a, b) => a + b, 0) / done.length)
    : null;
  const everLogged = stat?.everLogged ?? false;

  const isNew = !hasGoal && !everLogged;
  const noGoal = !hasGoal && everLogged;

  const hitDays = hasGoal ? last7.filter((t) => t >= goal).length : 0;
  const showRaise = hasGoal && hitDays >= 5 && !snoozed;

  const context = isNew
    ? "New — pick a starting point"
    : noGoal
      ? "No goal set" + (avg != null ? ` · usually ${avg}${suffix}/day` : "")
      : avg != null
        ? `Averaging ${avg}${suffix}/day this week`
        : "Daily goal";

  const prefill =
    done.length >= 3 && avg != null
      ? roundToStep(avg, step)
      : suggestedGoalFor(exercise.name, exercise.unit);

  return (
    <div className="rounded-[22px] bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold">{exercise.name}</div>
          <div className="mt-[3px] text-[11.5px] font-medium text-faint">{context}</div>
        </div>

        {hasGoal ? (
          <div className="flex items-center gap-[9px]">
            <button
              type="button"
              onClick={() => onAdjust(-step)}
              aria-label="Lower goal"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-sunken text-[19px] font-semibold text-faint"
            >
              −
            </button>
            <div className="min-w-[46px] text-center text-[17px] font-extrabold tracking-[-0.01em]">
              {goal}
              {suffix}
            </div>
            <button
              type="button"
              onClick={() => onAdjust(step)}
              aria-label="Raise goal"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent-tint text-[19px] font-semibold text-accent-deep"
            >
              +
            </button>
          </div>
        ) : isNew ? (
          <div className="flex gap-1.5">
            {presetsFor(exercise.name, exercise.unit).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => onSetGoal(p)}
                className="rounded-xl bg-accent-tint px-3 py-2 text-[13px] font-bold text-accent-deep"
              >
                {p}
                {suffix}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSetGoal(prefill)}
            className="rounded-[13px] px-[15px] py-[9px] text-[12.5px] font-bold text-subtle shadow-[inset_0_0_0_1.5px_#dcdfe4]"
          >
            Set goal
          </button>
        )}
      </div>

      {showRaise && (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-[14px] bg-accent-tint px-3 py-[11px]">
          <div className="flex-1 text-[12px] font-semibold text-accent-deep">
            You&apos;ve hit this most days lately — try {goal + step}
            {suffix}?
          </div>
          <button
            type="button"
            onClick={() => onRaise(goal + step)}
            className="rounded-full bg-accent px-[13px] py-[7px] text-[12px] font-bold text-white"
          >
            Raise
          </button>
          <button
            type="button"
            onClick={onDismissRaise}
            aria-label="Dismiss"
            className="px-1 py-0.5 text-[13px] text-accent-muted"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
