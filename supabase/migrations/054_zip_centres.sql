-- 054: ZIP centres and adults where CDC PLACES has none (2026-11-19).
--
-- market-score's catchment and the drive-time job take each ZIP's centre and
-- adult population from cdc_places (measure DENTAL). PLACES publishes no
-- Puerto Rico ZCTA (and misses a few elsewhere), so those ZIPs could not be
-- scored or routed. zip_centres holds the Census Gazetteer's internal point
-- for every ZCTA PLACES lacks, with adults estimated from census_acs_zcta's
-- age bands (ages 20+, plus two fifths of 15 to 19). Loaded only by
-- zip-centres.yml. zip_geo is the one place both are read from.

create table if not exists public.zip_centres (
  zip text primary key,
  lat numeric not null,
  lon numeric not null,
  pop_18plus integer not null,
  source text not null default 'census_gazetteer',
  gazetteer_year integer,
  loaded_at timestamptz not null default now()
);
alter table public.zip_centres enable row level security;
drop policy if exists zip_centres_read on public.zip_centres;
create policy zip_centres_read on public.zip_centres for select using (true);
revoke insert, update, delete on public.zip_centres from anon, authenticated;
grant select on public.zip_centres to anon, authenticated;

create or replace view public.zip_geo with (security_invoker = true) as
  select zip, lat, lon, pop_18plus, 'cdc_places'::text as source
    from public.cdc_places where measureid = 'DENTAL'
  union all
  select zip, lat, lon, pop_18plus, source from public.zip_centres;
grant select on public.zip_geo to anon, authenticated;
