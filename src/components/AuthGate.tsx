"use client";

import type { ReactNode } from "react";
import { useAuth } from "./Providers";
import { LandingPage } from "./LandingPage";

function Splash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-sunken">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-tint text-[32px] opacity-80">
        🌿
      </div>
    </div>
  );
}

/**
 * Hard auth gate. Signed-out users see the landing/sign-in page and cannot reach
 * the app. While the session is being resolved, a calm splash avoids flashing
 * either screen.
 *
 * If Supabase isn't configured (no keys), there is no auth possible — fall
 * through to the app so the build isn't bricked (local-only mode).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, session, loading } = useAuth();

  if (!configured) return <>{children}</>;
  if (loading) return <Splash />;
  if (!session) return <LandingPage />;
  return <>{children}</>;
}
