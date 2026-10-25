-- 041: "Report a wrong listing" from the patient app (listing-report.js).
-- One row per tap: the NPI and which thing was wrong, from a fixed list.
-- Deliberately nothing else: no free text (it would collect health details
-- and abuse), no user id, no IP. The Directory Accuracy audit counts the last
-- year's rows per NPI as a weak signal (lib/accuracy-signals.js).
--
-- Same access model as migration 008's tables: RLS on and NO policies, and no
-- grants to anon or authenticated, so only the service role (the function)
-- reads or writes. Do not add a policy: it would publish who was reported.
-- Safe to re-run.
create table if not exists public.listing_reports (
  id bigint generated always as identity primary key,
  npi text not null check (npi ~ '^[0-9]{10}$'),
  issue text not null check (issue in ('closed', 'moved', 'wrong_phone', 'wrong_specialty', 'not_accepting', 'other')),
  source text not null default 'patient_app' check (source in ('patient_app')),
  created_at timestamptz not null default now()
);
create index if not exists listing_reports_npi_created_idx on public.listing_reports (npi, created_at);
alter table public.listing_reports enable row level security;
revoke all on public.listing_reports from anon, authenticated;
comment on table public.listing_reports is 'Patient reports of a wrong listing (no free text, no user, no IP); service role only';
