-- Exercises catalog (one row per user+exercise) + per-day sets.

create table if not exists public.exercises (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id         text        not null,
  name       text        not null,
  unit       text        not null,
  goal       int,
  favorite   boolean     not null default true,
  sort_order int         not null default 0,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists exercises_user_updated_idx
  on public.exercises (user_id, updated_at);

alter table public.exercises enable row level security;

drop policy if exists "Users manage own exercises" on public.exercises;
create policy "Users manage own exercises"
  on public.exercises
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-day exercise sets: { exerciseId: number[] }
alter table public.day_entries
  add column if not exists exercise_sets jsonb not null default '{}'::jsonb;
