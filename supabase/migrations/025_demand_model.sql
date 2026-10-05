-- Allow the 'demand_model' kind in market_benchmarks: one row per specialty,
-- written by scripts/train-demand-model.mjs (workflow: Train demand model) and
-- read by market-score.js. data holds the fitted coefficients, the feature
-- scaling, percentile anchors, held-out R^2, and whether it is usable.
--
-- Run in the Supabase SQL editor, then run the training workflow. Safe to re-run.

alter table public.market_benchmarks drop constraint if exists market_benchmarks_kind_check;
alter table public.market_benchmarks
  add constraint market_benchmarks_kind_check
  check (kind in ('measure', 'specialty', 'state_density', 'demand_model'));
