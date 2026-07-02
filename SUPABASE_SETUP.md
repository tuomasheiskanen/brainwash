# Supabase sync setup

The app works fully **local-first** with no Supabase. Cloud sync + magic-link
sign-in stay dormant until you add project keys. Follow these steps once to turn
them on.

## 1. Create a project
1. Go to <https://supabase.com> → **New project**. Pick a name, a strong DB
   password, and a region close to you (this is **health data** — choose the
   jurisdiction deliberately).
2. Wait for it to finish provisioning.

## 2. Get your keys
Project → **Settings → API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is meant to ship in the browser — your data is protected by Row
Level Security, not by hiding it.

## 3. Configure the app
```bash
cp .env.local.example .env.local
```
Paste both values into `.env.local`, then restart the dev server (env is read at
build/start):
```bash
npm run dev          # or: npm run build && npm start
```

## 4. Create the schema
Apply every file in `supabase/migrations/` in order (`0001_init_day_entries.sql`,
`0002_add_exercises.sql`, …). Either:

**A. Dashboard (quickest):** SQL Editor → paste each file's contents → **Run**.

**B. Supabase CLI (version-controlled):**
```bash
npm i -D supabase
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates the `day_entries` table and the RLS policy that scopes every row to
its owner.

## 5. Allow the sign-in redirect
Authentication → **URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add every origin you open the app from, e.g.
  - `http://localhost:3000`
  - your Cloudflare tunnel URL, e.g. `https://<random>.trycloudflare.com`
  - `http://192.168.88.151:3000` (LAN, if you use it)

Magic links bounce back to `window.location.origin`, so the origin you signed in
from must be listed here or the link will error.

> Email note: Supabase's built-in email sender is rate-limited and best for
> testing. For real use, set up a custom SMTP provider under Authentication →
> Emails.

## 6. Test it
1. Open the app, tap the **cloud pill** (top-right) → **Sign in to sync**.
2. Enter your email → **Send magic link** → open the link on the same device.
3. The pill shows **Synced**. Add an entry on one device and it appears on
   another after it syncs (on focus, on reconnect, or shortly after a change).

## How it behaves
- **Local-first:** all reads/writes hit IndexedDB instantly; the app stays fully
  usable offline. Changes queue and push when you're back online.
- **Last-write-wins:** if the same day is edited on two devices, the later save
  wins (by client clock). Fine for single-user; it is not a CRDT merge.
- **Deletes** propagate via soft-delete tombstones.
- Any data you logged **before** signing in uploads to your account on first
  sign-in.

## Caveat: shared device
Local data isn't namespaced per account. If two different people sign in on the
same browser profile, they'd see each other's locally-cached entries. Fine for a
personal device; don't share one browser profile across accounts.
