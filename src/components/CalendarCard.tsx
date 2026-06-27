"use client";

import { useRouter } from "next/navigation";
import { Card } from "./Card";
import {
  formatMonthTitle,
  monthGrid,
  todayISO,
  WEEKDAY_INITIALS,
} from "@/lib/date";
import { hasData, type DayEntry } from "@/lib/types";

export function CalendarCard({
  year,
  month0,
  entries,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  month0: number;
  entries: Map<string, DayEntry>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const router = useRouter();
  const today = todayISO();
  const cells = monthGrid(year, month0);

  return (
    <Card className="mb-4 px-4 pb-4 pt-[18px]">
      <div className="mx-1 mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          className="text-[17px] text-line"
        >
          ‹
        </button>
        <div className="text-[14px] font-bold">{formatMonthTitle(year, month0)}</div>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          className="text-[17px] text-line"
        >
          ›
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-0.5">
        {WEEKDAY_INITIALS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-hairline">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const isToday = cell.iso === today;
          const entry = entries.get(cell.iso);
          const logged = entry ? hasData(entry) : false;
          const future = cell.iso > today;

          const bg = isToday ? "#14b8a6" : logged ? "#f0fdfa" : "transparent";
          const color = isToday
            ? "#fff"
            : future
              ? "#d1d5db"
              : logged
                ? "#0f766e"
                : "#6b7280";
          const weight = isToday || logged ? 700 : 500;

          return (
            <button
              type="button"
              key={i}
              disabled={future}
              onClick={() => router.push(`/?date=${cell.iso}`)}
              className="relative flex h-[38px] items-center justify-center rounded-xl text-[12.5px]"
              style={{ background: bg, color, fontWeight: weight }}
              aria-label={cell.iso}
            >
              {cell.day}
              {logged && !isToday && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
