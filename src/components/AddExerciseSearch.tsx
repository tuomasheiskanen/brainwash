"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXERCISE_LIBRARY, normalizeName, type ExerciseUnit } from "@/lib/exercise";
import { healthStore } from "@/lib/store";
import { BackHeader } from "./BackHeader";

export function AddExerciseSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const q = query.trim();
  const qn = normalizeName(q);

  const results = EXERCISE_LIBRARY.filter(
    (e) => !qn || normalizeName(e.name).includes(qn)
  );
  const exact = EXERCISE_LIBRARY.some((e) => normalizeName(e.name) === qn);
  const showCreate = q.length > 0 && !exact;

  const addLibrary = async (name: string, unit: ExerciseUnit) => {
    await healthStore.addExercise({ name, unit, goal: null });
    router.push("/exercise");
  };

  return (
    <div className="px-5 pt-[22px]">
      <BackHeader title="Add exercise" href="/exercise" />

      <div className="mb-[18px] flex items-center gap-2.5 rounded-2xl bg-white px-[15px] py-[13px] shadow-card">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21 L16 16" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="w-full bg-transparent text-[14.5px] font-medium text-ink placeholder:text-faint focus:outline-none"
        />
      </div>

      <div className="rounded-[20px] bg-white px-4 shadow-card">
        {results.map((e) => (
          <button
            type="button"
            key={e.name}
            onClick={() => addLibrary(e.name, e.unit)}
            className="flex w-full items-center justify-between border-b border-surface-field py-3.5 text-left"
          >
            <div>
              <div className="text-[14.5px] font-bold">{e.name}</div>
              <div className="mt-0.5 text-[11.5px] font-medium text-faint">
                Tracked in {e.unit}
              </div>
            </div>
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent-tint text-[18px] font-semibold text-accent-deep">
              +
            </div>
          </button>
        ))}

        {showCreate && (
          <button
            type="button"
            onClick={() =>
              router.push(`/exercise/add/new?name=${encodeURIComponent(q)}`)
            }
            className="flex w-full items-center gap-3 py-[15px] text-left"
          >
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-accent-tint text-[17px] font-bold text-accent-deep">
              +
            </div>
            <div className="text-[14px] font-bold text-accent-deep">
              Create &ldquo;{q}&rdquo;
            </div>
          </button>
        )}

        {results.length === 0 && !showCreate && (
          <div className="py-4 text-center text-[12.5px] font-medium text-ghost">
            Start typing to search or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
