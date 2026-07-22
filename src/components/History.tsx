"use client";

import { useEffect, useState } from "react";
import { useEntriesMap } from "@/lib/useEntries";
import { TrendsCard } from "./TrendsCard";
import { AccountControl } from "./AccountControl";

export function History() {
  const entries = useEntriesMap();
  const [mounted, setMounted] = useState(false);

  // Gate on client mount: TrendsCard reads the local "today", so rendering it
  // only after mount avoids SSR/hydration drift.
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="px-[22px] pb-4 pt-[26px]">
      <div className="mb-5 flex items-start justify-between">
        <div className="mx-1">
          <div className="mb-1 text-[24px] font-extrabold tracking-[-0.02em]">
            Trends
          </div>
          <div className="text-[13px] font-medium text-faint">
            Tap a bar to see its value.
          </div>
        </div>
        <AccountControl />
      </div>

      {mounted && entries ? (
        <TrendsCard entries={entries} />
      ) : (
        <div className="mx-1 mt-10 text-center text-[13px] text-faint">Loading…</div>
      )}
    </div>
  );
}
