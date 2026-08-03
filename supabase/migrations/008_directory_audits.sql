-- Directory Accuracy Engine: behavioural ground truth, audit runs, findings,
-- and the demand log.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file into
-- the Supabase SQL editor and run it by hand, then tell Claude it is applied --
-- a file existing in supabase/migrations/ does not mean it has been run.
--
-- Safe to run more than once: every statement is create-if-not-exists or a
-- guarded policy drop/create, and nothing here rewrites existing rows.
--
-- ---------------------------------------------------------------------------
-- WHY THESE FOUR TABLES SHARE ONE MIGRATION
--
-- npi_activity / directory_audits / audit_findings are the paid product: cache
-- the behavioural signals, record what each audit run examined, and store one
-- decomposable finding per provider. demand_log rides along only to save a
-- second round of hand-pasting; it belongs to Phase 2 and is otherwise
-- unrelated.
--
-- ACCESS MODEL FOR ALL FOUR: RLS is enabled and **no policies are created**.
-- In Postgres, RLS-enabled with zero policies denies every role that is subject
-- to RLS -- which is exactly `anon` and `authenticated`. The service role
-- bypasses RLS entirely, so the Netlify functions can still read and write.
-- That is the whole access model: no policy is not an oversight here, it IS the
-- control. Do not add a policy to any of these tables without a specific reason;
-- adding one to demand_log in particular would expose search behaviour.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- 1. npi_activity -- behavioural ground truth, fed by the monthly GitHub Action
-- ===========================================================================
-- NPPES proves an NPI was issued. It cannot say whether anyone is still
-- practising under it. Medicare claims volume and PECOS enrolment are the
-- closest public proxies for "this provider is actually active", which is the
-- signal a stale directory entry fails.
--
-- Unlike leie_exclusions this table is UPSERT-keyed on npi rather than fully
-- refreshed. Absence of a row here is NOT a negative finding -- it means
-- unknown, and the scoring module must treat it that way. A full delete-then-
-- insert would therefore be pointless churn, and a partially-failed refresh
-- would look like mass inactivity.
create table if not exists public.npi_activity (
  npi text primary key,

  -- Latest CMS data year in which this NPI appears with billed services, and
  -- how many services that year. Nullable: not every provider bills Medicare
  -- (paediatrics and OB in particular), so null must never read as "inactive".
  last_medicare_activity_year int,
  medicare_services_count int,

  -- Present in the PECOS Order & Referring file, i.e. currently enrolled and
  -- eligible to order/refer. Nullable for the same reason.
  pecos_enrolled boolean,

  -- Which import produced this row, e.g. 'cms_puf_2024+pecos'. Lets a later
  -- import explain why a row disagrees with an older one.
  source text,
  refreshed_at timestamptz not null default now()
);

-- The scoring module reads these by NPI in batches (in.(...)), so the primary
-- key already covers the hot path. This index serves the staleness sweep
-- ("which cached rows predate the last import").
create index if not exists npi_activity_refreshed_idx
  on public.npi_activity (refreshed_at);

alter table public.npi_activity enable row level security;


-- ===========================================================================
-- 2. directory_audits -- one row per audit run
-- ===========================================================================
create table if not exists public.directory_audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Human label, e.g. 'Plan X TN sample 2026-08'. This is how a founder finds
  -- the run again; it is not a key.
  label text,

  state text,
  zip_prefixes text[],
  provider_count int,

  -- Aggregates for the report header: counts by verdict, mean confidence.
  -- jsonb rather than columns because the verdict vocabulary will change and a
  -- summary is written once and read whole.
  summary jsonb,

  -- pending  -- started, and possibly partially written. The audit runner sets
  --             this when it runs out of time budget mid-batch, so a 26s kill
  --             can never leave a run that merely LOOKS complete.
  -- complete -- every requested NPI has a finding row.
  -- failed   -- aborted; findings may be absent or partial.
  status text not null default 'pending'
    constraint directory_audits_status_chk
    check (status in ('pending', 'complete', 'failed'))
);

