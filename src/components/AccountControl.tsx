"use client";

import { useState } from "react";
import { useAuth } from "./Providers";
import { useSyncStatus } from "@/lib/useSyncStatus";
import type { SyncPhase } from "@/lib/sync";

function CloudIcon({ phase, color }: { phase: SyncPhase; color: string }) {
  const base = (
    <path d="M7 18 h9 a3.5 3.5 0 0 0 .3 -7 a5 5 0 0 0 -9.6 -1.4 A3.8 3.8 0 0 0 7 18 Z" />
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {base}
      {phase === "synced" && <path d="M9.5 13.5 l1.8 1.8 l3.2 -3.6" stroke={color} />}
      {(phase === "offline" || phase === "signedOut" || phase === "error") && (
        <path d="M4 4 L20 20" stroke={color} />
      )}
    </svg>
  );
}

function labelFor(phase: SyncPhase, signedIn: boolean, pending: number): string {
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
      return signedIn ? "Sync" : "Sign in";
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
 * The cloud/sync pill shown on each screen. Renders nothing when Supabase isn't
 * configured (pure local mode). Tapping it opens a sign-in / account sheet.
 */
export function AccountControl() {
  const { configured, session, signIn, signOut, syncNow } = useAuth();
  const status = useSyncStatus();
  const [open, setOpen] = useState(false);

  if (!configured) return null;

  const signedIn = Boolean(session);
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
          {labelFor(status.phase, signedIn, status.pending)}
        </span>
      </button>

      {open && (
        <AccountSheet
          onClose={() => setOpen(false)}
          signedIn={signedIn}
          email={session?.user?.email ?? null}
          lastSyncedAt={status.lastSyncedAt}
          pending={status.pending}
          onSignIn={signIn}
          onSignOut={signOut}
          onSyncNow={syncNow}
        />
      )}
    </>
  );
}

function AccountSheet({
  onClose,
  signedIn,
  email,
  lastSyncedAt,
  pending,
  onSignIn,
  onSignOut,
  onSyncNow,
}: {
  onClose: () => void;
  signedIn: boolean;
  email: string | null;
  lastSyncedAt: number | null;
  pending: number;
  onSignIn: (email: string) => Promise<string | null>;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const addr = value.trim();
    if (!addr) return;
    setBusy(true);
    setError(null);
    const err = await onSignIn(addr);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

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

        {!signedIn ? (
          sent ? (
            <div className="text-center">
              <div className="mb-3 text-[34px]">✉️</div>
              <div className="mb-1 text-[17px] font-extrabold">Check your email</div>
              <div className="mb-6 text-[13px] font-medium text-subtle">
                We sent a sign-in link to{" "}
                <span className="font-bold text-body">{value.trim()}</span>. Open it on
                this device to finish.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-surface-field py-3 text-[14px] font-bold text-body"
              >
                Done
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-1 text-[18px] font-extrabold">Sign in to sync</div>
              <div className="mb-5 text-[13px] font-medium text-subtle">
                Back up your log and keep it in sync across devices. We&apos;ll email
                you a magic link — no password.
              </div>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@email.com"
                className="mb-3 w-full rounded-2xl bg-surface-sunken px-4 py-3.5 text-[14px] text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
              {error && (
                <div className="mb-3 text-[12px] font-semibold text-subtle">{error}</div>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={busy || !value.trim()}
                className="w-full rounded-2xl bg-accent py-3.5 text-[14px] font-bold text-white disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send magic link"}
              </button>
              <div className="mt-4 text-center text-[11.5px] font-medium text-faint">
                Your data stays on this device until you sign in.
              </div>
            </div>
          )
        ) : (
          <div>
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
        )}
      </div>
    </div>
  );
}
