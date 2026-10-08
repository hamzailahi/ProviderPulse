-- NUCC taxonomy codes: the taxonomy_map lookup table, and a taxonomy_code
-- column on the three directory tables.
--
-- Why: the directory stored taxonomy NAMES only, and taxonomy-groups.js sorted
-- them into six homegrown groups by keyword, with a default bucket that put
-- Behavior Technicians, pharmacists and nurses under "Specialty Medicine".
-- Classification moves to the official NUCC Grouping of each listing's code.
--
-- Safe to run now and to re-run. Adding nullable columns with no default is a
-- catalog change in Postgres 11+, so it does not rewrite these large tables.
-- The columns stay empty until the "Taxonomy backfill" workflow fills them;
-- nothing reads them yet. Indexes come in 030, AFTER the backfill, so the
-- backfill does not maintain them row by row.
--
-- taxonomy_map rows are loaded by that workflow from
-- supabase/reference/taxonomy_map.csv (built from the NUCC file by
-- scripts/build-taxonomy-map.mjs), not written here, so a new NUCC release
-- needs no migration.

begin;

create table if not exists public.taxonomy_map (
  nucc_code           text primary key check (nucc_code ~ '^[0-9A-Z]{9}X$'),
  grouping            text not null,
  classification      text not null,
  specialization      text not null default '',
  display_name        text not null,
  section             text not null check (section in ('Individual', 'Non-Individual')),
  cms_specialty_code  text not null default '',
  cms_specialty_name  text not null default '',
  patient_specialties text[] not null default '{}',
  show_on_map         boolean not null default true,
  nucc_version        text not null,
  loaded_at           timestamptz not null default now()
);

alter table public.taxonomy_map enable row level security;
drop policy if exists "taxonomy_map public read" on public.taxonomy_map;
create policy "taxonomy_map public read" on public.taxonomy_map for select using (true);

-- taxonomy_code_source records how a row's code was chosen:
--   nppes_primary  the NPPES taxonomy flagged primary
--   nppes_first    NPPES flagged none; the first one listed was used
--   display_name   the NPI is not in NPPES; exact NUCC display-name match
--   nppes_api      written by the hourly ZIP enrichment from the NPI Registry
alter table public.clinics                    add column if not exists taxonomy_code text;
alter table public.clinics                    add column if not exists taxonomy_code_source text;
alter table public.provider_individuals       add column if not exists taxonomy_code text;
alter table public.provider_individuals       add column if not exists taxonomy_code_source text;
alter table public.clinic_secondary_locations add column if not exists taxonomy_code text;
alter table public.clinic_secondary_locations add column if not exists taxonomy_code_source text;

commit;
