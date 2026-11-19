-- Name search (2026-11-19, the user's ask: patients and providers can look up
-- a specific doctor or clinic by name). Trigram indexes let
-- name ILIKE '%SMITH%' answer from an index instead of scanning every row
-- (clinics 1.99M, provider_individuals 7.5M), which would time out at the
-- public role's 3-second limit. Tokens are matched in any order
-- (provider_individuals stores "FIRST LAST"), each as its own ILIKE, so the
-- index serves every token of three letters or more.
--
-- CONCURRENTLY cannot run in the SQL editor's transaction: run it with the
-- "Concurrent indexes" workflow (choose 050). Safe to re-run.

set search_path = public, extensions;
create extension if not exists pg_trgm with schema extensions;

create index concurrently if not exists clinics_name_trgm_idx
  on public.clinics using gin (name gin_trgm_ops);
create index concurrently if not exists provider_individuals_name_trgm_idx
  on public.provider_individuals using gin (name gin_trgm_ops);
