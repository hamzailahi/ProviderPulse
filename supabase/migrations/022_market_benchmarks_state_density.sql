-- Allow the 'state_density' kind in market_benchmarks.
--
-- 021 restricted kind to ('measure', 'specialty'). The benchmark build now also
-- writes one 'state_density' row per state (all listings per 1,000 residents,
-- data = { per_1k, listings, organizations, individuals, population, zips }),
-- and the first run failed with check violation 23514 on that row.
--
-- Run in the Supabase SQL editor, then re-run the "Build market benchmarks"
-- workflow. Safe to re-run.

alter table public.market_benchmarks drop constraint if exists market_benchmarks_kind_check;
alter table public.market_benchmarks
  add constraint market_benchmarks_kind_check
  check (kind in ('measure', 'specialty', 'state_density'));
