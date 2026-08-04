-- CDC PLACES: modelled adult health measures per ZCTA.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file into
-- the Supabase SQL editor and run it by hand, then tell Claude it is applied --
-- a file existing in supabase/migrations/ does not mean it has been run.
--
-- Safe to run more than once: every statement is create-if-not-exists or a
-- guarded policy drop/create, and nothing here rewrites existing rows.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS DATA IS, AND WHAT IT IS NOT
--
-- Source: CDC PLACES, ZCTA-level release (Socrata dataset qnzd-25i4), fed by
-- scripts/import-cdc-places.mjs.
--
-- These are NOT survey responses collected in each ZIP. BRFSS does not sample
-- anywhere near enough people to report a ZIP directly. Every value here is a
-- MODEL-BASED SMALL-AREA ESTIMATE: a multilevel regression fitted on BRFSS
-- respondents nationally, then poststratified onto each ZCTA using that ZCTA's
-- census demographics.
--
-- Three consequences, all of which constrain how the number may be used:
--
--   1. It is a function of demographics. It cannot detect a local disease
--      cluster that the demographic profile does not predict. Two ZIPs with the
--      same age/race/income profile get near-identical values by construction.
--   2. It is therefore CORRELATED with anything else we derive from the census
--      -- including market-score's insured-rate component. Weighting the two as
--      if they were independent evidence double-counts demographics.
--   3. Every consumer must describe it as MODELLED PREVALENCE, never as
--      "patient demand" and never as "what residents reported". The provider
--      pitch rule in CLAUDE.md (never claim patient demand) still stands; disease
--      burden is a different and defensible claim, but only if it is worded as
--      what it is.
--
-- The confidence limits are stored precisely so a consumer can show the width
-- of the estimate rather than a false-precision single figure.
--
-- COVERAGE IS 50 STATES + DC. PUERTO RICO IS NOT PUBLISHED -- verified against
-- the live dataset: 32,520 distinct ZCTAs and not one beginning with "00". PR
-- ZIPs are a substantial share of the clinics table, so a consumer MUST treat
-- "no rows for this ZIP" as unavailable-with-a-reason, never as average need.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- cdc_places
-- ===========================================================================
create table if not exists public.cdc_places (
  -- 5-digit ZCTA. Socrata calls this `locationid`. Stored zero-padded as text,
  -- matching clinics.zip and demographics_raw.zip -- note those two are NOT
  -- consistently padded themselves, which is why market-score already queries
  -- both the padded and int-stripped forms. Keep this side padded and normalise
  -- on the way in.
  zip text not null,

  -- CDC's stable measure code, e.g. 'DIABETES', 'MHLTH', 'ACCESS2'. This is the
  -- join key for any taxonomy mapping -- map on measureid, never on the display
  -- text, which CDC rewords between releases.
  measureid text not null,

  -- 'HLTHOUT' | 'PREVENT' | 'RISKBEH' | 'DISABLT' | 'HLTHSTAT' | 'SOCLNEED'.
  -- Not constrained: CDC adds categories (SOCLNEED is itself recent) and a new
  -- one should land as data, not as a failed import.
  categoryid text,
  short_text text,
  measure text,

  -- Crude prevalence, as a percentage of the adult denominator. The ZCTA file
  -- currently publishes ONLY crude prevalence (datavaluetypeid = 'CrdPrv');
  -- the importer asserts that, because silently mixing crude and age-adjusted
  -- values into one column would make cross-ZIP comparison meaningless.
  value numeric,
  low_confidence_limit numeric,
  high_confidence_limit numeric,

  -- THE YEARS ARE MIXED AND THAT IS NORMAL. Most measures are the latest BRFSS
  -- year; a handful (all teeth lost, dental visit, colorectal screening,
  -- mammography, short sleep) are only collected in alternate years and lag by
  -- one. Storing the year per row rather than per import is what lets a
  -- consumer disclose "2022" next to those five instead of implying every
  -- figure is current.
  data_year int,

  -- CDC's own denominators, shipped with the data. Use these rather than
  -- deriving an adult population from demographics_raw age buckets: the
  -- prevalence was estimated against THIS denominator, so any headcount
  -- computed from a different one is internally inconsistent.
  pop_18plus int,
  total_population int,

  refreshed_at timestamptz not null default now(),

  primary key (zip, measureid)
);

-- The hot path is "every measure for one ZIP" (a single market-score call) and
-- "one measure across a state's ZIPs" (the state-median benchmark). The primary
-- key covers the first. This covers the second.
create index if not exists cdc_places_measure_idx
  on public.cdc_places (measureid, zip);


-- ===========================================================================
-- ACCESS: public read, unlike migration 008's tables
-- ===========================================================================
-- This is published federal aggregate data about geographies, not about people.
-- It carries no identifier and no small-count re-identification risk -- CDC has
-- already done the suppression upstream. It is safe to expose to `anon`, and it
-- MUST be, because market-score.js queries Supabase with SUPABASE_ANON_KEY, not
-- the service role.
--
-- This is the insurance_payers pattern (migration 003), not the demand_log
-- pattern (migration 008). Do not copy the zero-policy model here; it would
-- make every score return the neutral fallback with no error to explain why.
alter table public.cdc_places enable row level security;

drop policy if exists "cdc_places public read" on public.cdc_places;
create policy "cdc_places public read"
  on public.cdc_places for select
  to anon, authenticated
  using (true);

-- Writes are service-role only. The service role bypasses RLS, so no insert or
-- update policy is created -- and none should be. The importer is the only
-- writer.


-- ===========================================================================
-- VERIFY
-- ===========================================================================
-- After applying, before importing: expect rls_enabled = true, policy_count = 1.
select
  c.relname        as table_name,
  c.relrowsecurity as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'cdc_places';

-- After importing: expect ~1.17M rows across ~30,000 ZIPs and 40 measures,
-- with two distinct data_year values.
-- select count(*) as rows,
--        count(distinct zip) as zips,
--        count(distinct measureid) as measures,
--        array_agg(distinct data_year order by data_year) as years
-- from public.cdc_places;
