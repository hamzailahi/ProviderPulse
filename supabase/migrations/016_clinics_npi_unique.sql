-- Adds a unique constraint on clinics.npi so upsert (on_conflict=npi) from the
-- NPPES bulk-load pipeline works. Required cleanup first: the original
-- one-off loader (upload_to_supabase_v4.py) did plain inserts, so a handful
-- of duplicate/invalid rows exist that a unique constraint would reject.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file
-- into the Supabase SQL editor and run it by hand (begin through commit, as
-- ONE execution -- a partial run without the commit rolls back silently when
-- the connection closes even though the editor reports "Success"), then tell
-- Claude it is applied.
--
-- ---------------------------------------------------------------------------
-- WHAT WAS FOUND (2026-08-11, confirmed via SQL editor before writing this):
--
-- 3 rows with npi = '' (blank) or null:
--   id 891566  "RECON NEUROLOGY"              Fayetteville NC (no NPI, has address)
--   id 891567  "RECON NEUROLOGY & PSYCHIATRY"  Pinehurst NC    (no NPI, has address)
--   id 813378  (all fields null/blank, zip '00000')            (pure garbage)
-- None of these can ever be the target of an NPI-keyed upsert. Deleted.
--
-- 1 NPI (1427769140, "RECON NEUROLOGY & PSYCHIATRY") with 3 rows:
--   id 862094  Fayetteville NC, created_at 04:35:31  (duplicate of 891565)
--   id 891565  Fayetteville NC, created_at 04:37:32  (duplicate of 862094)
--   id 1222203 Myrtle Beach SC, created_at 05:03:25  (different address, same NPI)
-- This is one org with multiple real practice locations loaded as separate
-- "primary" rows by the old one-off pipeline. Keeping one row per NPI (the
-- most recent by created_at, Myrtle Beach) does not lose the Fayetteville
-- location permanently: NPPES's pl_pfile secondary-locations file is its
-- correct long-term home, and when the NC state batch runs through this
-- bulk-load pipeline it will land in clinic_secondary_locations tagged
-- parent_npi=1427769140, location_type='secondary' -- which is a more
-- accurate representation than a second competing "primary" row.
-- ---------------------------------------------------------------------------

begin;

-- Blank/null NPI rows: undeletable duplicates by definition (can't upsert
-- against an NPI that doesn't exist), and none carry data worth preserving
-- elsewhere.
delete from public.clinics
where npi is null or npi = '';

-- True duplicate NPIs: keep the most-recently-created row per NPI, drop the
-- rest. ctid is used (not id) purely because it's the simplest "this exact
-- physical row" handle for a delete-all-but-one-per-group query.
delete from public.clinics c
using (
  select npi, max(created_at) as keep_created_at
  from public.clinics
  group by npi
  having count(*) > 1
) dupes
where c.npi = dupes.npi
  and c.created_at <> dupes.keep_created_at;

-- Guard against the (rare) case of two rows sharing both npi AND the exact
-- same created_at timestamp -- the above would leave both. Break ties by max(id).
delete from public.clinics c
using (
  select npi, max(id) as keep_id
  from public.clinics
  group by npi
  having count(*) > 1
) dupes
where c.npi = dupes.npi
  and c.id <> dupes.keep_id;

-- Now safe: exactly one row per npi.
alter table public.clinics
  add constraint clinics_npi_unique unique (npi);

commit;

-- ===========================================================================
-- VERIFY
-- ===========================================================================
-- Expect 0 rows.
-- select npi, count(*) from public.clinics group by npi having count(*) > 1;
--
-- Expect one row, contype = 'u'.
-- select conname, contype from pg_constraint
-- where conrelid = 'public.clinics'::regclass and conname = 'clinics_npi_unique';
