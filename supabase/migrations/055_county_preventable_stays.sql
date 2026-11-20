-- 055: preventable hospital stays per county (2026-11-20).
--
-- County Health Rankings' "Preventable Hospital Stays" (measure v005): hospital
-- stays for ambulatory-care-sensitive conditions per 100,000 Medicare
-- fee-for-service enrollees, from CMS data. Replaces CMS's own county PQI
-- columns in cms_county_utilization, which the Geographic Variation file now
-- publishes as "NA" for every county and year. Loaded by
-- scripts/import-chr.sh (chr-preventable-stays.yml); used by the back-test.
-- Public data only.

create table if not exists public.county_preventable_stays (
  fips text primary key check (fips ~ '^\d{5}$'),
  rate numeric not null,
  release_year integer not null,
  data_years text,
  loaded_at timestamptz not null default now()
);

alter table public.county_preventable_stays enable row level security;
drop policy if exists county_preventable_stays_read on public.county_preventable_stays;
create policy county_preventable_stays_read on public.county_preventable_stays for select using (true);
revoke insert, update, delete on public.county_preventable_stays from anon, authenticated;
grant select on public.county_preventable_stays to anon, authenticated;
