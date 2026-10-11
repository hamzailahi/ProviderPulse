-- Procedure data beyond Medicare Part B (2026-10-11), for the dashboard's
-- Procedures panel toggle. Three public, aggregate tables, filled by the
-- "Procedure tables" workflow (scripts/build-procedure-tables.py); nothing
-- here inserts data. Column facts come from supabase/reference/
-- procedure-sources/ (discovery run 2026-10-11).
--
--   medicaid_procedures            HHS Medicaid Provider Spending by HCPCS
--                                  (T-MSIS), newest year, summed per ZIP,
--                                  specialty and procedure code. HHS hides
--                                  cells under 12 patients before release.
--                                  patient_months adds monthly unique patient
--                                  counts, so one patient seen in three months
--                                  counts three times: it is not a head count.
--   medicare_hospital_procedures   CMS Medicare Outpatient Hospitals (APC) and
--                                  Inpatient Hospitals (DRG) by provider and
--                                  service, newest year, one row per hospital
--                                  and code.
--   procedure_codes                code descriptions for Medicaid rows (the
--                                  Medicaid file has none), from CMS's own
--                                  published files.
--
-- Public read, like cms_procedures_full: every figure is already published
-- by HHS or CMS. Only the service role writes.
--
-- Run in the Supabase SQL editor. Safe to re-run.

create table if not exists public.medicaid_procedures (
  zip             varchar(5) not null,
  specialty       text       not null,
  code            varchar(5) not null,
  claims          bigint     not null,
  patient_months  bigint     not null,
  paid            numeric(16,2) not null,
  providers       integer    not null,
  year            smallint   not null,
  primary key (zip, specialty, code)
);

create table if not exists public.medicare_hospital_procedures (
  setting      text       not null check (setting in ('outpatient', 'inpatient')),
  ccn          varchar(10) not null,
  hospital     text       not null,
  zip          varchar(5) not null,
  code         varchar(10) not null,
  description  text,
  patients     integer,           -- outpatient: beneficiaries; inpatient: discharges
  services     integer,           -- outpatient: services; inpatient: null
  avg_charge   numeric(14,2),
  avg_allowed  numeric(14,2),     -- outpatient only; inpatient: average total payment
  avg_paid     numeric(14,2),     -- Medicare's own payment
  year         smallint   not null,
  primary key (setting, ccn, code)
);
create index if not exists medicare_hospital_procedures_zip_idx
  on public.medicare_hospital_procedures (zip, setting);

create table if not exists public.procedure_codes (
  code         varchar(5) primary key,
  description  text not null,
  source       text not null
);

alter table public.medicaid_procedures enable row level security;
alter table public.medicare_hospital_procedures enable row level security;
alter table public.procedure_codes enable row level security;

drop policy if exists "medicaid_procedures public read" on public.medicaid_procedures;
create policy "medicaid_procedures public read" on public.medicaid_procedures for select using (true);
drop policy if exists "medicare_hospital_procedures public read" on public.medicare_hospital_procedures;
create policy "medicare_hospital_procedures public read" on public.medicare_hospital_procedures for select using (true);
drop policy if exists "procedure_codes public read" on public.procedure_codes;
create policy "procedure_codes public read" on public.procedure_codes for select using (true);

grant select on public.medicaid_procedures, public.medicare_hospital_procedures, public.procedure_codes to anon, authenticated;
