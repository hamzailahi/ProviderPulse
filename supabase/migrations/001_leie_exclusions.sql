-- OIG exclusions list (LEIE), used by auth-register-provider.js to screen
-- providers at registration.
--
-- NOTE: NPI is deliberately NOT the primary key. Only ~10.5% of LEIE records
-- carry an NPI at all (8,586 distinct out of 83,665 records), and 177 NPIs
-- appear more than once. A NPI primary key cannot hold this data.
--
-- Populated by scripts/import-leie.mjs, run monthly by
-- .github/workflows/leie-import.yml. Until that has run at least once, the
-- exclusion check is inert — a missing or empty table is treated as "unknown",
-- never as "cleared".
--
-- Safe to run more than once.

create table if not exists public.leie_exclusions (
  id            bigint generated always as identity primary key,
  npi           text,
  last_name     text,
  first_name    text,
  mid_name      text,
  business_name text,
  general       text,
  specialty     text,
  city          text,
  state         text,
  zip           text,
  excl_type     text,
  excl_date     date,
  rein_date     date
);

create index if not exists leie_npi_idx  on public.leie_exclusions (npi) where npi is not null;
create index if not exists leie_name_idx on public.leie_exclusions (last_name, first_name);

-- Service-role only: the registration function reads it, nobody else should.
-- RLS with no policy denies anon and authenticated by default, which is intended.
alter table public.leie_exclusions enable row level security;
