"use client";

import { useExercises } from "@/lib/useExercises";
import { BackHeader } from "./BackHeader";
import { ExerciseForm } from "./ExerciseForm";

/** Edit flow: loads the exercise by id from the live list. */
export function EditExerciseForm({ id }: { id: string }) {
  const exercises = useExercises();

  if (!exercises) {
    return (
      <div className="px-5 pt-[22px]">
        <div className="mt-10 text-center text-[13px] text-faint">Loading…</div>
      </div>
    );
  }

  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) {
    return (
      <div className="px-5 pt-[22px]">
        <BackHeader title="Edit exercise" href="/exercise/manage" />
        <div className="mt-10 text-center text-[13px] text-faint">
          That exercise no longer exists.
        </div>
      </div>
    );
  }

  return <ExerciseForm mode="edit" exercise={exercise} />;
}
