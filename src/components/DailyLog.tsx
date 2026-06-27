"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, todayISO } from "@/lib/date";
import { useDay } from "@/lib/useDay";
import type { DrinkKey } from "@/lib/types";
import { DateHeader } from "./DateHeader";
import { MoodSection } from "./MoodSection";
import { AlcoholSection } from "./AlcoholSection";
import { SleepSection } from "./SleepSection";
import { AccountControl } from "./AccountControl";

export function DailyLog() {
  const params = useSearchParams();
  const paramDate = params.get("date");
  const [date, setDate] = useState(paramDate ?? todayISO());

  // Follow a ?date= deep link from the History screen.
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

  const incDrink = (key: DrinkKey) =>
    update((p) => ({ ...p, drinks: { ...p.drinks, [key]: p.drinks[key] + 1 } }));

  const decDrink = (key: DrinkKey) =>
    update((p) => ({
      ...p,
      drinks: { ...p.drinks, [key]: Math.max(0, p.drinks[key] - 1) },
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

      <MoodSection
        mood={entry.mood}
        tags={entry.moodTags}
        note={entry.note}
        onMood={setMood}
        onToggleTag={toggleTag}
        onNote={(note) => update({ note })}
      />

      <AlcoholSection drinks={entry.drinks} onInc={incDrink} onDec={decDrink} />

      <SleepSection
        hours={entry.sleepHours}
        quality={entry.sleepQuality}
        onHours={(h) => update({ sleepHours: h })}
        onQuality={setQuality}
      />
    </div>
  );
}
