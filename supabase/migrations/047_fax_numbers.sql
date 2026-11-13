-- 047: a fax column on clinics (NPI-2 organizations) and provider_individuals
-- (NPI-1 clinicians), filled from NPPES by fax-backfill.yml
-- (scripts/fax-backfill.sh). Neither table had one; fax only ever showed up
-- as a live, non-persisted NPI Registry API lookup in the dashboard popup
-- (v2/index.html), so it was never queryable.
--
-- clinic_secondary_locations gets no fax column, matching how it has no
-- phone column either: a secondary site is aliased to its parent NPI and
-- uses the parent's numbers.
--
-- Adding a nullable column with no default only changes the catalog, so it
-- is instant. The backfill job runs this file itself in apply mode; it is
-- also safe to run in the SQL editor.
alter table public.clinics add column if not exists fax text;
comment on column public.clinics.fax is 'Practice fax from NPPES (10 digits), filled by fax-backfill';

alter table public.provider_individuals add column if not exists fax text;
comment on column public.provider_individuals.fax is 'Practice fax from NPPES (10 digits), filled by fax-backfill';
