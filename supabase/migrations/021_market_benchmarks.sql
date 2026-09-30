-- National benchmarks for the market model (v2/assets/market-model.js), built
-- by scripts/build-market-benchmarks.mjs (workflow: Build market benchmarks).
--
--   kind 'measure'    key = CDC PLACES measure id, data = percentile anchors
--                     { p05, p25, p50, p75, p95, n, data_year }
--   kind 'specialty'  key = specialty label from assets/specialties.js,
--                     data = { rate_per_1k, clinicians, adults }
--
-- Public, derived, aggregate figures: anyone may read, only the service role
-- writes. market-score.js reads it with the anon key and falls back to the
-- six broad groups (with lowered confidence) while it is empty.
--
-- Run in the Supabase SQL editor.

create table if not exists public.market_benchmarks (
  kind          text not null check (kind in ('measure', 'specialty')),   -- 022 adds 'state_density'
  key           text not null,
  data          jsonb not null,
  refreshed_at  timestamptz not null default now(),
  primary key (kind, key)
);

alter table public.market_benchmarks enable row level security;

drop policy if exists "market_benchmarks public read" on public.market_benchmarks;
create policy "market_benchmarks public read" on public.market_benchmarks
  for select using (true);
