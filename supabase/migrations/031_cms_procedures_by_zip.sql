-- ZIP-level summary of cms_procedures_full, for the dashboard's Procedures
-- panel (v2/index.html, fetchProceduresData).
--
-- Why: cms_procedures_full is 4.0 GB (9.8M rows, 28 columns, one row per
-- provider per procedure code), half the database. The panel reads 8 columns
-- by ZIP and immediately adds the rows up per specialty and code: it sums
-- tot_benes and tot_srvcs, sums each avg_* column, counts rows, and shows
-- each average as sum / count. This table stores exactly those sums and that
-- count per (zip, specialty, hcpcs_cd), so the panel's figures are identical
-- and it downloads one row where it used to download one per provider.
--
-- SAFE TO RUN NOW: it only reads cms_procedures_full and creates a new table
-- (about 0.5 to 1 GB, fits in today's free space). Nothing is dropped here;
-- dropping the old table is migration 032, after the check in
-- scripts/check-procedures-summary.sh (workflow "Procedures summary check")
-- shows old and new agree. Re-running rebuilds the summary from scratch.
--
-- Paste the whole file into the SQL editor and run it as ONE execution.
-- It reads 9.8M rows, so allow a few minutes.

begin;
set local statement_timeout = '30min';

drop table if exists public.cms_procedures_by_zip;

create table public.cms_procedures_by_zip (
  zip                     varchar(5) not null,
  specialty               text,
  hcpcs_cd                varchar(10),
  hcpcs_desc              text,
  tot_benes               numeric not null,   -- sum over providers
  tot_srvcs               numeric not null,   -- sum over providers
  sum_avg_sbmtd_chrg      numeric not null,   -- sum of each provider's average
  sum_avg_mdcr_alowd_amt  numeric not null,
  sum_avg_mdcr_pymt_amt   numeric not null,
  providers               integer not null    -- rows summed (the panel's divisor)
);

-- sum() skips nulls and count(*) counts every row, which is exactly what the
-- panel does today (parseFloat(null || 0) adds 0; count += 1 per row).
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc),
       coalesce(sum(tot_benes), 0), coalesce(sum(tot_srvcs), 0),
       coalesce(sum(avg_sbmtd_chrg), 0), coalesce(sum(avg_mdcr_alowd_amt), 0),
       coalesce(sum(avg_mdcr_pymt_amt), 0), count(*)::int
from public.cms_procedures_full
where zip is not null  -- the panel filters by ZIP, so rows without one never showed
group by zip, specialty, hcpcs_cd;

-- One row per (zip, specialty, hcpcs_cd). NULLS NOT DISTINCT keeps a null
-- specialty or code unique too, so paging ordered by these columns is stable.
create unique index cms_procedures_by_zip_key
  on public.cms_procedures_by_zip (zip, specialty, hcpcs_cd) nulls not distinct;

alter table public.cms_procedures_by_zip enable row level security;
drop policy if exists "cms_procedures_by_zip public read" on public.cms_procedures_by_zip;
create policy "cms_procedures_by_zip public read" on public.cms_procedures_by_zip
  for select to anon, authenticated using (true);
grant select on public.cms_procedures_by_zip to anon, authenticated;

analyze public.cms_procedures_by_zip;
commit;

-- Report, for the record (read the result pane):
select count(*) as summary_rows,
       pg_size_pretty(pg_total_relation_size('public.cms_procedures_by_zip')) as summary_size,
       (select count(*) from public.cms_procedures_full where zip is null) as source_rows_without_zip
from public.cms_procedures_by_zip;
