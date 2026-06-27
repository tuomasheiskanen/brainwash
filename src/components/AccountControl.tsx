"use client";

import { useState } from "react";
import { useAuth } from "./Providers";
import { useSyncStatus } from "@/lib/useSyncStatus";
import type { SyncPhase } from "@/lib/sync";

function CloudIcon({ phase, color }: { phase: SyncPhase; color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18 h9 a3.5 3.5 0 0 0 .3 -7 a5 5 0 0 0 -9.6 -1.4 A3.8 3.8 0 0 0 7 18 Z" />
      {phase === "synced" && <path d="M9.5 13.5 l1.8 1.8 l3.2 -3.6" stroke={color} />}
      {(phase === "offline" || phase === "error") && <path d="M4 4 L20 20" stroke={color} />}
    </svg>
  );
}

function labelFor(phase: SyncPhase, pending: number): string {
  switch (phase) {
    case "syncing":
      return "Syncing…";
    case "synced":
      return pending > 0 ? `${pending} to sync` : "Synced";
    case "offline":
      return pending > 0 ? `Offline · ${pending}` : "Offline";
    case "error":
      return "Sync issue";
    default:
      return "Sync";
  }
}

function relTime(ts: number | null): string {
  if (!ts) return "";
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/**
 * The cloud/sync pill shown on each screen. Only renders for a signed-in user
 * (the app is gated behind sign-in; renders nothing when Supabase is
 * unconfigured). Tapping it opens the account/sync sheet.
 */
export function AccountControl() {
  const { configured, session, signOut, syncNow } = useAuth();
  const status = useSyncStatus();
  const [open, setOpen] = useState(false);

  if (!configured || !session) return null;

  const color = status.phase === "synced" ? "#0f766e" : "#9ca3af";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sync and account"
        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-chip"
      >
        <CloudIcon phase={status.phase} color={color} />
        <span
          className="text-[11px] font-bold"
          style={{ color: status.phase === "synced" ? "#0f766e" : "#6b7280" }}
        >
          {labelFor(status.phase, status.pending)}
        </span>
      </button>

      {open && (
        <AccountSheet
          onClose={() => setOpen(false)}
          email={session.user?.email ?? null}
          lastSyncedAt={status.lastSyncedAt}
          pending={status.pending}
          onSignOut={signOut}
          onSyncNow={syncNow}
        />
      )}
    </>
  );
}

function AccountSheet({
  onClose,
  email,
  lastSyncedAt,
  pending,
  onSignOut,
  onSyncNow,
}: {
  onClose: () => void;
  email: string | null;
  lastSyncedAt: number | null;
  pending: number;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-8 shadow-phone sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line sm:hidden" />

        <div className="mb-1 text-[18px] font-extrabold">Synced</div>
        <div className="mb-5 text-[13px] font-medium text-subtle">
          Signed in as <span className="font-bold text-body">{email}</span>
        </div>
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-surface-sunken px-4 py-3 text-[12.5px] font-semibold text-subtle">
          <span>
            {pending > 0 ? `${pending} change${pending === 1 ? "" : "s"} pending` : "Up to date"}
          </span>
          <span className="text-faint">
            {lastSyncedAt ? `Synced ${relTime(lastSyncedAt)}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSyncNow()}
          className="mb-2.5 w-full rounded-2xl bg-accent-tint py-3 text-[14px] font-bold text-accent-deep"
        >
          Sync now
        </button>
        <button
          type="button"
          onClick={() => onSignOut().then(onClose)}
          className="w-full rounded-2xl bg-surface-field py-3 text-[14px] font-bold text-subtle"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
