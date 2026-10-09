-- Indexes on taxonomy_code. RUN ONLY AFTER the "Taxonomy backfill" workflow has
-- finished in apply mode (an index during the backfill would be updated for
-- every one of ~10M rows, slowing it and adding bloat).
--
-- CONCURRENTLY keeps the tables readable and writable while each index
-- builds, but it cannot run inside a transaction block, and the Supabase SQL
-- editor wraps a pasted multi-statement script in one (2026-10-09: "cannot run
-- inside a transaction block"). Run it with the "Taxonomy code indexes"
-- workflow (scripts/taxonomy-indexes.sh), or paste ONE statement at a time.
-- Each statement can take a few minutes.
-- Safe to re-run. If one fails part way, drop that index and run it again:
-- a failed concurrent build leaves an INVALID index behind.

create index concurrently if not exists clinics_taxonomy_code_idx
  on public.clinics (taxonomy_code);
create index concurrently if not exists provider_individuals_taxonomy_code_idx
  on public.provider_individuals (taxonomy_code);
create index concurrently if not exists clinic_secondary_locations_taxonomy_code_idx
  on public.clinic_secondary_locations (taxonomy_code);
