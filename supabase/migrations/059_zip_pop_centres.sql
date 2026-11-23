-- 059: population-weighted ZIP centres (2026-11-23, step 10, the user's
-- go-ahead). Each ZCTA's point is the mean of its 2020 Census blocks'
-- internal points weighted by block population (TIGER/Line TABBLOCK20
-- POP20, blocks assigned to ZCTAs by the Census 2020 ZCTA-to-block
-- relationship file). The drive-time job starts each ZIP's trips here
-- instead of at the middle of the ZIP's shape. Written only by
-- zip-pop-centres.yml; public read.
create table if not exists public.zip_pop_centres (
  zip text primary key,
  lat double precision not null,
  lon double precision not null,
  pop integer not null,
  blocks integer not null,
  source text not null default 'census_2020_blocks'
);
alter table public.zip_pop_centres enable row level security;
drop policy if exists zip_pop_centres_read on public.zip_pop_centres;
create policy zip_pop_centres_read on public.zip_pop_centres for select using (true);
revoke insert, update, delete on public.zip_pop_centres from anon, authenticated;
grant select on public.zip_pop_centres to anon, authenticated;
