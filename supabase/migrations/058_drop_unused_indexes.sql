-- 058: drop two indexes the database has never used (2026-11-22, the user's go-ahead).
-- db-size-report of 2026-11-20 counted 0 scans on each:
--   provider_individuals_taxonomy_idx (013, on primary_taxonomy, 72 MB): search
--   filters by taxonomy_code since 2026-10-09, which has its own index (030).
--   npi_activity_refreshed_idx (008, 71 MB): no staleness sweep reads it.
-- Frees about 140 MB. Rebuild with 013 / 008's create statements if ever needed.
drop index if exists public.provider_individuals_taxonomy_idx;
drop index if exists public.npi_activity_refreshed_idx;
