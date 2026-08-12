-- Per-day injuries: [{ x, y, side, label, partId? }] marked on the body silhouette.
alter table public.day_entries
  add column if not exists injuries jsonb not null default '[]'::jsonb;
