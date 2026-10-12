-- One row per hospital in medicare_hospital_procedures (036), with the
-- centre of its ZIP (the CDC PLACES ZCTA centroid), so the Procedures panel
-- can list hospitals within 25 miles of the area in view. Hospital data is
-- keyed by the address each hospital bills Medicare under, and a system
-- often bills several campuses under one parent (Baptist Memorial's
-- Collierville hospital under its Memphis parent), so an exact-ZIP match
-- finds nothing for most ZIPs (2026-10-12: 38017 had none; the whole 380
-- ZIP area had three hospitals).
--
-- Filled by the "Procedure tables" workflow with the other 036 tables.
-- lat/lon are null when the ZIP has no ZCTA centroid; such hospitals are
-- never placed on a distance, only matched by exact ZIP.
--
-- Run in the Supabase SQL editor. Safe to re-run.

create table if not exists public.medicare_hospitals (
  ccn       varchar(10) primary key,
  hospital  text       not null,
  zip       varchar(5) not null,
  lat       double precision,
  lon       double precision,
  year      smallint   not null
);

alter table public.medicare_hospitals enable row level security;
drop policy if exists "medicare_hospitals public read" on public.medicare_hospitals;
create policy "medicare_hospitals public read" on public.medicare_hospitals for select using (true);
grant select on public.medicare_hospitals to anon, authenticated;
