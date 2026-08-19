-- ZIP-to-county crosswalk, from HUD's USPS ZIP Code Crosswalk API (type=2,
-- zip-county), weighted by RES_RATIO -- the fraction of a ZIP's residential
-- addresses that fall in each county. A single ZIP can span multiple
-- counties (confirmed live: 38017 is 91% Shelby County / 9% Fayette County
-- by address count -- the Census ZCTA relationship file's land-area weight
-- gives a badly misleading 43%/57% for the same ZIP, which is why this
-- table uses HUD's address-based ratio instead), so this is a one-to-many
-- table, not a lookup.
--
-- WHY THIS EXISTS: neither medicare_county_enrollment nor hpsa_designations
-- has a ZIP column -- both are county-level, and market-score.js has had to
-- fall back to a state-wide figure for both the Medicare mix and the HPSA
-- shortage score for exactly that reason. This table is what lets a ZIP-level
-- query allocate a county-level stat proportionally instead.
--
-- county_name is deliberately NOT stored here. HUD's response gives a "city"
-- field, not a county name, and hpsa_designations.county stores names with
-- the "County"/"Parish"/"Borough"/... suffix already stripped -- guessing
-- that mapping without verifying it against every suffix variant is exactly
-- the kind of unverified-vocabulary mistake this codebase has been burned by
-- before (see the taxonomy-vocabularies section of CLAUDE.md). Joining to
-- hpsa_designations by name is a follow-up task, done separately once that
-- mapping is verified live -- this table only needs to support fips joins
-- today (medicare_county_enrollment.fips).
--
-- Run in the Supabase SQL editor.

create table if not exists public.zip_county_crosswalk (
  id            bigint generated always as identity primary key,
  zip           text not null,
  fips          text not null,
  state         text not null,
  res_ratio     numeric not null,
  data_year     text,
  data_quarter  text,
  refreshed_at  timestamptz not null default now(),
  unique (zip, fips)
);
create index if not exists zip_county_crosswalk_zip_idx on public.zip_county_crosswalk (zip);
create index if not exists zip_county_crosswalk_fips_idx on public.zip_county_crosswalk (fips);

alter table public.zip_county_crosswalk enable row level security;

-- Public reference data (HUD/Census geography, not PHI), same posture as
-- insurance_payers, hpsa_designations and medicare_county_enrollment:
-- readable by anyone, written only by the import script's service role.
create policy "zip county crosswalk is public" on public.zip_county_crosswalk
  for select using (true);
