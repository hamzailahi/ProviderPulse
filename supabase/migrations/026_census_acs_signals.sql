-- Market signals on census_acs_zcta, filled by scripts/import-census-acs.mjs.
--   pop_prior, pop_prior_year  total population from the ACS release five years
--                              earlier, for growth (releases before 2021 use 2010
--                              ZCTAs, so a few ZIPs changed shape)
--   signals  jsonb, { key: { n, of } } with keys disability, employer, direct,
--            tricare, va, seniors_alone. n is the count, of its universe; null
--            means unknown. Coverage types overlap: never add them together.
-- Run in the Supabase SQL editor, then re-run the import. Safe to re-run.

alter table public.census_acs_zcta
  add column if not exists pop_prior      integer,
  add column if not exists pop_prior_year integer,
  add column if not exists signals        jsonb;
