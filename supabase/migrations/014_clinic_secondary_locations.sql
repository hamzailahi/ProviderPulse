-- Secondary practice locations for bulk NPPES clinics (NPI-2) and physicians
-- (NPI-1), from pl_pfile ("Secondary Practice Location") in the March 2026
-- NPPES full-file download.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file into
-- the Supabase SQL editor and run it by hand, then update CLAUDE.md's
-- "Applied as of" list -- a file existing in supabase/migrations/ does not
-- mean it has been run.
--
-- PREREQUISITE: migration 013 (provider_individuals, zip_enrichment_queue)
-- must be applied first -- physician secondary locations reference NPIs that
-- live in provider_individuals, not clinics.
--
-- Safe to run more than once: every statement is create-if-not-exists or a
-- guarded policy drop/create, and nothing here rewrites existing rows.
--
-- ---------------------------------------------------------------------------
-- WHY A SEPARATE TABLE, NOT MORE ROWS IN clinics / provider_individuals
--
-- Both of those tables have `npi` as primary key -- one row per NPI, holding
-- that NPI's single NPPES-registered address. pl_pfile is a many-to-one
-- relationship (one NPI can list several secondary practice locations), which
-- neither table's shape supports. clinic_secondary_locations is bulk NPPES
-- data about a location, keyed by (parent_npi, address, zip) instead of NPI
-- alone, and carries `location_type` explicitly so the map/UI can label these
-- rows "secondary location" and never confuse them with a claimed provider's
-- own self-reported provider_locations rows (migration 006) -- those are a
-- different table with a different trust model (self-only RLS, user-writable).
-- ---------------------------------------------------------------------------

create table if not exists public.clinic_secondary_locations (
  id uuid primary key default gen_random_uuid(),

  -- References clinics.npi (entity_type='2') or provider_individuals.npi
  -- (entity_type='1') -- not a foreign key, because the parent row may live in
  -- either table depending on entity_type, and this table must still accept a
  -- row even if the parent load ran in a different batch/order.
  parent_npi text not null,
  entity_type text not null check (entity_type in ('1', '2')),

  -- Carried over from the parent NPI at extraction time (see
  -- extract_nppes_by_state.py) so this table is independently readable
  -- without a join back to clinics/provider_individuals.
  name text,
  primary_taxonomy text,

  address text,
  address2 text,
  city text,
  state text,
  zip text,

  latitude double precision,
  longitude double precision,
  -- 'address' (Census Batch Geocoder matched the street address) or
  -- 'zip_centroid' (fallback -- see the geocoding stage of the bulk-load
  -- pipeline). Null until geocoded. Lets the UI show an "approximate
  -- location" affordance for zip_centroid rows rather than presenting every
  -- pin as equally precise.
  geocode_precision text,

  -- Always 'secondary' today. Kept as a column (not assumed) for the same
  -- reason provider_individuals.enumeration_type is a column: a stray primary
  -- location row here should be visible, not silently mixed in.
  location_type text not null default 'secondary',

  source text not null default 'nppes_bulk_march_2026',
  refreshed_at timestamptz not null default now(),

  -- Upsert conflict target for the bulk loader. Nulls in address/zip won't
  -- dedupe against each other (standard Postgres unique-constraint behaviour)
  -- -- acceptable here because pl_pfile's address line 1 is required data.
  unique (parent_npi, address, zip)
);

create index if not exists clinic_secondary_locations_zip_idx
  on public.clinic_secondary_locations (zip);
create index if not exists clinic_secondary_locations_parent_npi_idx
  on public.clinic_secondary_locations (parent_npi);
create index if not exists clinic_secondary_locations_geo_idx
  on public.clinic_secondary_locations (latitude, longitude)
  where latitude is not null and longitude is not null;

alter table public.clinic_secondary_locations enable row level security;

-- Same posture as clinics/provider_individuals: bulk NPPES data, not PHI,
-- public read. Only the bulk loader (service role) writes here.
drop policy if exists clinic_secondary_locations_public_read on public.clinic_secondary_locations;
create policy clinic_secondary_locations_public_read
  on public.clinic_secondary_locations
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
where n.nspname = 'public' and c.relname = 'clinic_secondary_locations';
