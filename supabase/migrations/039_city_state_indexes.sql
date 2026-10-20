-- City and state indexes on provider_individuals and
-- clinic_secondary_locations (clinics already has idx_clinics_city and
-- idx_clinics_state).
--
-- Why (2026-10-20, found by the live dashboard audit): the dashboard's
-- Explore searches by city ("Collierville, TN", "Memphis") and by state
-- ("RI") filter on city and state. Without an index both tables were scanned
-- whole and timed out at the public role's 3-second limit (57014), while
-- clinics answered in 0.6s, so the map silently showed organizations only:
-- Collierville, TN drew 221 listings against 988 for its ZIP.
--
-- (state, city) serves "City, ST" and a state alone; (city) serves a city
-- typed without a state. CONCURRENTLY cannot run in the SQL editor's
-- transaction: run it with the "Concurrent indexes" workflow (choose 039),
-- or paste ONE statement at a time. Safe to re-run.

create index concurrently if not exists provider_individuals_state_city_idx
  on public.provider_individuals (state, city);
create index concurrently if not exists provider_individuals_city_idx
  on public.provider_individuals (city);
create index concurrently if not exists clinic_secondary_locations_state_city_idx
  on public.clinic_secondary_locations (state, city);
create index concurrently if not exists clinic_secondary_locations_city_idx
  on public.clinic_secondary_locations (city);
