"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { healthStore } from "./store";
import { emptyEntry, type DayEntry } from "./types";

type Patch = Partial<DayEntry> | ((prev: DayEntry) => DayEntry);

const PERSIST_DELAY = 400;

/**
 * Loads the entry for `date` and gives back an `update` that mutates local
 * state immediately (snappy UI) while auto-saving to storage on a short debounce
 * — no submit button. Pending writes are flushed when the date changes or the
 * component unmounts so nothing is lost.
 */
export function useDay(date: string) {
  const [entry, setEntry] = useState<DayEntry>(() => emptyEntry(date));
  const [loaded, setLoaded] = useState(false);

  const latest = useRef(entry);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      void healthStore.saveDay(latest.current);
    }
  }, []);

  // Load (and flush any pending write for the previous date) when date changes.
  useEffect(() => {
    let active = true;
    setLoaded(false);
    healthStore.getDay(date).then((stored) => {
      if (!active) return;
      const next = stored ?? emptyEntry(date);
      latest.current = next;
      setEntry(next);
      setLoaded(true);
    });
    return () => {
      active = false;
      flush();
    };
  }, [date, flush]);

  const update = useCallback((patch: Patch) => {
    setEntry((prev) => {
      const next =
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      latest.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        void healthStore.saveDay(latest.current);
      }, PERSIST_DELAY);
      return next;
    });
  }, []);

  return { entry, update, loaded, flush };
}
