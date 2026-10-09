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
# Every query's error is raised as an annotation, so a failure is readable
# from the check run without the full log.
q() {
  local out
  if ! out=$(psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 -At -F '|' -c "begin transaction read only; set local statement_timeout = '20min'; set local lock_timeout = '10s'; $1; commit;" 2>/tmp/q.err); then
    echo "::error::Query failed: $(tr '\n' ' ' < /tmp/q.err | cut -c1-400)" >&2
    return 1
  fi
  printf '%s\n' "$out"
}

# Before comparing, say plainly whether 031 has finished. The summary must
# exist, and no other session may hold a lock on it: 031 drops and recreates
# the table in one transaction, so while it runs it holds an exclusive lock.
# (pg_stat_activity hides other roles' query text, so locks are the reliable
# signal.)
exists=$(q "select to_regclass('public.cms_procedures_by_zip') is not null") || { echo "::error::Could not query the database: $(tr '\n' ' ' < /tmp/q.err | cut -c1-300)"; exit 1; }
if [ "$exists" != "t" ]; then
  msg="cms_procedures_by_zip does not exist: migration 031 has not committed. If it is not still running, run 031 again."
  echo "::error::$msg"; printf '# Procedures summary check\n\n%s\n' "$msg" > "$OUT"; exit 1
fi
held=$(q "select count(*) || ' lock(s), oldest ' || coalesce(to_char(now() - min(a.xact_start), 'HH24:MI:SS'), '?') from pg_locks l left join pg_stat_activity a on a.pid = l.pid where l.relation = 'public.cms_procedures_by_zip'::regclass and l.pid <> pg_backend_pid() and l.mode = 'AccessExclusiveLock'") || exit 1
if [ "${held%% *}" != "0" ]; then
  # What the holding session is doing, and whether the database is growing
  # (an insert in progress writes pages as it goes; a stuck session does not).
  state=$(q "select a.state || ', waiting on ' || coalesce(a.wait_event_type || '/' || a.wait_event, 'nothing') || ', current statement running ' || to_char(now() - a.query_start, 'HH24:MI:SS') from pg_locks l join pg_stat_activity a on a.pid = l.pid where l.relation = 'public.cms_procedures_by_zip'::regclass and l.pid <> pg_backend_pid() and l.mode = 'AccessExclusiveLock' limit 1") || state="unknown"
  s1=$(q "select pg_database_size(current_database())") || s1=0
  sleep 60
  s2=$(q "select pg_database_size(current_database())") || s2=0
  grew=$(( (s2 - s1) / 1048576 ))
  msg="Migration 031 is still running: $held on cms_procedures_by_zip. Session: $state. Database grew ${grew} MB in the last minute. Wait for it to finish, then run this check again."
  echo "::error::$msg"; printf '# Procedures summary check\n\n%s\n' "$msg" > "$OUT"; exit 1
fi

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
