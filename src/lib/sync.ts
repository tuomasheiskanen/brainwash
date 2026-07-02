import { db, type StoredDay } from "./db";
import { emptyDrinks, emptyExercises } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * Background sync engine: local Dexie ⇆ Supabase `day_entries`.
 *
 * Model: local-first, last-write-wins by `updatedAt` (client clock). Push sends
 * dirty rows up; pull fetches rows changed since a per-user cursor and applies
 * the newer side. Deletes travel as soft-delete tombstones. Single-user across
 * a few devices — not a CRDT; simultaneous edits to the same day on two offline
 * devices resolve to whichever was saved later.
 */

const TABLE = "day_entries";
const EPOCH = "1970-01-01T00:00:00Z";

export type SyncPhase =
  | "disabled" // no Supabase env configured
  | "signedOut"
  | "syncing"
  | "synced"
  | "offline"
  | "error";

export interface SyncStatus {
  phase: SyncPhase;
  lastSyncedAt: number | null;
  pending: number;
}

let status: SyncStatus = {
  phase: isSupabaseConfigured ? "signedOut" : "disabled",
  lastSyncedAt: null,
  pending: 0,
};

const listeners = new Set<() => void>();

function emit(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSync(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function markSignedOut() {
  emit({ phase: "signedOut", lastSyncedAt: null });
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user?.id ?? null;
}

function cursorKey(uid: string) {
  return `bb_sync_cursor_${uid}`;
}

async function pendingCount(): Promise<number> {
  return db.days.where("dirty").equals(1).count();
}

function rowFromStored(uid: string, s: StoredDay) {
  return {
    user_id: uid,
    date: s.date,
    mood: s.mood,
    mood_tags: s.moodTags,
    note: s.note,
    drinks: s.drinks,
    exercises: s.exercises,
    sleep_hours: s.sleepHours,
    sleep_quality: s.sleepQuality,
    deleted: Boolean(s.deleted),
    updated_at: new Date(s.updatedAt).toISOString(),
  };
}

interface RemoteRow {
  date: string;
  mood: number | null;
  mood_tags: string[] | null;
  note: string | null;
  drinks: StoredDay["drinks"] | null;
  exercises: StoredDay["exercises"] | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  deleted: boolean;
  updated_at: string;
}

function storedFromRow(row: RemoteRow): StoredDay {
  return {
    date: row.date,
    mood: row.mood ?? null,
    moodTags: row.mood_tags ?? [],
    note: row.note ?? "",
    drinks: { ...emptyDrinks(), ...(row.drinks ?? {}) },
    exercises: { ...emptyExercises(), ...(row.exercises ?? {}) },
    sleepHours: row.sleep_hours ?? null,
    sleepQuality: row.sleep_quality ?? null,
    updatedAt: new Date(row.updated_at).getTime(),
    dirty: 0,
    deleted: row.deleted ? 1 : 0,
  };
}

/** Push all dirty rows to Supabase; clear the dirty flag on success. */
async function pushDirty(): Promise<boolean> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) return false;

  const dirty = await db.days.where("dirty").equals(1).toArray();
  if (dirty.length === 0) return true;

  const { error } = await sb
    .from(TABLE)
    .upsert(dirty.map((s) => rowFromStored(uid, s)), { onConflict: "user_id,date" });
  if (error) return false;

  // Clear dirty only if the row hasn't changed again since we read it.
  await db.transaction("rw", db.days, async () => {
    for (const s of dirty) {
      const cur = await db.days.get(s.date);
      if (cur && cur.updatedAt === s.updatedAt && cur.dirty === 1) {
        await db.days.update(s.date, { dirty: 0 });
      }
    }
  });
  return true;
}

/** Pull rows changed since the cursor; apply newer-wins; advance the cursor. */
async function pull(): Promise<boolean> {
  const sb = getSupabase();
  const uid = await currentUserId();
  if (!sb || !uid) return false;

  const cursor =
    (typeof localStorage !== "undefined" && localStorage.getItem(cursorKey(uid))) ||
    EPOCH;

  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .gt("updated_at", cursor)
    .order("updated_at", { ascending: true });
  if (error) return false;
  if (!data || data.length === 0) return true;

  let maxCursor = cursor;
  await db.transaction("rw", db.days, async () => {
    for (const row of data as RemoteRow[]) {
      const remote = storedFromRow(row);
      const local = await db.days.get(remote.date);
      // Last-write-wins: only overwrite if remote is strictly newer (or new).
      if (!local || remote.updatedAt > local.updatedAt) {
        await db.days.put(remote);
      }
      if (row.updated_at > maxCursor) maxCursor = row.updated_at;
    }
  });

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(cursorKey(uid), maxCursor);
  }
  return true;
}

let running: Promise<void> | null = null;

/** Push then pull. Coalesces concurrent calls into one in-flight run. */
export function syncNow(): Promise<void> {
  if (running) return running;
  running = (async () => {
    try {
      if (!isSupabaseConfigured) return;
      const uid = await currentUserId();
      if (!uid) {
        emit({ phase: "signedOut", pending: await pendingCount() });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        emit({ phase: "offline", pending: await pendingCount() });
        return;
      }
      emit({ phase: "syncing" });
      const pushed = await pushDirty();
      const pulled = await pull();
      const pending = await pendingCount();
      if (pushed && pulled) {
        emit({ phase: "synced", lastSyncedAt: Date.now(), pending });
      } else {
        emit({ phase: "error", pending });
      }
    } finally {
      running = null;
    }
  })();
  return running;
}

let debounce: ReturnType<typeof setTimeout> | null = null;

/** Called after local writes — debounced background sync. No-op when unconfigured. */
export function scheduleSync() {
  if (!isSupabaseConfigured) return;
  if (typeof window === "undefined") return;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    debounce = null;
    void syncNow();
  }, 1200);
}
