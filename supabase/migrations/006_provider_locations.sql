-- Practice locations: one account, many sites.
--
-- WHY THIS EXISTS
-- provider_profiles is keyed by auth user id, so it holds exactly one address.
-- A provider who registered and typed a second practice address had nowhere to
-- put it, and the map kept drawing their pin at the NPPES registry address
-- because the claim overlay carries no coordinates at all.
--
-- THE VERIFICATION RULE THIS TABLE ENCODES
-- NPPES issues an NPI per location/subpart, so only the address tied to the
-- registered NPI is federally verified. Every other location on this table is
-- SELF-REPORTED, and `verified` records that difference honestly. The map must
-- render the two differently -- a self-reported site may not wear the teal
-- NPI-verified ring, or the ring stops meaning anything.
--
-- Coordinates are stored, not derived at render time: geocoding is a slow
-- external call and the map draws hundreds of pins. provider-locations.js
-- geocodes on save and writes the result here.
--
-- Safe to run more than once.

create table if not exists public.provider_locations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id) on delete cascade,

  -- The NPI for THIS site when it has its own (NPI-2 subpart). Null means the
  -- location is covered by the account's primary NPI but not separately
  -- registered, which is exactly the case that cannot be called verified.
  npi text,

  label text,                       -- "Main office", "Saturday clinic"
  address_line text not null,
  city text,
  state text,
  zip text,

  latitude double precision,
  longitude double precision,
  -- Set false when a geocode attempt failed, so the UI can say "we could not
  -- find this address" instead of silently dropping the pin.
  geocoded boolean not null default false,

  -- True only when this address came from (or was matched against) NPPES.
  -- Never set this from user input.
  verified boolean not null default false,

  phone text,
  accepting_new_patients boolean,
  telehealth boolean,
  office_hours jsonb,
  hours_note text,

  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The map's hot path: "every location with coordinates".
create index if not exists provider_locations_provider_idx
  on public.provider_locations (provider_id);
create index if not exists provider_locations_geo_idx
  on public.provider_locations (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists provider_locations_zip_idx
  on public.provider_locations (zip);

-- One primary per provider. A partial unique index rather than a constraint,
-- because only the `true` rows must be unique.
create unique index if not exists provider_locations_one_primary
  on public.provider_locations (provider_id)
  where is_primary;

alter table public.provider_locations enable row level security;

-- Self-only write. Matches provider_profiles: the owner manages their own rows,
-- and the public read path goes through providers-public.js under the service
-- role so the published column list stays the single security boundary.
drop policy if exists "own locations select" on public.provider_locations;
create policy "own locations select" on public.provider_locations
  for select using (auth.uid() = provider_id);

drop policy if exists "own locations insert" on public.provider_locations;
create policy "own locations insert" on public.provider_locations
  for insert with check (auth.uid() = provider_id);

drop policy if exists "own locations update" on public.provider_locations;
create policy "own locations update" on public.provider_locations
  for update using (auth.uid() = provider_id) with check (auth.uid() = provider_id);

drop policy if exists "own locations delete" on public.provider_locations;
create policy "own locations delete" on public.provider_locations
  for delete using (auth.uid() = provider_id);

-- ---------------------------------------------------------------------------
-- Backfill: give every existing registered provider their current address as a
-- primary, verified location, so nobody loses the site they already published.
-- Coordinates stay null; provider-locations.js fills them on first save, and
-- the map keeps falling back to the clinics row until then.
-- ---------------------------------------------------------------------------
insert into public.provider_locations
  (provider_id, npi, label, address_line, city, state, zip, phone, verified, is_primary)
select p.id, p.npi, 'Main office', p.address_line, p.city, p.state, p.zip, p.phone, true, true
from public.provider_profiles p
where p.address_line is not null
  and not exists (
    select 1 from public.provider_locations l where l.provider_id = p.id
  );
