-- SECURITY FIX. Closes public reads of the retired v1 access tables.
--
-- Found 2026-10-06 by the first schema snapshot (supabase/schema/public.sql).
-- access_requests (name, email, organization, reason) and access_codes
-- (email, one-time code) each had policies with USING (true) and no role,
-- so anyone holding the publishable key, which ships in every page of the
-- site, could read every row. access_requests also let anon insert.
-- Nothing in the repo reads or writes either table any more: the v1 site
-- that used them is retired.
--
-- After this runs, RLS stays enabled with no policies, the same access model
-- as migration 008's tables: anon and authenticated get nothing, the service
-- role (Supabase dashboard, server code) still sees everything. No data is
-- deleted; decide separately whether v1's rows are still worth keeping.
--
-- Safe to re-run. VERIFY with the publishable key afterwards, not with SQL
-- (see 011/012: a policy fix that "succeeded" once changed nothing):
--   curl -s "$SUPABASE_URL/rest/v1/access_requests?select=id&limit=1" -H "apikey: <publishable key>"
--   curl -s "$SUPABASE_URL/rest/v1/access_codes?select=id&limit=1"    -H "apikey: <publishable key>"
-- Both must return a "permission denied" error (code 42501), not rows.
-- Tested locally 2026-10-06: anon read 1 row before, permission denied
-- after, rows kept, second run harmless.

begin;

alter table public.access_requests enable row level security;
alter table public.access_codes    enable row level security;

drop policy if exists "Allow public read requests"   on public.access_requests;
drop policy if exists "Public can submit requests"   on public.access_requests;
drop policy if exists "Allow public read codes"      on public.access_codes;
drop policy if exists "Public read codes"            on public.access_codes;

-- Belt and braces: no table privileges for the public roles either, so a
-- policy added by mistake later still can't expose these rows.
revoke all on public.access_requests from anon, authenticated;
revoke all on public.access_codes    from anon, authenticated;

commit;
