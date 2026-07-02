"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dailyUnits, totalReps } from "@/lib/config";
import {
  addDays,
  formatMonthTitle,
  formatShortRange,
  fromISODate,
  todayISO,
  toISODate,
} from "@/lib/date";
import type { DayEntry } from "@/lib/types";
import { Card } from "./Card";

type Range = "week" | "month";
type MetricKey = "mood" | "alcohol" | "exercise" | "sleepHours" | "sleepQuality";

interface Metric {
  key: MetricKey;
  label: string; // pill label
  title: string; // card heading
  /** Value for a tracked day, or null if this metric wasn't logged that day. */
  value: (e: DayEntry) => number | null;
  /** How to combine a week's daily values in the month view. */
  aggregate: "sum" | "avg";
  /** Fixed y-axis max for 1–5 scales; null = scale to the data. */
  scaleMax: number | null;
}

const METRICS: Metric[] = [
  {
    key: "mood",
    label: "Mood",
    title: "Mood",
    value: (e) => e.mood,
    aggregate: "avg",
    scaleMax: 5,
  },
  {
    key: "alcohol",
    label: "Alcohol",
    title: "Alcohol units",
    value: (e) => dailyUnits(e.drinks),
    aggregate: "sum",
    scaleMax: null,
  },
  {
    key: "exercise",
    label: "Reps",
    title: "Exercise reps",
    // Null on rest days (no reps) so they don't plot a zero bar.
    value: (e) => totalReps(e.exercises) || null,
    aggregate: "sum",
    scaleMax: null,
  },
  {
    key: "sleepHours",
    label: "Sleep",
    title: "Sleep hours",
    value: (e) => e.sleepHours,
    aggregate: "avg",
    scaleMax: null,
  },
  {
    key: "sleepQuality",
    label: "Quality",
    title: "Sleep quality",
    value: (e) => e.sleepQuality,
    aggregate: "avg",
    scaleMax: 5,
  },
];

// Weekday initials indexed by Date.getDay() (0 = Sunday). The week view is a
// rolling 7-day window, so labels follow each date's real weekday.
const DOW_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

interface Bar {
  label: string;
  value: number | null;
  iso?: string; // present (and clickable) in the week view
  isToday?: boolean;
  future?: boolean;
  trend?: number | null; // 7-day rolling average anchored on this day (week view)
}

