import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when both env vars are present. When false, the whole sync/auth
 * layer stays dormant and the app behaves as a pure local-first PWA.
 */
export const isSupabaseConfigured = Boolean(url && anon);

// The Postgres schema Brainwash lives in. The Supabase project is shared with
// other personal apps, one schema each, so the client must set it.
export const BRAINWASH_SCHEMA = "brainwash" as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrainwashClient = SupabaseClient<any, typeof BRAINWASH_SCHEMA, typeof BRAINWASH_SCHEMA>;

let client: BrainwashClient | null = null;

/** Lazily-created browser client. Returns null on the server or when unconfigured. */
export function getSupabase(): BrainwashClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!client) {
    client = createClient(url!, anon!, {
      db: { schema: BRAINWASH_SCHEMA },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
