-- 040: a phone column on clinics (NPI-2 organizations), filled from the NPPES
-- monthly file by org-phone-backfill.yml (scripts/org-phone-backfill.sh).
-- provider_individuals already has one; clinics never did, so patient search
-- could show no number for a pharmacy, urgent care or hospital.
--
-- Adding a nullable column with no default only changes the catalog, so it is
-- instant on 1.9M rows. The backfill job runs this file itself in apply mode;
-- it is also safe to run in the SQL editor.
alter table public.clinics add column if not exists phone text;
comment on column public.clinics.phone is 'Practice phone from NPPES (10 digits), filled by org-phone-backfill';
