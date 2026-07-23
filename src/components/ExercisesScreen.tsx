"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { healthStore } from "@/lib/store";
import { goalStepFor, type Exercise } from "@/lib/exercise";
import { useExercises, useExerciseStats } from "@/lib/useExercises";
import { BackHeader } from "./BackHeader";
import { ExerciseRow } from "./ExerciseRow";
import { DeleteConfirmSheet } from "./DeleteConfirmSheet";

const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const snoozeKey = (id: string) => `bb_raise_snooze_${id}`;

/** Combined Exercises screen: goals + favorites + edit/delete in one place. */
export function ExercisesScreen() {
  const [mounted, setMounted] = useState(false);
  const exercises = useExercises();
  const stats = useExerciseStats();
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!exercises) return;
    const now = Date.now();
    const active = new Set<string>();
    for (const ex of exercises) {
      if (Number(localStorage.getItem(snoozeKey(ex.id)) || 0) > now) active.add(ex.id);
    }
    setSnoozed(active);
  }, [exercises]);

  const snooze = (id: string) => {
    localStorage.setItem(snoozeKey(id), String(Date.now() + SNOOZE_MS));
    setSnoozed((s) => new Set(s).add(id));
  };

  const setGoal = (ex: Exercise, value: number) =>
    void healthStore.setExerciseGoal(ex.id, value);
  const adjust = (ex: Exercise, delta: number) => {
    const step = goalStepFor(ex.unit);
    void healthStore.setExerciseGoal(ex.id, Math.max(step, (ex.goal ?? 0) + delta));
  };
  const raise = (ex: Exercise, newGoal: number) => {
    void healthStore.setExerciseGoal(ex.id, newGoal);
    snooze(ex.id);
  };

  if (!mounted || !exercises) {
    return (
      <div className="px-5 pt-[26px]">
        <div className="mt-10 text-center text-[13px] text-faint">Loading…</div>
      </div>
    );
  }

  const anyGoals = exercises.some((e) => e.goal != null);

  return (
    <div className="px-5 pb-4 pt-[26px]">
      <BackHeader title="Activities" href="/exercise" big />
      <div className="mx-1 -mt-3 mb-5 text-[13px] font-medium text-faint">
        Set goals, choose what&apos;s on Today, or edit and remove.
      </div>

      {!anyGoals && (
        <div className="mb-5 rounded-[20px] bg-accent-tint px-[18px] py-4">
          <div className="mb-1 text-[13.5px] font-bold text-accent-deep">
            Goals are optional
          </div>
          <div className="text-[12.5px] font-medium leading-[1.5] text-accent-muted">
            Add one when you&apos;d like a gentle nudge toward a daily number — or just
            keep logging without any.
          </div>
        </div>
      )}

      <Link
        href="/exercise/add?from=manage"
        className="mb-3 flex items-center gap-3 rounded-[18px] border-2 border-dashed border-[#dcdfe4] px-[18px] py-4 text-faint"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-field text-[22px] leading-none">
          +
        </div>
        <div className="text-[13.5px] font-bold">Add exercise</div>
      </Link>

      <div className="flex flex-col gap-3">
        {exercises.map((ex) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            stat={stats?.get(ex.id)}
            snoozed={snoozed.has(ex.id)}
            menuOpen={menuOpen === ex.id}
            onSetGoal={(v) => setGoal(ex, v)}
            onAdjust={(d) => adjust(ex, d)}
            onRaise={(g) => raise(ex, g)}
            onDismissRaise={() => snooze(ex.id)}
            onToggleFavorite={() => healthStore.setExerciseFavorite(ex.id, !ex.favorite)}
            onToggleMenu={() => setMenuOpen((m) => (m === ex.id ? null : ex.id))}
            onAskDelete={() => {
              setDeleting(ex);
              setMenuOpen(null);
            }}
          />
        ))}
      </div>

      <div className="mx-3 mt-5 text-center text-[12px] font-medium leading-[1.5] text-ghost">
        Goals are optional — log without any. Removing from Today just unfavorites;
        nothing is lost.
      </div>

      {deleting && (
        <DeleteConfirmSheet exercise={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
