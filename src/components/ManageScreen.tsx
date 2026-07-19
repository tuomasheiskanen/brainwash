"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { unitLabel, type Exercise } from "@/lib/exercise";
import { healthStore } from "@/lib/store";
import { useExercises } from "@/lib/useExercises";
import { BackHeader } from "./BackHeader";
import { DeleteConfirmSheet } from "./DeleteConfirmSheet";

export function ManageScreen() {
  const [mounted, setMounted] = useState(false);
  const exercises = useExercises();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted || !exercises) {
    return (
      <div className="px-5 pt-[26px]">
        <div className="mt-10 text-center text-[13px] text-faint">Loading…</div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-4 pt-[26px]">
      <BackHeader title="Manage" href="/exercise" big />
      <div className="mx-1 -mt-3 mb-[18px] text-[13px] font-medium text-faint">
        Everything you&apos;ve ever tracked.
      </div>

      <div className="flex flex-col gap-3">
        {exercises.map((ex) => {
          const label = unitLabel(ex.unit);
          const meta = `${label} · ${ex.goal != null ? `${ex.goal} ${label}/day` : "No goal set"}`;
          const open = openMenu === ex.id;
          return (
            <div key={ex.id} className="rounded-[20px] bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-bold">{ex.name}</div>
                  <div className="mt-[3px] text-[11.5px] font-medium text-faint">{meta}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => healthStore.setExerciseFavorite(ex.id, !ex.favorite)}
                    className="rounded-full px-[13px] py-2 text-[11.5px] font-bold"
                    style={
                      ex.favorite
                        ? { background: "#f0fdfa", color: "#0f766e" }
                        : { background: "#f3f4f6", color: "#6b7280" }
                    }
                  >
                    {ex.favorite ? "In Today ✓" : "Add to Today"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenMenu(open ? null : ex.id)}
                    aria-label="More options"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] font-bold text-faint"
                  >
                    ⋯
                  </button>
                </div>
              </div>

              {open && (
                <div className="mt-3 flex flex-col gap-0.5 border-t border-surface-field pt-3">
                  <Link
                    href={`/exercise/${ex.id}/edit`}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-[13px] font-semibold text-body"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={2}>
                      <path d="M4 20 L4 16 L15 5 L19 9 L8 20 Z" />
                      <path d="M13 7 L17 11" />
                    </svg>
                    Edit name, unit &amp; goal
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleting(ex);
                      setOpenMenu(null);
                    }}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold text-[#a8514f]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bd6a68" strokeWidth={2}>
                      <path d="M5 7 H19 M9 7 V5 H15 V7 M7 7 L8 20 H16 L17 7" />
                    </svg>
                    Delete exercise…
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-3 mt-[18px] text-center text-[11.5px] font-medium leading-[1.5] text-ghost">
        Removing from Today just unfavorites — it stays here to add back anytime.
      </div>

      {deleting && (
        <DeleteConfirmSheet exercise={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
