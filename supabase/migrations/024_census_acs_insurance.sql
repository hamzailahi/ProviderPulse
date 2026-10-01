-- Health insurance coverage counts on census_acs_zcta (ACS 5-year tables B27001,
-- B27006, B27007), filled by scripts/import-census-acs.mjs.
--   ins_universe   civilian noninstitutionalized population the counts refer to
--   ins_uninsured  people with no health insurance coverage
--   ins_medicare   people with Medicare coverage (alone or with other coverage)
--   ins_medicaid   people with Medicaid or other means-tested public coverage
-- Medicare and Medicaid overlap (dual eligibles): never add them together.
-- Null means unknown. Run in the Supabase SQL editor, then re-run the import.

alter table public.census_acs_zcta
  add column if not exists ins_universe  integer,
  add column if not exists ins_uninsured integer,
  add column if not exists ins_medicare  integer,
  add column if not exists ins_medicaid  integer;
