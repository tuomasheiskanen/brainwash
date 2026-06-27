import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when both env vars are present. When false, the whole sync/auth
 * layer stays dormant and the app behaves as a pure local-first PWA.
 */
export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

/** Lazily-created browser client. Returns null on the server or when unconfigured. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!client) {
    client = createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
