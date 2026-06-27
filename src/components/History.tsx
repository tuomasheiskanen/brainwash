"use client";

import { useEffect, useState } from "react";
import { useEntriesMap } from "@/lib/useEntries";
import { CalendarCard } from "./CalendarCard";
import { TrendsCard } from "./TrendsCard";
import { AccountControl } from "./AccountControl";

export function History() {
  const entries = useEntriesMap();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState({ year: 2000, month0: 0 });
  const [range, setRange] = useState<"week" | "month">("week");

  // Compute the current month on the client only, to avoid SSR/hydration drift.
  useEffect(() => {
    const d = new Date();
    setView({ year: d.getFullYear(), month0: d.getMonth() });
    setMounted(true);
  }, []);

  const prevMonth = () =>
    setView((v) =>
      v.month0 === 0 ? { year: v.year - 1, month0: 11 } : { ...v, month0: v.month0 - 1 }
    );
  const nextMonth = () =>
    setView((v) =>
      v.month0 === 11 ? { year: v.year + 1, month0: 0 } : { ...v, month0: v.month0 + 1 }
    );

  return (
    <div className="px-[22px] pb-4 pt-[26px]">
      <div className="mb-5 flex items-start justify-between">
        <div className="mx-1">
          <div className="mb-1 text-[24px] font-extrabold tracking-[-0.02em]">
            History
          </div>
          <div className="text-[13px] font-medium text-faint">
            Tap any day to view or edit.
          </div>
        </div>
        <AccountControl />
      </div>

      {mounted && entries ? (
        <>
          <CalendarCard
            year={view.year}
            month0={view.month0}
            entries={entries}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
          <TrendsCard
            entries={entries}
            range={range}
            onRange={setRange}
            year={view.year}
            month0={view.month0}
          />
        </>
      ) : (
        <div className="mx-1 mt-10 text-center text-[13px] text-faint">Loading…</div>
      )}
    </div>
  );
}
