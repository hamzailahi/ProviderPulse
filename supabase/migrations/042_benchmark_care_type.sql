-- 042: allow the 'care_type' kind in market_benchmarks (2026-10-25).
--
-- The benchmark build now also writes one row per facility type (pharmacies,
-- urgent care, hospitals, labs, home and senior care, ...): organization
-- listings nationally per 10,000 adults, data = { rate_per_10k, sites, adults }.
-- market-score compares each catchment with it ("Places patients go").
-- The live constraint (schema snapshot) already allows measure, specialty,
-- state_density and demand_model (so 025 is in fact applied); this keeps all
-- four and adds care_type. Safe to re-run.
alter table public.market_benchmarks drop constraint if exists market_benchmarks_kind_check;
alter table public.market_benchmarks
  add constraint market_benchmarks_kind_check
  check (kind in ('measure', 'specialty', 'state_density', 'demand_model', 'care_type'));
