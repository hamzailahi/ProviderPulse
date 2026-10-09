-- ABANDONED 2026-10-09: do not run. The build was too slow on this database's
-- disk and the user chose to keep cms_procedures_full. Migration 033 ends any
-- build still running and drops the summary. Kept as a record.
--
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
-- SAFE TO RUN NOW: it only reads cms_procedures_full and creates a new table.
-- Nothing is dropped here; dropping the old table is migration 032, after the
-- check in scripts/check-procedures-summary.sh (workflow "Procedures summary
-- check") shows old and new agree. Re-running rebuilds the summary from scratch.
--
-- WHY 100 BATCHES. The first version summarized all 9.8M rows in one GROUP BY
-- and failed on 2026-10-09 with "could not extend file ... No space left on
-- device": a single aggregation that size writes gigabytes of temporary sort
-- files on top of the new table and its write-ahead log, and only 2.9 GB was
-- free. It ran in one transaction, so it rolled back cleanly. Here each batch
-- covers one two-digit ZIP prefix (about 1% of the rows, read through the
-- existing zip index), so its temporary files are small and freed before the
-- next batch starts. The ranges are contiguous: the first batch also takes
-- anything sorting below '01' and the last anything from '99' up, so every row
-- with a ZIP lands in exactly one batch.
--
-- Paste the whole file into the SQL editor and run it. Grow the disk first if
-- free space is under about 3 GB (Settings, Compute and Disk).

set statement_timeout = '30min';

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
-- panel does today (parseFloat(null || 0) adds 0; count += 1 per row). Rows
-- without a ZIP are left out: the panel filters by ZIP, so they never showed.
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip < '01' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '01' and zip < '02' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '02' and zip < '03' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '03' and zip < '04' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '04' and zip < '05' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '05' and zip < '06' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '06' and zip < '07' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '07' and zip < '08' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '08' and zip < '09' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '09' and zip < '10' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '10' and zip < '11' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '11' and zip < '12' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '12' and zip < '13' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '13' and zip < '14' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '14' and zip < '15' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '15' and zip < '16' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '16' and zip < '17' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '17' and zip < '18' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '18' and zip < '19' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '19' and zip < '20' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '20' and zip < '21' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '21' and zip < '22' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '22' and zip < '23' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '23' and zip < '24' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '24' and zip < '25' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '25' and zip < '26' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '26' and zip < '27' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '27' and zip < '28' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '28' and zip < '29' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '29' and zip < '30' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '30' and zip < '31' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '31' and zip < '32' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '32' and zip < '33' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '33' and zip < '34' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '34' and zip < '35' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '35' and zip < '36' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '36' and zip < '37' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '37' and zip < '38' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '38' and zip < '39' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '39' and zip < '40' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '40' and zip < '41' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '41' and zip < '42' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '42' and zip < '43' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '43' and zip < '44' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '44' and zip < '45' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '45' and zip < '46' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '46' and zip < '47' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '47' and zip < '48' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '48' and zip < '49' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '49' and zip < '50' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '50' and zip < '51' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '51' and zip < '52' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '52' and zip < '53' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '53' and zip < '54' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '54' and zip < '55' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '55' and zip < '56' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '56' and zip < '57' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '57' and zip < '58' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '58' and zip < '59' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '59' and zip < '60' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '60' and zip < '61' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '61' and zip < '62' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '62' and zip < '63' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '63' and zip < '64' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '64' and zip < '65' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '65' and zip < '66' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '66' and zip < '67' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '67' and zip < '68' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '68' and zip < '69' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '69' and zip < '70' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '70' and zip < '71' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '71' and zip < '72' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '72' and zip < '73' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '73' and zip < '74' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '74' and zip < '75' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '75' and zip < '76' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '76' and zip < '77' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '77' and zip < '78' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '78' and zip < '79' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '79' and zip < '80' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '80' and zip < '81' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '81' and zip < '82' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '82' and zip < '83' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '83' and zip < '84' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '84' and zip < '85' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '85' and zip < '86' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '86' and zip < '87' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '87' and zip < '88' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '88' and zip < '89' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '89' and zip < '90' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '90' and zip < '91' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '91' and zip < '92' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '92' and zip < '93' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '93' and zip < '94' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '94' and zip < '95' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '95' and zip < '96' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '96' and zip < '97' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '97' and zip < '98' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '98' and zip < '99' group by zip, specialty, hcpcs_cd;
insert into public.cms_procedures_by_zip
select zip, specialty, hcpcs_cd, max(hcpcs_desc), coalesce(sum(tot_benes),0), coalesce(sum(tot_srvcs),0), coalesce(sum(avg_sbmtd_chrg),0), coalesce(sum(avg_mdcr_alowd_amt),0), coalesce(sum(avg_mdcr_pymt_amt),0), count(*)::int
from public.cms_procedures_full where zip is not null and zip >= '99' group by zip, specialty, hcpcs_cd;

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

-- Report, for the record (read the result pane):
select count(*) as summary_rows,
       sum(providers) as provider_rows_summarized,
       pg_size_pretty(pg_total_relation_size('public.cms_procedures_by_zip')) as summary_size
from public.cms_procedures_by_zip;
