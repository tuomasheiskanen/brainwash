"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, todayISO } from "@/lib/date";
import { useDay } from "@/lib/useDay";
import type { DrinkKey } from "@/lib/types";
import { DateHeader } from "./DateHeader";
import { AlcoholSection } from "./AlcoholSection";
import { AccountControl } from "./AccountControl";

export function AlcoholScreen() {
  const params = useSearchParams();
  const paramDate = params.get("date");
  const [date, setDate] = useState(paramDate ?? todayISO());

  useEffect(() => {
    if (paramDate) setDate(paramDate);
  }, [paramDate]);

  const { entry, update } = useDay(date);

  const incDrink = (key: DrinkKey) =>
    update((p) => ({ ...p, drinks: { ...p.drinks, [key]: p.drinks[key] + 1 } }));

  const decDrink = (key: DrinkKey) =>
    update((p) => ({
      ...p,
      drinks: { ...p.drinks, [key]: Math.max(0, p.drinks[key] - 1) },
    }));

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

      <AlcoholSection drinks={entry.drinks} onInc={incDrink} onDec={decDrink} />
    </div>
  );
}