create index if not exists directory_audits_created_idx
  on public.directory_audits (created_at desc);

alter table public.directory_audits enable row level security;


-- ===========================================================================
-- 3. audit_findings -- one row per provider per audit
-- ===========================================================================
create table if not exists public.audit_findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.directory_audits(id) on delete cascade,
  created_at timestamptz not null default now(),

  npi text not null,
  provider_name text,

  -- The address as it appeared in the directory being audited -- NOT the NPPES
  -- address. The gap between the two is the finding.
  address_checked text,

  confidence numeric
    constraint audit_findings_confidence_chk
    check (confidence is null or (confidence >= 0 and confidence <= 1)),

  -- likely_accurate  -- signals agree the entry is current
  -- likely_stale     -- provider appears active, but this address looks wrong
  -- likely_inactive  -- provider itself shows no recent activity
  -- excluded         -- OIG LEIE NPI match; confidence forced to 0
  -- unverifiable     -- too many unknown signals to judge. NOT a synonym for
  --                     clean; the fail-closed rule applies to scoring too.
  verdict text
    constraint audit_findings_verdict_chk
    check (verdict is null or verdict in
      ('likely_accurate', 'likely_stale', 'likely_inactive', 'excluded', 'unverifiable')),

  -- The decomposed per-signal results: [{name, value, weight, direction, detail}].
  -- Every score must be explainable from this array alone -- it is what the
  -- narrative is generated from and what a payer will challenge.
  signals jsonb,

  -- Claude-written rationale. Nullable because narration is a second pass and
  -- a finding is valid without it.
  narrative text
);

-- Report generation reads all findings for one audit, worst-first.
create index if not exists audit_findings_audit_idx
  on public.audit_findings (audit_id, confidence);
-- "What have we ever concluded about this NPI" across runs.
create index if not exists audit_findings_npi_idx
  on public.audit_findings (npi);

alter table public.audit_findings enable row level security;


-- ===========================================================================
-- 4. demand_log -- Phase 2. What was searched for, never who searched.
-- ===========================================================================
-- PRIVACY IS THE SCHEMA. There is deliberately no user id, no session id, no
-- IP, no chat text, and no free-text query column -- and none may be added.
-- The whole value of this table is aggregate demand ("how many people looked
-- for cardiology in 38017"), and every one of those columns would turn an
-- aggregate into a behavioural profile of a named patient. patient_profiles is
-- PHI; this table must never become a join key back to it.
--
-- `payer` is the plan NAME only (e.g. 'TennCare'), copied from the searcher's
-- profile. A payer name alone is not PHI and is what makes network-adequacy
-- analysis possible, but it is the ONLY thing that crosses over from the
-- patient record.
create table if not exists public.demand_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  zip text,
  taxonomies text[],
  payer text,

  source text
    constraint demand_log_source_chk
    check (source is null or source in ('navigator', 'specialty_browser')),

  -- How many providers the search actually returned. A ZIP with high demand and
  -- low matched_count is the shortage signal worth selling.
  matched_count int
);

-- demand-stats groups by taxonomy for one ZIP over a trailing 90 days.
create index if not exists demand_log_zip_created_idx
  on public.demand_log (zip, created_at desc);
-- Grouping by taxonomy across a ZIP set.
create index if not exists demand_log_taxonomies_idx
  on public.demand_log using gin (taxonomies);

alter table public.demand_log enable row level security;


-- ===========================================================================
-- VERIFY
-- ===========================================================================
-- Expect four rows, every one rls_enabled = true and policy_count = 0.
-- A policy_count above 0 on any of these means someone granted anon or
-- authenticated access to audit or search-behaviour data -- investigate before
-- proceeding.
select
  c.relname                          as table_name,
  c.relrowsecurity                   as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('npi_activity', 'directory_audits', 'audit_findings', 'demand_log')
order by c.relname;
