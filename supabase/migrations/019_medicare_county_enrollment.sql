-- Current-month Medicare enrollment by county: total beneficiaries and the
-- Original Medicare vs. Medicare Advantage split, from CMS's "Medicare Monthly
-- Enrollment" file.
--
-- CURRENT-MONTH SNAPSHOT ONLY, ON PURPOSE. The source file is the full
-- 2013-to-present history (500k+ rows); scripts/import-medicare-enrollment.mjs
-- reads only the newest month and UPSERTS BY fips, so this table holds exactly
-- one row per county -- last month's numbers overwritten, not accumulated.
-- There is deliberately no history here; add a separate table if a trend line
-- is ever wanted.
--
-- Run in the Supabase SQL editor.

create table if not exists public.medicare_county_enrollment (
  fips                  text primary key,
  state                 text not null,
  county                text not null,
  data_year             int not null,
  data_month            text not null,
  total_benes           int,
  original_medicare_benes int,
  ma_and_other_benes    int,
  aged_total_benes      int,
  disabled_total_benes  int,
  refreshed_at          timestamptz not null default now()
);
create index if not exists medicare_county_enrollment_state_idx on public.medicare_county_enrollment (state);

alter table public.medicare_county_enrollment enable row level security;

-- Public aggregate data (CMS county-level counts, not PHI), same posture as
-- insurance_payers and hpsa_designations: readable by anyone, written only by
-- the import script's service role.
create policy "medicare enrollment is public" on public.medicare_county_enrollment
  for select using (true);
