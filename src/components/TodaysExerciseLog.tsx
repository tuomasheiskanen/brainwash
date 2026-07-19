"use client";

import { totalOf, unitSuffix, type Exercise } from "@/lib/exercise";

/** Today's logged sets per exercise, as removable chips. */
export function TodaysExerciseLog({
  exercises,
  sets,
  onRemove,
}: {
  exercises: Exercise[];
  sets: Record<string, number[]>;
  onRemove: (id: string, index: number) => void;
}) {
  const rows = exercises.filter((ex) => (sets[ex.id]?.length ?? 0) > 0);
  if (rows.length === 0) return null;

  return (
    <>
      <div className="mx-0.5 mb-1.5 text-[12px] font-bold uppercase tracking-[0.04em] text-faint">
        Today&apos;s log
      </div>
      <div className="mb-4 rounded-[22px] bg-surface px-4 py-1 shadow-card">
        {rows.map((ex) => {
          const suffix = unitSuffix(ex.unit);
          const entries = sets[ex.id] ?? [];
          return (
            <div
              key={ex.id}
              className="flex flex-col gap-[9px] border-b border-surface-field py-[13px]"
            >
              <div className="flex items-baseline justify-between">
                <div className="text-[13.5px] font-bold">{ex.name}</div>
                <div className="text-[11.5px] font-semibold text-faint">
                  = {totalOf(entries)}
                  {suffix}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entries.map((value, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => onRemove(ex.id, idx)}
                    className="flex items-center gap-1.5 rounded-full bg-surface-field px-2.5 py-1.5 text-[12px] font-semibold text-subtle"
                  >
                    {value}
                    {suffix}
                    <span className="text-[11px] text-hairline">✕</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <div className="py-3 text-[11px] font-medium text-ghost">
          Tap a set to remove it.
        </div>
      </div>
    </>
  );
}
