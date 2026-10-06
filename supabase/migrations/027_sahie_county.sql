-- Census SAHIE (Small Area Health Insurance Estimates) by county, built by
-- scripts/import-sahie.mjs (workflow: Import Census SAHIE). Model-based, so
-- steadier than the ACS for small counties. Covers people UNDER 65 (nearly
-- everyone 65+ has Medicare); label it as an under-65 rate wherever shown.
-- Null means unknown. Public aggregate data: anyone may read, only the service
-- role writes. Run in the Supabase SQL editor, then run the import once.

create table if not exists public.sahie_county (
  fips               text primary key,
  county             text,
  year               integer not null,
  under65            integer,
  uninsured          integer,
  uninsured_pct      numeric,
  uninsured_pct_moe  numeric,
  refreshed_at       timestamptz not null default now()
);

alter table public.sahie_county enable row level security;

drop policy if exists "sahie_county public read" on public.sahie_county;
create policy "sahie_county public read" on public.sahie_county
  for select using (true);
