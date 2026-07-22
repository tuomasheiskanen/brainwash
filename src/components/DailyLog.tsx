"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, todayISO } from "@/lib/date";
import { useDay } from "@/lib/useDay";
import { DateHeader } from "./DateHeader";
import { MoodSection } from "./MoodSection";
import { SleepSection } from "./SleepSection";
import { AccountControl } from "./AccountControl";

export function DailyLog() {
  const params = useSearchParams();
  const paramDate = params.get("date");
  const [date, setDate] = useState(paramDate ?? todayISO());

  // Follow a ?date= deep link if one is present.
  useEffect(() => {
    if (paramDate) setDate(paramDate);
  }, [paramDate]);

  const { entry, update } = useDay(date);

  const setMood = (value: number) =>
    update((p) => ({ ...p, mood: p.mood === value ? null : value }));

  const toggleTag = (tag: string) =>
    update((p) => ({
      ...p,
      moodTags: p.moodTags.includes(tag)
        ? p.moodTags.filter((t) => t !== tag)
        : [...p.moodTags, tag],
    }));

  const setQuality = (q: number) =>
    update((p) => ({ ...p, sleepQuality: p.sleepQuality === q ? null : q }));

  return (
    <div className="px-[22px] pb-4 pt-[22px]">
      <div className="mb-2 flex justify-end">
        <AccountControl />
      </div>
      <DateHeader
        date={date}
        onPrev={() => setDate((d) => addDays(d, -1))}
        onNext={() => setDate((d) => addDays(d, 1))}
      />

      <SleepSection
        hours={entry.sleepHours}
        quality={entry.sleepQuality}
        onHours={(h) => update({ sleepHours: h })}
        onQuality={setQuality}
      />

      <MoodSection
        mood={entry.mood}
        tags={entry.moodTags}
        note={entry.note}
        onMood={setMood}
        onToggleTag={toggleTag}
        onNote={(note) => update({ note })}
      />
    </div>
  );
}
