"use client";

import { MOODS, MOOD_TAGS } from "@/lib/config";
import { Card } from "./Card";

export function MoodSection({
  mood,
  tags,
  note,
  onMood,
  onToggleTag,
  onNote,
}: {
  mood: number | null;
  tags: string[];
  note: string;
  onMood: (value: number) => void;
  onToggleTag: (tag: string) => void;
  onNote: (note: string) => void;
}) {
  return (
    <Card className="mb-[14px] px-4 pb-4 pt-[18px]">
      <div className="mx-1 mb-[14px] text-[13px] font-bold tracking-[0.01em] text-body">
        How are you feeling?
      </div>

      {/* 1–5 emoji faces, single select */}
      <div className="flex justify-between gap-1">
        {MOODS.map((m) => {
          const selected = mood === m.value;
          return (
            <button
              type="button"
              key={m.value}
              onClick={() => onMood(m.value)}
              aria-pressed={selected}
              aria-label={m.label}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-2"
              style={
                selected
                  ? { background: "#f0fdfa", boxShadow: "inset 0 0 0 2px #14b8a6" }
                  : undefined
              }
            >
              <span className="text-[26px] leading-none">{m.emoji}</span>
              <span
                className={`text-[10.5px] ${
                  selected ? "font-bold text-accent-deep" : "font-semibold text-faint"
                }`}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Optional multi-select mood tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {MOOD_TAGS.map((tag) => {
          const on = tags.includes(tag);
          return (
            <button
              type="button"
              key={tag}
              onClick={() => onToggleTag(tag)}
              aria-pressed={on}
              className="rounded-full px-[13px] py-[7px] text-[12px] font-semibold"
              style={
                on
                  ? {
                      background: "#f0fdfa",
                      color: "#0f766e",
                      boxShadow: "inset 0 0 0 1.5px #5eead4",
                    }
                  : { background: "#f3f4f6", color: "#6b7280" }
              }
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Optional free-text note */}
      <div className="mt-[14px] flex items-center gap-2 rounded-[14px] bg-surface-sunken px-[14px] py-[11px]">
        <span className="text-[14px] text-faint">✎</span>
        <input
          type="text"
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Add a note…"
          className="w-full bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
        />
      </div>
    </Card>
  );
}