export function TrendsCard({ entries }: { entries: Map<string, DayEntry> }) {
  const router = useRouter();
  const today = todayISO();

  const [metricKey, setMetricKey] = useState<MetricKey>("mood");
  const [range, setRange] = useState<Range>("week");
  // A single anchor date drives navigation: its week in week view, its month in
  // month view.
  const [anchor, setAnchor] = useState<string>(() => todayISO());

  const metric = METRICS.find((m) => m.key === metricKey)!;
  const anchorDate = fromISODate(anchor);
  const year = anchorDate.getFullYear();
  const month0 = anchorDate.getMonth();

  // In week view the anchor is the last day of the rolling 7-day window.
  const shiftWeek = (delta: number) => setAnchor((a) => addDays(a, delta * 7));
  const shiftMonth = (delta: number) => {
    const d = fromISODate(anchor);
    d.setDate(1);
    d.setMonth(d.getMonth() + delta);
    setAnchor(toISODate(d));
  };

  // 7-day rolling average of the metric ending on `endISO` (trailing window,
  // tracked days only). Uses data outside the visible window when needed.
  const trailingAvg = (endISO: string): number | null => {
    const vals: number[] = [];
    for (let k = 0; k < 7; k++) {
      const e = entries.get(addDays(endISO, -k));
      const v = e ? metric.value(e) : null;
      if (v !== null) vals.push(v);
    }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  // Tracked days (with a value for this metric) in the visible range — used for
  // the summary line.
  const rangeValues: number[] = [];
  let freeDays = 0; // alcohol-free days (units === 0)

  let bars: Bar[];
  let caption: string;
  let atLatest: boolean; // hide "next" once we reach the current week/month

  if (range === "week") {
    // Rolling window: the 7 days ending on the anchor (today by default),
    // oldest → newest, so the rightmost bar is the anchor day.
    const isos = Array.from({ length: 7 }, (_, i) => addDays(anchor, i - 6));
    bars = isos.map((iso) => {
      const e = entries.get(iso);
      const v = e ? metric.value(e) : null;
      if (v !== null) {
        rangeValues.push(v);
        if (v === 0) freeDays++;
      }
      return {
        label: DOW_INITIALS[fromISODate(iso).getDay()],
        value: v,
        iso,
        isToday: iso === today,
        future: iso > today,
        trend: trailingAvg(iso),
      };
    });
    caption = formatShortRange(isos[0], isos[6]);
    atLatest = anchor >= today;
  } else {
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    bars = [];
    for (let start = 1; start <= daysInMonth; start += 7) {
      const end = Math.min(start + 6, daysInMonth);
      const vals: number[] = [];
      for (let d = start; d <= end; d++) {
        const iso = toISODate(new Date(year, month0, d));
        const e = entries.get(iso);
        const v = e ? metric.value(e) : null;
        if (v !== null) {
          vals.push(v);
          rangeValues.push(v);
          if (v === 0) freeDays++;
        }
      }
      let bucket: number | null = null;
      if (vals.length) {
        const sum = vals.reduce((a, b) => a + b, 0);
        bucket = metric.aggregate === "sum" ? sum : sum / vals.length;
      }
      bars.push({ label: `W${bars.length + 1}`, value: bucket });
    }
    caption = formatMonthTitle(year, month0);
    atLatest =
      year > new Date(today).getFullYear() ||
      (year === fromISODate(today).getFullYear() &&
        month0 >= fromISODate(today).getMonth());
  }

  const scaleMax =
    metric.scaleMax ??
    Math.max(1, ...bars.map((b) => (b.value === null ? 0 : b.value)));

  // Mean of the visible bars — the flat reference line used in the month view.
  const chartVals = bars.filter((b) => b.value !== null).map((b) => b.value!);
  const avgValue = chartVals.length
    ? chartVals.reduce((a, b) => a + b, 0) / chartVals.length
    : null;
  const avgPct =
    avgValue !== null ? Math.min(100, (avgValue / scaleMax) * 100) : null;

  // Week view: a point per day at its 7-day rolling average (% from the bottom).
  const trendPts = bars.map((b, i) =>
    b.trend == null
      ? null
      : { x: ((i + 0.5) / bars.length) * 100, frac: Math.min(100, (b.trend / scaleMax) * 100) }
  );
  const trendLine = trendPts
    .filter((p): p is { x: number; frac: number } => p !== null)
    .map((p) => `${p.x},${100 - p.frac}`)
    .join(" ");

  const summary = summarize(metric, range, rangeValues, freeDays);
  const navPrev = () => (range === "week" ? shiftWeek(-1) : shiftMonth(-1));
  const navNext = () => (range === "week" ? shiftWeek(1) : shiftMonth(1));

  return (
    <Card className="px-4 pb-[14px] pt-[18px]">
      {/* Title + range toggle */}
      <div className="mx-0.5 mb-3 flex items-center justify-between">
        <div className="text-[13px] font-bold text-body">{metric.title}</div>
        <div className="flex gap-0.5 rounded-full bg-surface-field p-[3px]">
          {(["week", "month"] as Range[]).map((r) => {
            const active = range === r;
            return (
              <button
                type="button"
                key={r}
                onClick={() => setRange(r)}
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

      {/* Metric selector */}
      <div className="mb-3 flex gap-0.5 rounded-full bg-surface-field p-[3px]">
        {METRICS.map((m) => {
          const active = m.key === metricKey;
          return (
            <button
              type="button"
              key={m.key}
              onClick={() => setMetricKey(m.key)}
              className="flex-1 rounded-full py-[6px] text-[11px] font-bold"
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
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Range caption + navigation */}
      <div className="mx-0.5 mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={navPrev}
          aria-label={range === "week" ? "Previous week" : "Previous month"}
          className="text-[17px] text-line"
        >
          ‹
        </button>
        <div className="text-[11.5px] font-semibold text-faint">{caption}</div>
        <button
          type="button"
          onClick={navNext}
          disabled={atLatest}
          aria-label={range === "week" ? "Next week" : "Next month"}
          className="text-[17px]"
          style={{ color: atLatest ? "#d1d5db" : "#b6bcc4" }}
        >
          ›
        </button>
      </div>

      {/* Bars, overlaid with a rolling-average line (week) or a flat mean line
          (month). */}
      <div className="relative flex h-32 items-end gap-2 px-0.5">
        {range === "week"
          ? trendLine && (
              <>
                <svg
                  className="pointer-events-none absolute inset-0 z-10 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points={trendLine}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                {trendPts.map((p, i) =>
                  p ? (
                    <div
                      key={`pt-${i}`}
                      className="pointer-events-none absolute z-20 h-1.5 w-1.5 rounded-full"
                      style={{
                        left: `${p.x}%`,
                        bottom: `${p.frac}%`,
                        transform: "translate(-50%, 50%)",
                        background: "#0f766e",
                      }}
                    />
                  ) : null
                )}
              </>
            )
          : avgPct !== null && (
              <div
                className="pointer-events-none absolute inset-x-0.5 z-10"
                style={{ bottom: `${avgPct}%` }}
              >
                <div
                  className="relative border-t border-dashed"
                  style={{ borderColor: "#0f766e" }}
                >
                  <span
                    className="absolute right-0 -top-[9px] rounded bg-white/85 px-1 text-[9px] font-bold"
                    style={{ color: "#0f766e" }}
                  >
                    avg {avgValue!.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
        {bars.map((bar, i) => {
          const present = bar.value !== null;
          const isFree = metric.key === "alcohol" && bar.value === 0;
          const hPct = present
            ? Math.max(6, Math.round((bar.value! / scaleMax) * 100))
            : 0;

          const inner = isFree ? (
            <div className="pb-0.5 text-[13px]">🌿</div>
          ) : present ? (
            <div
              className="w-[62%] max-w-[22px] rounded-md"
              style={{
                height: `${hPct}%`,
                background: bar.isToday ? "#0f766e" : "#14b8a6",
              }}
            />
          ) : null;

          const clickable = range === "week" && bar.iso && !bar.future;
          const cls = "flex h-full flex-1 items-end justify-center";

          return clickable ? (
            <button
              type="button"
              key={i}
              onClick={() => router.push(`/?date=${bar.iso}`)}
              aria-label={`View ${bar.iso}`}
              className={cls}
            >
              {inner}
            </button>
          ) : (
            <div
              key={i}
              className={cls}
              style={{ opacity: bar.future ? 0.5 : 1 }}
            >
              {inner}
            </div>
          );
        })}
      </div>

      {/* Bar labels */}
      <div className="mt-[7px] flex gap-2 px-0.5">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] font-semibold"
            style={{ color: bar.isToday ? "#0f766e" : "#b6bcc4" }}
          >
            {bar.label}
          </div>
        ))}
      </div>

      {/* Legend for the rolling-average line */}
      {range === "week" && trendLine && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[9.5px] font-semibold text-faint">
          <span
            className="inline-block h-[2px] w-4 rounded-full"
            style={{ background: "#0f766e" }}
          />
          7-day rolling average
        </div>
      )}

      {/* Summary stat */}
      <div className="mt-[14px] flex items-center gap-2.5 rounded-[14px] bg-accent-tint px-[14px] py-3">
        <div className="text-[18px]">{summary.icon}</div>
        <div className="text-[12.5px] font-bold text-accent-deep">
          {summary.text}
        </div>
      </div>
    </Card>
  );
}

function summarize(
  metric: Metric,
  range: Range,
  values: number[],
  freeDays: number
): { icon: string; text: string } {
  const span = range === "week" ? "in the past week" : "this month";
  if (values.length === 0) {
    return { icon: "🌿", text: `No ${metric.label.toLowerCase()} logged ${span}` };
  }
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  switch (metric.key) {
    case "alcohol":
      return {
        icon: "🌿",
        text: `${freeDays} alcohol-free ${freeDays === 1 ? "day" : "days"} ${span}`,
      };
    case "exercise": {
      const active = values.length; // rest days are null, so all values are > 0
      return {
        icon: "💪",
        text: `${active} active ${active === 1 ? "day" : "days"} ${span}`,
      };
    }
    case "mood":
      return { icon: "🙂", text: `Average mood ${avg.toFixed(1)} / 5 ${span}` };
    case "sleepHours":
      return { icon: "😴", text: `Average ${avg.toFixed(1)} h sleep ${span}` };
    case "sleepQuality":
      return { icon: "🌙", text: `Average quality ${avg.toFixed(1)} / 5 ${span}` };
  }
}
