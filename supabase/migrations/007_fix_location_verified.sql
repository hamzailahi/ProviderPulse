-- Corrects a bad assumption in 006's backfill.
--
-- 006 copied provider_profiles.address_line into provider_locations and marked
-- every row verified = true. That field is editable by the provider, so it is
-- NOT necessarily the NPPES address -- for NPI 1669794574 it held a
-- self-reported "304 Majestic Trail" while the registry says "1500 W POPLAR
-- AVE, SUITE 310". The backfill therefore stamped a self-reported address as
-- federally verified, which is precisely what makes the map's teal ring
-- meaningless.
--
-- This re-derives the flag from evidence instead of assumption: a location is
-- verified only when its street address actually appears in the NPPES record
-- (clinics.address) for that provider's NPI. Everything else becomes
-- self-reported, which is the honest default.
--
-- Safe to run more than once, and idempotent: it recomputes from clinics every
-- time rather than toggling state.

-- Normalise both sides the same way before comparing: NPPES stores
-- "1500 W POPLAR AVE, SUITE 310, Collierville, TN 38017-0601" as one string,
-- so this asks whether the location's street line appears within it.
update public.provider_locations l
set verified = coalesce((
  select lower(regexp_replace(c.address,   '[^a-zA-Z0-9]', '', 'g'))
      like '%' || lower(regexp_replace(l.address_line, '[^a-zA-Z0-9]', '', 'g')) || '%'
  from public.clinics c
  join public.provider_profiles p on p.id = l.provider_id
  where c.npi = coalesce(l.npi, p.npi)
  limit 1
), false)
where l.address_line is not null;

-- Any location with no street address cannot have been verified against
-- anything.
update public.provider_locations
set verified = false
where address_line is null or btrim(address_line) = '';

-- ---------------------------------------------------------------------------
-- Add the NPPES address itself as a verified location where it is missing.
--
-- A provider who edited their profile address effectively replaced the registry
-- address in the UI, but the registry site is still real and still the one
-- patients can independently confirm. Both should exist: one verified, one
-- self-reported, and the provider decides which is primary.
-- ---------------------------------------------------------------------------
insert into public.provider_locations
  (provider_id, npi, label, address_line, city, state, zip, verified, is_primary)
select
  p.id,
  p.npi,
  'Registry address',
  -- Keep only the street portion; the rest is duplicated in city/state/zip.
  split_part(c.address, ',', 1),
  c.city,
  c.state,
  c.zip,
  true,
  false
from public.provider_profiles p
join public.clinics c on c.npi = p.npi
where c.address is not null
  and not exists (
    select 1 from public.provider_locations l
    where l.provider_id = p.id
      and lower(regexp_replace(c.address, '[^a-zA-Z0-9]', '', 'g'))
          like '%' || lower(regexp_replace(coalesce(l.address_line, '~'), '[^a-zA-Z0-9]', '', 'g')) || '%'
  );

-- What you should see afterwards, for the Collierville account:
--   Main office      | 304 Majestic Trail          | verified = false
--   Registry address | 1500 W POPLAR AVE SUITE 310 | verified = true
--
-- Neither has coordinates yet. provider-locations.js geocodes on save, so
-- opening a location and saving it places its pin.
