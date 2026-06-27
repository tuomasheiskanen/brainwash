"use client";

import { addDays, formatDayHeader, todayISO } from "@/lib/date";

function relativeLabel(date: string): string {
  const today = todayISO();
  if (date === today) return "Today";
  if (date === addDays(today, -1)) return "Yesterday";
  if (date === addDays(today, 1)) return "Tomorrow";
  return formatDayHeader(date).split(",")[0]; // weekday name
}

/** Date stepper at the top of the Daily Log. Can't step into the future. */
export function DateHeader({
  date,
  onPrev,
  onNext,
}: {
  date: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isToday = date === todayISO();
  const canGoNext = !isToday;

  return (
    <div className="mb-[22px] flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous day"
        className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-[18px] text-faint shadow-chip"
      >
        ‹
      </button>

      <div className="text-center">
        <div className="text-[18px] font-bold tracking-[-0.01em]">
          {formatDayHeader(date)}
        </div>
        <div
          className={`mt-0.5 text-[12px] font-semibold ${
            isToday ? "text-accent" : "text-faint"
          }`}
        >
          {relativeLabel(date)}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next day"
        className={`flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-[18px] shadow-chip ${
          canGoNext ? "text-faint" : "text-line"
        }`}
      >
        ›
      </button>
    </div>
  );
}
