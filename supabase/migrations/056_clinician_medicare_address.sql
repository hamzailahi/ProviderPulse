-- 056: clinician addresses corrected from Medicare enrollment (2026-11-20, the
-- user's choice after supabase/reference/address-check.md: about 139,000
-- clinicians are listed in a state their Medicare enrollment no longer shows;
-- two the user named had moved, New Orleans to Mobile AL and Charlotte to
-- Jersey City NJ).
--
-- provider_individuals keeps one displayed address. When CMS Doctors and
-- Clinicians (Medicare enrollment, monthly) places a clinician only in other
-- states, the displayed address becomes the Medicare one and the NPPES
-- address is kept beside it, so the change is reversible and visible:
--   address_source   null = NPPES, 'medicare' = CMS enrollment
--   address_checked  the CMS release the Medicare address came from
--   nppes_*          the NPPES address and pin it replaced
-- clinician_medicare_sites: the other Medicare practice addresses of
-- clinicians listed in the right state but another ZIP ("also practises at").
-- Written only by scripts/address-apply.sh (address-check.yml). Public data.

alter table public.provider_individuals
  add column if not exists address_source text check (address_source in ('medicare')),
  add column if not exists address_checked date,
  add column if not exists nppes_address text,
  add column if not exists nppes_city text,
  add column if not exists nppes_state text,
  add column if not exists nppes_zip text,
  add column if not exists nppes_latitude numeric,
  add column if not exists nppes_longitude numeric;

create table if not exists public.clinician_medicare_sites (
  npi text not null,
  address text not null,
  city text,
  state text,
  zip text,
  facility text,
  release_date date,
  primary key (npi, address, zip)
);

alter table public.clinician_medicare_sites enable row level security;
drop policy if exists clinician_medicare_sites_read on public.clinician_medicare_sites;
create policy clinician_medicare_sites_read on public.clinician_medicare_sites for select using (true);
revoke insert, update, delete on public.clinician_medicare_sites from anon, authenticated;
grant select on public.clinician_medicare_sites to anon, authenticated;
