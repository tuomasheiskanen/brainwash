"use client";

import { useState } from "react";
import { useAuth } from "./Providers";

/**
 * Unauthenticated landing + sign-in. With the hard gate, this is the only thing
 * a signed-out user can see — magic-link sign-in is the way in. Calm, on-brand.
 */
export function LandingPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const addr = email.trim();
    if (!addr) return;
    setBusy(true);
    setError(null);
    const err = await signIn(addr);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-sunken px-6 py-10">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="mb-9 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-tint text-[32px] shadow-card">
            🌿
          </div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">
            Brainwash
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-subtle">
            A calm, private log for mood, alcohol, and sleep.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="rounded-card bg-surface p-6 shadow-card">
          {sent ? (
            <div className="text-center">
              <div className="mb-3 text-[34px]">✉️</div>
              <div className="mb-1 text-[17px] font-extrabold text-ink">
                Check your email
              </div>
              <div className="text-[13px] font-medium text-subtle">
                We sent a sign-in link to{" "}
                <span className="font-bold text-body">{email.trim()}</span>. Open it
                on this device to continue.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="mt-6 text-[12.5px] font-bold text-accent-deep"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-1 text-[16px] font-extrabold text-ink">
                Sign in to begin
              </div>
              <div className="mb-5 text-[13px] font-medium text-subtle">
                We&apos;ll email you a magic link — no password to remember.
              </div>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@email.com"
                className="mb-3 w-full rounded-2xl bg-surface-sunken px-4 py-3.5 text-[14px] text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
              {error && (
                <div className="mb-3 text-[12px] font-semibold text-subtle">
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={busy || !email.trim()}
                className="w-full rounded-2xl bg-accent py-3.5 text-[14px] font-bold text-white disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send magic link"}
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[11.5px] font-medium text-faint">
          Private to you. Your entries sync securely across your devices.
        </p>
      </div>
    </div>
  );
}
