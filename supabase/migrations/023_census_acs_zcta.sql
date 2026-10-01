-- ACS 5-year detail by ZIP Code Tabulation Area, built by
-- scripts/import-census-acs.mjs (workflow: Import Census ACS detail).
--
-- demographics_raw keeps its coarse columns (household income stops at
-- "$100,000 and over"). This table carries the finer cut beside it:
--   income_bands   16 household income bands, Under $10k .. $200k+ (ACS top-codes
--                  ZIP-level income at $200,000 or more; nothing finer exists)
--   age_male / age_female   18 five-year age bands each, Under 5 .. 85+
--   race, education         jsonb objects of counts (keys in scripts/lib/acs.mjs)
-- A suppressed Census value is stored as null (unknown), never 0.
--
-- Public aggregate Census data: anyone may read, only the service role writes.
-- Run in the Supabase SQL editor, then run the import workflow once.

create table if not exists public.census_acs_zcta (
  zip               text primary key,
  state             text,
  acs_year          integer not null,
  pop_total         integer,
  households        integer,
  median_hh_income  integer,
  poverty_universe  integer,
  poverty_below     integer,
  income_bands      jsonb not null,
  age_male          jsonb not null,
  age_female        jsonb not null,
  race              jsonb not null,
  education         jsonb not null,
  refreshed_at      timestamptz not null default now()
);

create index if not exists census_acs_zcta_state_idx on public.census_acs_zcta (state);

alter table public.census_acs_zcta enable row level security;

drop policy if exists "census_acs_zcta public read" on public.census_acs_zcta;
create policy "census_acs_zcta public read" on public.census_acs_zcta
  for select using (true);
