-- Daily health entries, one row per (user, date).
-- Mirrors the local DayEntry shape. `deleted` is a soft-delete tombstone so
-- removals propagate to other devices during sync. `updated_at` is set by the
-- client (last-write-wins) — do NOT auto-overwrite it with a trigger.

create table if not exists public.day_entries (
  user_id       uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  date          date        not null,
  mood          int,
  mood_tags     text[]      not null default '{}',
  note          text        not null default '',
  drinks        jsonb       not null default '{}'::jsonb,
  sleep_hours   numeric,
  sleep_quality int,
  deleted       boolean     not null default false,
  updated_at    timestamptz not null default now(),
  primary key (user_id, date)
);

-- Pull queries fetch rows changed since a cursor, per user.
create index if not exists day_entries_user_updated_idx
  on public.day_entries (user_id, updated_at);

-- Row Level Security: each user can only see and write their own rows.
alter table public.day_entries enable row level security;

drop policy if exists "Users manage own entries" on public.day_entries;
create policy "Users manage own entries"
  on public.day_entries
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
