"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EXERCISE_LIBRARY,
  fuzzySuggest,
  goalStepFor,
  suggestedGoalFor,
  unitSuffix,
  type Exercise,
  type ExerciseUnit,
} from "@/lib/exercise";
import { healthStore } from "@/lib/store";
import { useExercises } from "@/lib/useExercises";
import { BackHeader } from "./BackHeader";

const UNITS: { key: ExerciseUnit; label: string }[] = [
  { key: "reps", label: "Reps" },
  { key: "seconds", label: "Seconds" },
  { key: "minutes", label: "Minutes" },
  { key: "sets", label: "Sets" },
];

const LABEL = "text-[12px] font-bold uppercase tracking-[0.04em] text-faint";

export function ExerciseForm({
  mode,
  exercise,
  initialName = "",
}: {
  mode: "create" | "edit";
  exercise?: Exercise;
  initialName?: string;
}) {
  const router = useRouter();
  const exercises = useExercises();

  const [name, setName] = useState(exercise?.name ?? initialName);
  const [unit, setUnit] = useState<ExerciseUnit>(exercise?.unit ?? "reps");
  const [goal, setGoal] = useState<number | null>(exercise?.goal ?? null);

  const pool = useMemo(
    () => [
      ...EXERCISE_LIBRARY.map((e) => e.name),
      ...(exercises ?? []).filter((e) => e.id !== exercise?.id).map((e) => e.name),
    ],
    [exercises, exercise?.id]
  );
  const suggestion = fuzzySuggest(name, pool);
  const step = goalStepFor(unit);
  const canSave = name.trim().length > 0;

  const submit = async () => {
    if (!canSave) return;
    if (mode === "edit" && exercise) {
      await healthStore.updateExercise(exercise.id, { name: name.trim(), unit, goal });
      router.push("/exercise/manage");
    } else {
      await healthStore.addExercise({ name: name.trim(), unit, goal });
      router.push("/exercise");
    }
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-4 pt-[22px]">
      <BackHeader
        title={mode === "edit" ? "Edit exercise" : "New exercise"}
        href={mode === "edit" ? "/exercise/manage" : "/exercise/add"}
      />

      {/* name */}
      <div className={`mx-0.5 mb-2 ${LABEL}`}>Name</div>
      <div className="rounded-2xl bg-white px-4 py-3.5 shadow-card">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name"
          className="w-full bg-transparent text-[15px] font-bold text-ink placeholder:text-faint focus:outline-none"
        />
      </div>
      {suggestion && (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-[14px] bg-[#fdf6ec] px-3.5 py-3">
          <div className="flex-1 text-[12px] font-semibold text-[#9a7423]">
            Did you mean <span className="font-extrabold">{suggestion}</span>?
          </div>
          <button
            type="button"
            onClick={() => setName(suggestion)}
            className="rounded-full bg-[#f6ead2] px-3 py-[7px] text-[11.5px] font-bold text-[#8a6a20]"
          >
            Use it
          </button>
        </div>
      )}

      {/* unit */}
      <div className={`mx-0.5 mb-2.5 mt-6 ${LABEL}`}>Unit</div>
      <div className="grid grid-cols-2 gap-2.5">
        {UNITS.map((u) => {
          const active = unit === u.key;
          return (
            <button
              type="button"
              key={u.key}
              onClick={() => setUnit(u.key)}
              className="rounded-2xl py-3.5 text-center text-[14px] font-bold"
              style={
                active
                  ? { background: "#f0fdfa", color: "#0f766e", boxShadow: "inset 0 0 0 2px #14b8a6" }
                  : { background: "#fff", color: "#6b7280", boxShadow: "0 1px 3px rgba(31,41,55,.05)" }
              }
            >
              {u.label}
            </button>
          );
        })}
      </div>

      {/* goal (optional) */}
      <div className="mx-0.5 mb-2.5 mt-6 flex items-baseline justify-between">
        <div className={LABEL}>Daily goal</div>
        <div className="text-[11.5px] font-semibold text-ghost">Optional</div>
      </div>
      {goal != null ? (
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-card">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGoal((g) => Math.max(step, (g ?? 0) - step))}
              aria-label="Lower goal"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-sunken text-[19px] font-semibold text-faint"
            >
              −
            </button>
            <div className="min-w-[56px] text-center text-[18px] font-extrabold">
              {goal}
              {unitSuffix(unit)}
            </div>
            <button
              type="button"
              onClick={() => setGoal((g) => (g ?? 0) + step)}
              aria-label="Raise goal"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent-tint text-[19px] font-semibold text-accent-deep"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => setGoal(null)}
            className="text-[12px] font-bold text-faint"
          >
            Skip
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setGoal(suggestedGoalFor(name || "x", unit))}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-card"
          >
            <div className="text-[13.5px] font-semibold text-subtle">Add a daily goal</div>
            <div className="text-[12px] font-bold text-accent-deep">+ Set</div>
          </button>
          <div className="mx-0.5 mt-2.5 text-[11.5px] font-medium text-ghost">
            You can skip this and add one anytime.
          </div>
        </>
      )}

      <div className="min-h-6 flex-1" />

      <button
        type="button"
        onClick={submit}
        disabled={!canSave}
        className="rounded-2xl bg-accent py-[15px] text-center text-[15px] font-bold text-white disabled:opacity-50"
      >
        {mode === "edit" ? "Save" : "Add to Today"}
      </button>
    </div>
  );
}
