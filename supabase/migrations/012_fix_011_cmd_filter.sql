-- Corrects a bug in 011 that made it a no-op for the leak it was written to
-- close. URGENT, same as 011 -- apply this immediately after (or instead of
-- re-running) 011.
--
-- WHAT WENT WRONG. 011's cleanup loop and its own verify query both filtered
-- `pg_policies.cmd = 'r'`. That column holds the full command word --
-- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL' -- never the single-letter
-- code. (The single-letter code exists, but on a different, lower-level
-- catalog: pg_policy.polcmd. pg_policies is the friendlier view built on top
-- of it, and it already spells the word out.) So the loop matched nothing and
-- dropped nothing.
--
-- The practical effect: 011's `create policy "own profile select" ... for
-- select using (auth.uid() = id)` most likely DID succeed, but Postgres
-- combines multiple PERMISSIVE policies for the same command with OR, not AND.
-- Whatever pre-existing policy was letting anon read every row (a `using
-- (true)`, or RLS never having been enabled before 011 turned it on) was never
-- removed, so it kept granting access right alongside the new restrictive-
-- looking one. Confirmed live: the exact anon curl from 011 still returns full
-- rows after 011 was run.
--
-- HOW TO APPLY. SQL editor, by hand, like every migration in this folder. Safe
-- to run more than once.
--
-- This does NOT re-examine the INSERT/UPDATE/DELETE question 011 deliberately
-- left untouched. It only finishes the SELECT fix 011 was supposed to make.

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'provider_profiles' and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.provider_profiles', pol.policyname);
  end loop;

  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'provider_insurance' and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.provider_insurance', pol.policyname);
  end loop;
end $$;

alter table public.provider_profiles enable row level security;
alter table public.provider_insurance enable row level security;

create policy "own profile select" on public.provider_profiles
  for select using (auth.uid() = id);

create policy "own insurance select" on public.provider_insurance
  for select using (auth.uid() = provider_id);


-- ===========================================================================
-- VERIFY -- run all four. Expect exactly this shape:
-- ===========================================================================

-- 1. Both tables now show rls_enabled = true and EXACTLY ONE SELECT policy --
--    the count that was wrongly reported as 0 by 011's own bugged verify.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname and p.cmd='SELECT') as select_policy_count
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('provider_profiles', 'provider_insurance');

-- 2. Name every SELECT policy left on both tables. If this ever shows more
--    than one row per table, a stray permissive policy is still there and
--    still ORing its way past the self-only one -- drop it explicitly.
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename in ('provider_profiles', 'provider_insurance')
order by tablename, policyname;

-- 3. GROUND TRUTH -- this is the check that actually matters, because it is
--    the same request that leaked the row in the first place. Run from a
--    terminal with the anon key straight out of v2/index.html:
--
--    curl "$SUPABASE_URL/rest/v1/provider_profiles?select=id,npi" -H "apikey: <anon key>"
--    curl "$SUPABASE_URL/rest/v1/provider_insurance?select=provider_id,payer_name" -H "apikey: <anon key>"
--
--    Both must now return: []
--    Do not trust step 1 or 2 alone -- 011 "passed" its own verify query and
--    was still wide open, because the verify query had the identical bug.

-- 4. providers-public.js runs under the service role, which bypasses RLS
--    entirely, so the public map overlay must still work unchanged:
--    curl "https://providerpulse-v2.netlify.app/.netlify/functions/providers-public?all=1"
--    Expect the same provider(s) as before.
