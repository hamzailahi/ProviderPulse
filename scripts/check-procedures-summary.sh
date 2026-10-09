#!/usr/bin/env bash
# Read-only check that cms_procedures_by_zip (migration 031) carries exactly
# what the dashboard's Procedures panel computes from cms_procedures_full,
# before 032 drops the per-provider table. Compares whole-table totals, then
# every (specialty, code) cell the panel would show for ZIP 38017 and the ten
# busiest ZIPs. Writes supabase/reference/procedures-summary-check.md and exits
# 1 on any mismatch. Usage: SUPABASE_DB_URL=postgresql://... scripts/check-procedures-summary.sh
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
OUT=supabase/reference/procedures-summary-check.md
q() { psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 -At -F '|' -c "begin transaction read only; set local statement_timeout = '20min'; $1; commit;"; }

totals=$(q "select
  (select count(*) from public.cms_procedures_full where zip is not null),
  (select sum(providers) from public.cms_procedures_by_zip),
  (select coalesce(sum(tot_benes),0) from public.cms_procedures_full where zip is not null),
  (select sum(tot_benes) from public.cms_procedures_by_zip),
  (select coalesce(sum(avg_mdcr_pymt_amt),0) from public.cms_procedures_full where zip is not null),
  (select sum(sum_avg_mdcr_pymt_amt) from public.cms_procedures_by_zip),
  (select count(*) from public.cms_procedures_by_zip),
  pg_size_pretty(pg_total_relation_size('public.cms_procedures_full')),
  pg_size_pretty(pg_total_relation_size('public.cms_procedures_by_zip'))")
IFS='|' read -r rows_old rows_sum benes_old benes_new pay_old pay_new summary_rows size_old size_new <<< "$totals"

zips=$(q "select string_agg(quote_literal(zip), ',') from (select zip from public.cms_procedures_by_zip group by zip order by sum(providers) desc limit 10) z")
zips="'38017',$zips"

# The panel groups by (specialty or 'Unknown', code) across the loaded ZIPs and
# shows sums, and each average as sum of averages / rows. Compare per ZIP.
cells=$(q "with old as (
    select zip, coalesce(nullif(specialty,''),'Unknown') sp, hcpcs_cd cd, coalesce(sum(tot_benes),0) b, coalesce(sum(tot_srvcs),0) s,
      coalesce(sum(avg_sbmtd_chrg),0) a1, coalesce(sum(avg_mdcr_alowd_amt),0) a2, coalesce(sum(avg_mdcr_pymt_amt),0) a3, count(*) n
    from public.cms_procedures_full where zip in ($zips) group by 1,2,3),
  new as (
    select zip, coalesce(nullif(specialty,''),'Unknown') sp, hcpcs_cd cd, sum(tot_benes) b, sum(tot_srvcs) s,
      sum(sum_avg_sbmtd_chrg) a1, sum(sum_avg_mdcr_alowd_amt) a2, sum(sum_avg_mdcr_pymt_amt) a3, sum(providers) n
    from public.cms_procedures_by_zip where zip in ($zips) group by 1,2,3)
  select count(*), count(*) filter (where o.zip is null or n.zip is null or o.b <> n.b or o.s <> n.s or o.a1 <> n.a1 or o.a2 <> n.a2 or o.a3 <> n.a3 or o.n <> n.n),
         coalesce(sum(o.n),0), (select count(*) from new)
  from old o full join new n on o.zip = n.zip and o.sp = n.sp and o.cd is not distinct from n.cd")
IFS='|' read -r cell_count cell_diff rows_in_zips summary_rows_in_zips <<< "$cells"

ok=yes
[ "$rows_old" = "$rows_sum" ] && [ "$benes_old" = "$benes_new" ] && [ "$pay_old" = "$pay_new" ] && [ "$cell_diff" = "0" ] || ok=no
{
  echo "# Procedures summary check"
  echo
  echo "Read-only comparison of \`cms_procedures_full\` with \`cms_procedures_by_zip\` (migration 031), $(date -u +%F' '%H:%M) UTC. Result: **$([ $ok = yes ] && echo 'MATCH' || echo 'MISMATCH')**."
  echo
  echo "| Check | Per-provider table | Summary |"
  echo "|---|---|---|"
  echo "| Rows with a ZIP / providers summed | $rows_old | $rows_sum |"
  echo "| Total patients (tot_benes) | $benes_old | $benes_new |"
  echo "| Sum of average Medicare payments | $pay_old | $pay_new |"
  echo "| Table size | $size_old | $size_new |"
  echo "| Rows | $rows_old | $summary_rows |"
  echo
  echo "Panel cells compared for 38017 and the ten busiest ZIPs: $cell_count, differing: **$cell_diff**. Those ZIPs: $rows_in_zips per-provider rows against $summary_rows_in_zips summary rows."
} > "$OUT"
cat "$OUT"
[ $ok = yes ] || { echo "::error::The summary does not match the per-provider table. Do not run 032."; exit 1; }
