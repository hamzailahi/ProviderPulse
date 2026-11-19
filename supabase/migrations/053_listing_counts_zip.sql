-- 053: directory listings counted per ZIP and NUCC code (2026-11-19).
--
-- market-score counted a catchment's competitors by reading every listing row
-- in up to 60 ZIPs. Around 10001 that is over 60,000 clinicians: the load hit
-- its cap and the model refused to score. This table holds the same counts
-- per ZIP, code and table, built outside the database by
-- scripts/build-listing-counts.py (listing-counts.yml), so a catchment is a
-- few thousand small rows whatever its density.
--
--   k        zip|code|src, unique, the keyset paging key
--   src      'c' clinics (NPI-2), 'i' provider_individuals (NPI-1)
--   n        listings
--   w        site-weighted listings (migration 052; clinics: = n)
--   sites    distinct NPI and point pairs
--   pinned   listings with coordinates; lat/lng is their middle
-- Secondary locations are left out, as in the live count. Public data only.

create table if not exists public.listing_counts_zip (
  k text primary key,
  zip text not null,
  taxonomy_code text not null default '',
  src char(1) not null check (src in ('c', 'i')),
  n integer not null,
  w real not null,
  sites integer not null,
  pinned integer not null,
  lat double precision,
  lng double precision,
  built_at timestamptz not null default now()
);
create index if not exists listing_counts_zip_zip_idx on public.listing_counts_zip (zip, k);

alter table public.listing_counts_zip enable row level security;
drop policy if exists listing_counts_zip_read on public.listing_counts_zip;
create policy listing_counts_zip_read on public.listing_counts_zip for select using (true);
revoke insert, update, delete on public.listing_counts_zip from anon, authenticated;
grant select on public.listing_counts_zip to anon, authenticated;
