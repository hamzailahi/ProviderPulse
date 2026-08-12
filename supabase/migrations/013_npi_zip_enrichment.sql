-- NPI ZIP enrichment: a background pipeline that backfills missing providers
-- (both NPI-1 individuals and NPI-2 organisations) for a ZIP, checked against
-- the live NPPES registry.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file
-- into the Supabase SQL editor and run it by hand, then update CLAUDE.md's
-- "Applied as of" list -- a file existing in supabase/migrations/ does not
-- mean it has been run.
--
-- Safe to run more than once: every statement is create-if-not-exists or a
-- guarded policy drop/create, and nothing here rewrites existing rows.
--
-- ---------------------------------------------------------------------------
-- WHY TWO TABLES, NOT ONE
--
-- `clinics` is entirely NPI-2 organisational records (verified: 20/20 sampled
-- across four offsets, zero individuals -- see the "NPI-1 vs NPI-2" section of
-- CLAUDE.md). Everything downstream of `clinics` -- market-score's supply
-- count, taxonomy-groups, the audit engine's NPI-2 caveat -- depends on that
-- being true. Writing NPI-1 individuals into `clinics` would silently break
-- all three. `provider_individuals` mirrors `clinics`' shape for NPI-1 rows
-- instead, so the map/dashboard can add a second read rather than the two
-- vocabularies getting mixed into one table.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- 1. provider_individuals -- NPI-1 records found while enriching a ZIP
-- ===========================================================================
-- Same shape as the columns of `clinics` actually read elsewhere
-- (npi,name,address,city,state,zip,primary_taxonomy,latitude,longitude --
-- see patient.js's clinicsQuery and audit-run.js's sbGet), plus enrichment
-- bookkeeping. Bulk NPPES data, same publication posture as `clinics`: not
-- PHI, public read.
create table if not exists public.provider_individuals (
  npi text primary key,
  name text,
  address text,
  city text,
  state text,
  zip text,
  primary_taxonomy text,
  phone text,
  latitude double precision,
  longitude double precision,

  -- Always 'NPI-1' today; kept as a column rather than assumed so a stray
  -- NPI-2 row from a bad NPPES response is visible instead of silently mixed
  -- in with individuals.
  enumeration_type text not null default 'NPI-1',

  source text not null default 'nppes_zip_enrichment',
  refreshed_at timestamptz not null default now()
);

create index if not exists provider_individuals_zip_idx
  on public.provider_individuals (zip);
create index if not exists provider_individuals_taxonomy_idx
  on public.provider_individuals (primary_taxonomy);

alter table public.provider_individuals enable row level security;

drop policy if exists provider_individuals_public_read on public.provider_individuals;
create policy provider_individuals_public_read
  on public.provider_individuals
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: only the background
-- enrichment job (service role, bypasses RLS) writes here.


-- ===========================================================================
-- 2. zip_enrichment_queue -- which ZIPs need an NPPES backfill pass
-- ===========================================================================
-- A ZIP search (patient navigator or analyst dashboard) upserts a 'pending'
-- row here instead of calling NPPES inline -- an exhaustive per-ZIP NPPES
-- pull is too slow to fit inside a search request's time budget (see
-- CLAUDE.md's Timeouts section). scripts/enrich-npi-zips.mjs, run on a
-- schedule with no timeout pressure, is what actually does the pull and
-- write. This table is the queue between the two.
--
-- Zero anon/authenticated policies, same access model as migration 008's
-- tables: RLS enabled with no policies denies anon/authenticated outright,
-- and the service role bypasses RLS. Queue state is operational, not public.
create table if not exists public.zip_enrichment_queue (
  zip text primary key,

  -- pending    -- queued, not yet processed (or due for a refresh)
  -- processing -- claimed by a running job; prevents two overlapping runs
  --                from double-processing the same ZIP
  -- done       -- last pass completed without error
  -- failed     -- exceeded MAX_ATTEMPTS; needs a human look, not auto-retried
  status text not null default 'pending'
    constraint zip_enrichment_queue_status_chk
    check (status in ('pending', 'processing', 'done', 'failed')),

  requested_at timestamptz not null default now(),
  last_enriched_at timestamptz,
  attempts int not null default 0,
  last_error text
);

-- The background job's hot path: "give me pending rows, oldest request first".
create index if not exists zip_enrichment_queue_status_idx
  on public.zip_enrichment_queue (status, requested_at);

alter table public.zip_enrichment_queue enable row level security;


-- ===========================================================================
-- VERIFY
-- ===========================================================================
-- Expect provider_individuals: rls_enabled = true, policy_count = 1 (public read).
-- Expect zip_enrichment_queue: rls_enabled = true, policy_count = 0.
select
  c.relname                          as table_name,
  c.relrowsecurity                   as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('provider_individuals', 'zip_enrichment_queue')
order by c.relname;
