"use client";

import { SLEEP, SLEEP_QUALITY_MAX } from "@/lib/config";
import { Card } from "./Card";

export function SleepSection({
  hours,
  quality,
  onHours,
  onQuality,
}: {
  hours: number | null;
  quality: number | null;
  onHours: (h: number) => void;
  onQuality: (q: number) => void;
}) {
  const value = hours ?? SLEEP.default;
  const pct = ((value - SLEEP.min) / (SLEEP.max - SLEEP.min)) * 100;

  const clamp = (h: number) => Math.min(SLEEP.max, Math.max(SLEEP.min, h));

  return (
    <Card className="px-4 pb-4 pt-[18px]">
      <div className="mx-1 mb-[14px] text-[13px] font-bold text-body">Sleep</div>

      {/* Duration stepper */}
      <div className="mb-2 flex items-center gap-[14px]">
        <button
          type="button"
          aria-label="Less sleep"
          onClick={() => onHours(clamp(value - SLEEP.step))}
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-surface-sunken text-[22px] font-semibold text-faint"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <div className="text-[26px] font-extrabold tracking-[-0.02em]">
            {value % 1 === 0 ? value : value.toFixed(1)}
            <span className="text-[15px] font-semibold text-faint"> h</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="More sleep"
          onClick={() => onHours(clamp(value + SLEEP.step))}
          className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-accent-tint text-[22px] font-semibold text-accent-deep"
        >
          +
        </button>
      </div>

      {/* Slider */}
      <input
        type="range"
        className="sleep-range mx-1.5 mb-[18px] block w-[calc(100%-12px)]"
        min={SLEEP.min}
        max={SLEEP.max}
        step={SLEEP.step}
        value={value}
        onChange={(e) => onHours(Number(e.target.value))}
        aria-label="Sleep duration in hours"
        style={{
          background: `linear-gradient(to right, #14b8a6 ${pct}%, #e5e7eb ${pct}%)`,
        }}
      />

      {/* Quality 1–5 */}
      <div className="flex items-center justify-between border-t border-surface-field pt-4">
        <div className="text-[12.5px] font-semibold text-subtle">
          How rested do you feel?
        </div>
        <div className="flex gap-2">
          {Array.from({ length: SLEEP_QUALITY_MAX }, (_, i) => {
            const v = i + 1;
            const on = quality !== null && v <= quality;
            return (
              <button
                type="button"
                key={v}
                aria-label={`Rested ${v} of ${SLEEP_QUALITY_MAX}`}
                aria-pressed={quality === v}
                onClick={() => onQuality(v)}
                className="h-3.5 w-3.5 rounded-full"
                style={{ background: on ? "#14b8a6" : "#e5e7eb" }}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}
