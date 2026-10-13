-- Location indexes on clinics and provider_individuals, the same shape
-- clinic_secondary_locations already has (clinic_secondary_locations_geo_idx).
--
-- Why (2026-10-13): the patient search and the portal's Competition tab ask
-- for every listing inside a latitude/longitude box around a ZIP, filtered
-- by the specialty's NUCC codes. With no location index the planner walks
-- the taxonomy_code index (primary care: ~1.2M rows nationally) and checks
-- each row's coordinates, which ran past the public role's 3-second
-- statement timeout (57014) on both tables, while the indexed secondary
-- table answered in 0.6s. The browser read the failure as "no providers":
-- Competition showed no primary care within any radius of 38017.
--
-- CONCURRENTLY keeps the tables usable while each index builds, but cannot
-- run inside a transaction block, which the Supabase SQL editor uses. Run it
-- with the "Concurrent indexes" workflow (scripts/build-indexes.sh, choose
-- 038), or paste ONE statement at a time. Safe to re-run; a failed build
-- leaves an INVALID index that the workflow drops first.

create index concurrently if not exists clinics_geo_idx
  on public.clinics (latitude, longitude)
  where latitude is not null and longitude is not null;
create index concurrently if not exists provider_individuals_geo_idx
  on public.provider_individuals (latitude, longitude)
  where latitude is not null and longitude is not null;
