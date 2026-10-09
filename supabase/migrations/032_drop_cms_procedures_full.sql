-- ABANDONED 2026-10-09: do not run. cms_procedures_full stays (see 033).
-- Its guard would refuse anyway once 033 has dropped the summary. Kept as a
-- record.
--
-- Drops the per-provider Medicare procedures table (4.0 GB, half the
-- database) and one unused index, now that the dashboard reads the ZIP-level
-- summary from migration 031.
--
-- RUN ONLY AFTER:
--   1. migration 031 is applied, and
--   2. the "Procedures summary check" workflow reports MATCH
--      (supabase/reference/procedures-summary-check.md).
-- The guard below refuses to drop anything unless the summary exists and its
-- row count and totals (patients, services, payments) equal the table's; it is a backstop, not a substitute for
-- the check.
--
-- NOT REVERSIBLE from inside the database. The dropped rows (one per provider
-- per procedure, with names, addresses and credentials) are CMS's public
-- "Medicare Physician & Other Practitioners - by Provider and Service" file;
-- getting them back means re-importing that file. Nothing in the product
-- reads them.
--
-- npi_activity_refreshed_idx (44 MB) was created by 008 for a staleness sweep
-- that was never built: 0 uses between May and October 2026. Recreate it if
-- that sweep is ever written.
--
-- Dropping a table returns its space to the disk at once. Paste the whole file
-- and run it as one execution.

begin;

do $$
declare
  o record;
  s record;
begin
  if to_regclass('public.cms_procedures_by_zip') is null then
    raise exception 'cms_procedures_by_zip does not exist: run migration 031 first. Nothing dropped.';
  end if;
  if to_regclass('public.cms_procedures_full') is not null then
    select count(*) as n, coalesce(sum(tot_benes),0) as b, coalesce(sum(tot_srvcs),0) as v,
           coalesce(sum(avg_mdcr_pymt_amt),0) as p
      into o from public.cms_procedures_full where zip is not null;
    select coalesce(sum(providers),0) as n, coalesce(sum(tot_benes),0) as b, coalesce(sum(tot_srvcs),0) as v,
           coalesce(sum(sum_avg_mdcr_pymt_amt),0) as p
      into s from public.cms_procedures_by_zip;
    if (o.n, o.b, o.v, o.p) is distinct from (s.n, s.b, s.v, s.p) then
      raise exception 'Summary does not match the per-provider table (rows % vs %, patients % vs %, services % vs %, payments % vs %). Rebuild 031 and rerun the check. Nothing dropped.',
        s.n, o.n, s.b, o.b, s.v, o.v, s.p, o.p;
    end if;
  end if;
end $$;

drop table if exists public.cms_procedures_full;
drop index if exists public.npi_activity_refreshed_idx;

commit;
