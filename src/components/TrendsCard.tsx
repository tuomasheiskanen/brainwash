"use client";

import { dailyUnits } from "@/lib/config";
import {
  formatMonthTitle,
  formatShortRange,
  todayISO,
  toISODate,
  WEEKDAY_INITIALS,
  weekDates,
} from "@/lib/date";
import type { DayEntry } from "@/lib/types";
import { Card } from "./Card";

type Range = "week" | "month";

interface Bar {
  label: string;
  units: number;
  free: boolean; // tracked day with zero units
  hasUnits: boolean;
}

export function TrendsCard({
  entries,
  range,
  onRange,
  year,
  month0,
}: {
  entries: Map<string, DayEntry>;
  range: Range;
  onRange: (r: Range) => void;
  year: number;
  month0: number;
}) {
  const today = todayISO();

  // A day "counts" only once it's been tracked; alcohol-free = tracked & 0 units.
  const dayInfo = (iso: string): { units: number; tracked: boolean } => {
    const e = entries.get(iso);
    if (!e) return { units: 0, tracked: false };
    return { units: dailyUnits(e.drinks), tracked: true };
  };

  let bars: Bar[];
  let caption: string;
  let freeCaption: string;

  if (range === "week") {
    const isos = weekDates(today);
    bars = isos.map((iso, i) => {
      const { units, tracked } = dayInfo(iso);
      return {
        label: WEEKDAY_INITIALS[i],
        units,
        free: tracked && units === 0,
        hasUnits: tracked && units > 0,
      };
    });
    const free = bars.filter((b) => b.free).length;
    caption = `This week · ${formatShortRange(isos[0], isos[6])}`;
    freeCaption = `${free} alcohol-free ${free === 1 ? "day" : "days"} this week`;
  } else {
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    bars = [];
    let freeDays = 0;
    for (let start = 1; start <= daysInMonth; start += 7) {
      const end = Math.min(start + 6, daysInMonth);
      let sum = 0;
      let trackedInBucket = false;
      for (let d = start; d <= end; d++) {
        const iso = toISODate(new Date(year, month0, d));
        const { units, tracked } = dayInfo(iso);
        if (tracked) {
          trackedInBucket = true;
          sum += units;
          if (units === 0) freeDays++;
        }
      }
      bars.push({
        label: `W${bars.length + 1}`,
        units: sum,
        free: trackedInBucket && sum === 0,
        hasUnits: sum > 0,
      });
    }
    caption = `This month · ${formatMonthTitle(year, month0)}`;
    freeCaption = `${freeDays} alcohol-free ${freeDays === 1 ? "day" : "days"} this month`;
  }

  const max = Math.max(1, ...bars.map((b) => b.units));

  return (
    <Card className="px-4 pb-[14px] pt-[18px]">
      <div className="mx-0.5 mb-1 flex items-center justify-between">
        <div className="text-[13px] font-bold text-body">Alcohol units</div>
        <div className="flex gap-0.5 rounded-full bg-surface-field p-[3px]">
          {(["week", "month"] as Range[]).map((r) => {
            const active = range === r;
            return (
              <button
                type="button"
                key={r}
                onClick={() => onRange(r)}
                className="rounded-full px-[13px] py-[5px] text-[11px] font-bold capitalize"
                style={
                  active
                    ? {
                        background: "#fff",
                        color: "#0f766e",
                        boxShadow: "0 1px 3px rgba(31,41,55,.12)",
                      }
                    : { color: "#9ca3af" }
                }
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-0.5 mb-4 text-[11.5px] font-medium text-faint">{caption}</div>

      {/* Bars */}
      <div className="flex h-32 items-end gap-2 px-0.5">
        {bars.map((bar, i) => {
          const hPct = Math.max(4, Math.round((bar.units / max) * 100));
          return (
            <div
              key={i}
              className="flex h-full flex-1 flex-col items-center justify-end gap-[7px]"
            >
              <div className="flex w-full flex-1 items-end justify-center">
                {bar.free ? (
                  <div className="pb-0.5 text-[13px]">🌿</div>
                ) : bar.hasUnits ? (
                  <div
                    className="w-[62%] max-w-[22px] rounded-md bg-accent"
                    style={{ height: `${hPct}%` }}
                  />
                ) : null}
              </div>
              <div className="text-[10px] font-semibold text-ghost">{bar.label}</div>
            </div>
          );
        })}
      </div>

      {/* Reward stat */}
      <div className="mt-[14px] flex items-center gap-2.5 rounded-[14px] bg-accent-tint px-[14px] py-3">
        <div className="text-[18px]">🌿</div>
        <div className="text-[12.5px] font-bold text-accent-deep">{freeCaption}</div>
      </div>
    </Card>
  );
}
