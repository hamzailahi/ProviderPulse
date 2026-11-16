-- 048: "fax via organization" (2026-11-16, the user's rule). A clinician with
-- no fax of their own may show the fax of the organization they work for,
-- labelled with its name, only when Medicare's reassignment list has them
-- billing through that organization AND their own NPPES practice address is
-- the organization's address. Filled by fax-via-org.yml
-- (scripts/fax-via-org.sh, rules in scripts/lib/fax-via-org.mjs).
--
-- The columns are added to clinics too, always null there, so one select
-- list works on both directory tables (providerBoxQuery in directory.js asks
-- both with the same columns). Nullable with no default: catalog only,
-- instant. Kept apart from fax, which stays the listing's own NPPES fax.
alter table public.provider_individuals add column if not exists org_fax text;
alter table public.provider_individuals add column if not exists org_fax_npi text;
alter table public.provider_individuals add column if not exists org_fax_name text;
comment on column public.provider_individuals.org_fax is 'Fax of the organization this clinician bills through in Medicare, at the same address; only when fax is null (fax-via-org)';
comment on column public.provider_individuals.org_fax_npi is 'NPI of the organization org_fax belongs to';
comment on column public.provider_individuals.org_fax_name is 'Name of the organization org_fax belongs to, shown as "via <name>"';

alter table public.clinics add column if not exists org_fax text;
alter table public.clinics add column if not exists org_fax_npi text;
alter table public.clinics add column if not exists org_fax_name text;
comment on column public.clinics.org_fax is 'Always null: present so one select list serves both directory tables (048)';
