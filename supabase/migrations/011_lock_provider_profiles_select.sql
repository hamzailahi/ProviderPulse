-- URGENT SECURITY FIX. Apply this before anything else in the queue.
--
-- provider_profiles and provider_insurance are readable by ANYONE with the
-- publishable/anon key today -- no session, no auth, direct REST call. Found
-- while auditing pin-position code, unrelated to what was being worked on, and
-- confirmed live on 2026-08-05:
--
--   curl "$SUPABASE_URL/rest/v1/provider_profiles?select=id,npi" \
--     -H "apikey: <anon key straight out of v2/index.html>"
--   -> [{"id":"f316a27f-ed50-4d17-b18c-d968fd04ee84","npi":"1669794574"}]
--
-- That `id` is the Supabase AUTH USER ID -- the one column providers-public.js
-- exists specifically to keep off the public overlay (see PUBLIC_COLUMNS and
-- its comment: "NOTHING that identifies the account (id, email) ... may be
-- added"). A direct table read bypasses that allowlist entirely, because it
-- goes straight to PostgREST rather than through the function. The same
-- request also returned review_status and review_reason -- the OIG screening
-- outcome -- which was meant to stay behind the ADMIN_PASSWORD-gated review
-- queue, not sit in a public SELECT.
--
-- provider_insurance is worse in one respect: it is KEYED BY the same auth
-- user id, so anyone holding it can now read every payer a specific account
-- listed, still with no session of their own.
--
-- WHY THIS IS A DRIFT, NOT A DESIGN CHOICE. Migration 006's own comment says
-- "Self-only write [on provider_locations]. Matches provider_profiles: the
-- owner manages their own rows" -- written on the assumption that
-- provider_profiles was already self-only. provider_locations and
-- patient_profiles both verify as self-only live (an anon SELECT on either
-- returns `[]`, HTTP 200 -- RLS correctly denying rather than erroring). Only
-- provider_profiles and provider_insurance were left open. Both were created
-- in the Supabase dashboard before this repo's migrations existed (see
-- CLAUDE.md's schema section), so whatever policy shipped with them was never
-- captured in a tracked file -- there is nothing to `grep` for because it was
-- never written down.
--
-- WHAT THIS DOES NOT TOUCH. Only SELECT is changed. INSERT/UPDATE/DELETE were
-- not tested against anon (deliberately -- probing writes against a live table
-- risks corrupting the one real registered provider row that exists today) and
-- are left exactly as they are. If a write policy turns out to be equally
-- open, that is a second fix, not this one.
--
-- HOW TO APPLY. Paste into the Supabase SQL editor and run by hand, same as
-- every other file in this folder. Safe to run more than once: it enumerates
-- and drops whatever SELECT policies exist today (whatever they are named --
-- there is no tracked migration to know the name from) before creating the
-- correct one, so re-running just re-asserts the same end state.
--
-- profile.js already reads/writes through the caller's own JWT and relies on
-- RLS as the enforcement layer (per CLAUDE.md: "the function does not filter
-- beyond id=eq.<user.id>"), so a self-only SELECT policy is exactly what that
-- function has always assumed was already there.

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'provider_profiles' and cmd = 'r'
  loop
    execute format('drop policy if exists %I on public.provider_profiles', pol.policyname);
  end loop;

  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'provider_insurance' and cmd = 'r'
  loop
    execute format('drop policy if exists %I on public.provider_insurance', pol.policyname);
  end loop;
end $$;

alter table public.provider_profiles enable row level security;
alter table public.provider_insurance enable row level security;

create policy "own profile select" on public.provider_profiles
  for select using (auth.uid() = id);

-- provider_insurance.provider_id is provider_profiles.id, which is the auth
-- user id directly -- not a second layer needing a join.
create policy "own insurance select" on public.provider_insurance
  for select using (auth.uid() = provider_id);

-- The service role providers-public.js and profile.js run under bypasses RLS
-- unconditionally, so neither loses any access it has today. Only the anon and
-- authenticated-as-someone-else cases are what this closes.


-- ===========================================================================
-- VERIFY -- run all four. Expect exactly this shape:
-- ===========================================================================

-- 1. Both tables now show rls_enabled = true and exactly one SELECT policy.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname and p.cmd='r') as select_policy_count
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('provider_profiles', 'provider_insurance');

-- 2. Confirm the fix from the SQL editor's own session (which has no auth.uid(),
--    same as the anon key) -- both must now return zero rows, not an error.
--    (Run as two separate statements; this file does not execute them for you.)
-- select id, npi from public.provider_profiles;                    -- expect 0 rows
-- select provider_id, payer_name from public.provider_insurance;   -- expect 0 rows

-- 3. From a terminal, with the SAME anon key that leaked the row above:
--    curl "$SUPABASE_URL/rest/v1/provider_profiles?select=id,npi" -H "apikey: <anon key>"
--    Expect: []
--
-- 4. Confirm providers-public.js still works -- it runs under the service
--    role, which bypasses RLS, so the public map overlay must be unaffected:
--    curl "https://providerpulse-v2.netlify.app/.netlify/functions/providers-public?all=1"
--    Expect the same provider(s) as before, minus nothing.
