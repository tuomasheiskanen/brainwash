"use client";

import { useEffect, useState } from "react";
import { healthStore } from "@/lib/store";
import type { Exercise } from "@/lib/exercise";

export function DeleteConfirmSheet({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    healthStore.countExerciseEntries(exercise.id).then(setCount);
  }, [exercise.id]);

  const del = async () => {
    setBusy(true);
    await healthStore.deleteExercise(exercise.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] rounded-t-[28px] bg-white px-[22px] pb-[30px] pt-[26px] shadow-phone sm:rounded-[28px]"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line sm:hidden" />

        <div className="mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#fbeeee]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bd6a68" strokeWidth={2}>
            <path d="M5 7 H19 M9 7 V5 H15 V7 M7 7 L8 20 H16 L17 7" />
          </svg>
        </div>

        <div className="mb-2.5 text-[19px] font-extrabold tracking-[-0.01em]">
          Delete {exercise.name}?
        </div>
        <div className="mb-6 text-[14px] font-medium leading-[1.55] text-subtle">
          This permanently removes{" "}
          <span className="font-bold text-body">{exercise.name}</span>
          {count != null && count > 0 && (
            <>
              {" "}
              and its{" "}
              <span className="font-bold text-body">
                {count} logged {count === 1 ? "entry" : "entries"}
              </span>
            </>
          )}
          . This can&apos;t be undone.
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={del}
            disabled={busy}
            className="rounded-2xl bg-[#c1615f] py-[15px] text-center text-[15px] font-bold text-white disabled:opacity-60"
          >
            Delete exercise
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-surface-field py-[15px] text-center text-[15px] font-bold text-body"
          >
            Keep it
          </button>
        </div>

        <div className="mt-4 text-center text-[12px] font-medium leading-[1.5] text-ghost">
          Just want it off Today? Use the{" "}
          <span className="font-bold text-faint">Add to Today</span> toggle instead —
          nothing is lost.
        </div>
      </div>
    </div>
  );
}
