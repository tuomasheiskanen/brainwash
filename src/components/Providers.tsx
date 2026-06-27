"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { markSignedOut, syncNow } from "@/lib/sync";

interface AuthValue {
  configured: boolean;
  session: Session | null;
  loading: boolean;
  /** Send a magic link to this email. Returns an error message or null. */
  signIn: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  configured: false,
  session: null,
  loading: false,
  signIn: async () => "Sync is not configured.",
  signOut: async () => {},
  syncNow: async () => {},
});

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Track auth state + sync on sign-in.
  useEffect(() => {
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) void syncNow();
      else markSignedOut();
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) void syncNow();
      else markSignedOut();
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  // Re-sync when coming back online or returning to the tab.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const onOnline = () => void syncNow();
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const signIn = useCallback(
    async (email: string) => {
      if (!sb) return "Sync is not configured.";
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      return error?.message ?? null;
    },
    [sb]
  );

  const signOut = useCallback(async () => {
    await sb?.auth.signOut();
  }, [sb]);

  return (
    <AuthContext.Provider
      value={{
        configured: isSupabaseConfigured,
        session,
        loading,
        signIn,
        signOut,
        syncNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
