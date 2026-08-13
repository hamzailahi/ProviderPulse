-- Cache for cms-provider.js's per-NPI lookups against CMS's live datastore API
-- (data.cms.gov, dataset mj5m-pzi6). Every map popup that opens currently
-- fires a live outbound HTTPS request to CMS with no persistence at all --
-- the only cache today is an in-memory object in the browser tab
-- (cmsCache in index.html / patient.js), which is gone on refresh and never
-- shared across visitors. This table makes the lookup a read-through cache
-- instead: check here first, only call CMS on a miss or a stale row.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file
-- into the Supabase SQL editor and run it by hand, then update CLAUDE.md's
-- "Applied as of" list -- a file existing in supabase/migrations/ does not
-- mean it has been run.
--
-- Safe to run more than once: create-if-not-exists and guarded policy
-- drop/create throughout.
--
-- ---------------------------------------------------------------------------
-- WHY CACHE "NOT FOUND" TOO
--
-- CMS's downloadable file only covers Medicare-enrolled clinicians -- a doula,
-- massage therapist, or many facility-type NPIs will never be in it. Without
-- caching the miss, every popup open for one of those re-queries CMS forever
-- for an answer that cannot change until the quarterly file refreshes.
-- `found = false` rows are cached the same as hits, on the same TTL.
--
-- WHY A TTL AND NOT A ONE-TIME CACHE
--
-- CMS republishes this file periodically and a provider's facility,
-- telehealth flag, or Medicare assignment status can genuinely change.
-- cms-provider.js treats a row older than CACHE_TTL_DAYS (in that file) as
-- stale and re-fetches, same posture as zip_enrichment_queue's FRESHNESS_DAYS.
-- ---------------------------------------------------------------------------

create table if not exists public.cms_provider_cache (
  npi text primary key,

  found boolean not null,

  first_name text,
  last_name text,
  credential text,
  gender text,
  primary_specialty text,
  secondary_specialties text[],
  medical_school text,
  graduation_year text,
  telehealth boolean,
  facility text,
  org_pac_id text,
  group_size text,
  address text,
  phone text,
  medicare_participant boolean,
  medicare_assignment text,

  fetched_at timestamptz not null default now()
);

create index if not exists cms_provider_cache_fetched_at_idx
  on public.cms_provider_cache (fetched_at);

alter table public.cms_provider_cache enable row level security;

-- Same posture as clinics/provider_individuals: this mirrors CMS's own public
-- provider directory, not PHI. Public read; only the function (service role)
-- writes, since every write is an upsert keyed to a live CMS response, not
-- something a client should ever submit directly.
drop policy if exists cms_provider_cache_public_read on public.cms_provider_cache;
create policy cms_provider_cache_public_read
  on public.cms_provider_cache
  for select
  to anon, authenticated
  using (true);


-- ===========================================================================
-- VERIFY
-- ===========================================================================
-- Expect rls_enabled = true, policy_count = 1 (public read).
select
  c.relname                          as table_name,
  c.relrowsecurity                   as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'cms_provider_cache';
