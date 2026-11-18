-- 049: drive-time access per ZIP and specialty (E2SFCA, Luo & Qi 2009, with
-- Dai 2010's Gaussian weight), the user's choice 2026-11-18 after the
-- Tennessee dry run (supabase/reference/access-e2sfca/tennessee-dry-run.md).
-- Filled one state at a time by access-dry-run.yml `mode: apply`
-- (scripts/access-dry-run.sh). market-score reads it for the scored ZIP; a ZIP
-- or specialty with no row keeps the 10-mile listings-per-adult ratio, and
-- the evidence says which basis was used.
create table if not exists public.access_e2sfca (
  zip text not null,
  specialty text not null,
  per_1k numeric not null,             -- E2SFCA listings per 1,000 adults
  catchment_minutes integer not null,  -- the specialty's drive-time edge
  state text not null,                 -- the run that wrote it (e.g. TN)
  computed_at timestamptz not null default now(),
  primary key (zip, specialty)
);
comment on table public.access_e2sfca is 'Drive-time E2SFCA access per ZIP and scored specialty; written only by access-dry-run.yml apply';
alter table public.access_e2sfca enable row level security;
drop policy if exists access_e2sfca_read on public.access_e2sfca;
create policy access_e2sfca_read on public.access_e2sfca for select using (true);
revoke all on public.access_e2sfca from anon, authenticated;
grant select on public.access_e2sfca to anon, authenticated;
