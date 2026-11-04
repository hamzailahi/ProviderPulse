-- 046: Medicare procedures summed per ZIP, specialty and code (2026-11-04).
--
-- The dashboard's Procedures panel reads cms_procedures_full row by row (one
-- row per clinician, code and place of service). A whole state, or a dense ZIP
-- such as 02114 (25,809 rows), times out at the public role's 3 second limit
-- (57014), so the panel showed part of the area. This table holds the same
-- figures already added up: 4.1M rows for 9.8M, built OUTSIDE the database by
-- scripts/build-procedure-summary.py (a plain COPY out, DuckDB on the runner,
-- COPY back in), because the 2026-10-09 attempt to GROUP BY inside the
-- database ran out of disk (migrations 031/032, abandoned).
--
-- Columns keep the panel's figures exact: patients and services add; the
-- panel's per-code averages are the sum of each row's average over row_count
-- (sum_avg_*); service-weighted sums and the paid amount split by billing
-- entity (I clinician, O organization) are there for weighted averages.
-- A null specialty or code from the source is stored as ''.
--
-- Public read like cms_procedures_full; writes only through the service role
-- (the load job). Empty until procedure-summary.yml runs in apply mode.
-- Safe to re-run.
create table if not exists public.medicare_procedures_zip (
  zip text not null,
  specialty text not null,
  hcpcs_cd text not null,
  hcpcs_desc text,
  row_count integer not null,
  billers integer not null,
  tot_benes double precision,
  tot_srvcs double precision,
  sum_avg_charge double precision,
  sum_avg_allowed double precision,
  sum_avg_paid double precision,
  allowed_x_srvcs double precision,
  paid_x_srvcs double precision,
  srvcs_i double precision,
  paid_x_srvcs_i double precision,
  srvcs_o double precision,
  paid_x_srvcs_o double precision,
  primary key (zip, specialty, hcpcs_cd)
);
alter table public.medicare_procedures_zip enable row level security;
drop policy if exists medicare_procedures_zip_read on public.medicare_procedures_zip;
create policy medicare_procedures_zip_read on public.medicare_procedures_zip for select to anon, authenticated using (true);
revoke all on public.medicare_procedures_zip from anon, authenticated;
grant select on public.medicare_procedures_zip to anon, authenticated;
grant all on public.medicare_procedures_zip to service_role;
comment on table public.medicare_procedures_zip is 'cms_procedures_full summed per ZIP x specialty x code (procedure-summary.yml); public read';
