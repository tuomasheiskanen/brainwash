"use client";

import { EXERCISES, totalReps } from "@/lib/config";
import type { Exercises, ExerciseKey } from "@/lib/types";
import { Card } from "./Card";
import { RepTile } from "./RepTile";

export function ExerciseSection({
  exercises,
  onInc,
  onDec,
}: {
  exercises: Exercises;
  onInc: (key: ExerciseKey, step: number) => void;
  onDec: (key: ExerciseKey, step: number) => void;
}) {
  const reps = totalReps(exercises);
  const moved = reps > 0;
  const kinds = EXERCISES.filter((e) => exercises[e.key] > 0).length;
  const summary = `${reps} ${reps === 1 ? "rep" : "reps"} · ${kinds} ${
    kinds === 1 ? "move" : "moves"
  }`;

  return (
    <Card className="mb-[14px] px-4 pb-[14px] pt-[18px]">
      <div className="mx-1 mb-[14px] flex items-baseline justify-between">
        <div className="text-[13px] font-bold text-body">Movement</div>
        {moved ? (
          <div className="text-[11.5px] font-semibold text-faint">{summary}</div>
        ) : (
          <div className="text-[11.5px] font-medium text-ghost">No equipment needed</div>
        )}
      </div>

      <div className="grid grid-cols-[78px_78px] justify-center gap-x-3 gap-y-4">
        {EXERCISES.map((e) => (
          <RepTile
            key={e.key}
            emoji={e.emoji}
            label={e.label}
            step={e.step}
            count={exercises[e.key]}
            onInc={() => onInc(e.key, e.step)}
            onDec={() => onDec(e.key, e.step)}
          />
        ))}
      </div>

      {moved && (
        <div className="mt-[14px] flex items-center gap-2.5 rounded-[14px] bg-accent-tint px-[14px] py-3">
          <div className="text-[20px]">💪</div>
          <div>
            <div className="text-[12.5px] font-bold text-accent-deep">You moved today</div>
            <div className="mt-px text-[11px] font-medium text-accent-muted">
              {reps} reps in — nice work.
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
