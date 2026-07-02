-- Add equipment-free bodyweight exercise tracking. `exercises` is a per-day map
-- of exercise key → total reps, mirroring the local Exercises shape (same as how
-- `drinks` is stored). Additive with a default so existing rows stay valid and
-- older clients that don't send the field keep working.

alter table public.day_entries
  add column if not exists exercises jsonb not null default '{}'::jsonb;
