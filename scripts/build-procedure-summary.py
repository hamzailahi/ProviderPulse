#!/usr/bin/env python3
"""Medicare procedures summed per ZIP, specialty and code (2026-11-04).

The dashboard's Procedures panel reads cms_procedures_full row by row (one row
per clinician, code and place of service). A whole state, or a dense ZIP such
as 02114, times out at the public role's 3 second limit (57014), so the panel
shows part of the area. A summary per ZIP x specialty x code answers the same
view in far fewer rows.

The 2026-10-09 attempt ran one GROUP BY inside the database and ran out of
disk (sort files and WAL on a nearly full disk). This script never sorts in
the database: psql streams the columns it needs as a plain sequential COPY,
DuckDB adds them up on the runner, and only the summary would go back.

--mode dry_run (the only mode so far) writes nothing to the database. It
reports the summary's row count, an estimate of its size on disk, what dense
ZIPs shrink to, and the database's own size, to supabase/reference/
procedure-sources/summary-dry-run.md.
"""
import argparse, os, subprocess, sys, time

import duckdb

COLS = ('zip', 'specialty', 'hcpcs_cd', 'hcpcs_desc', 'entity_code', 'npi',
        'tot_benes', 'tot_srvcs', 'avg_sbmtd_chrg', 'avg_mdcr_alowd_amt', 'avg_mdcr_pymt_amt')
DENSE = ['02114', '10001', '77030', '38017', '76104']
# Rough bytes per summary row in Postgres: tuple header and alignment, three
# short text keys, a description (shared, but stored per row), twelve numerics.
ROW_BYTES = 220
INDEX_BYTES = 60


def psql(sql, out=None):
    url = os.environ.get('SUPABASE_DB_URL')
    if not url:
        sys.exit('SUPABASE_DB_URL is not set')
    cmd = ['psql', url, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-c', sql]
    if out:
        with open(out, 'wb') as f:
            subprocess.run(cmd, check=True, stdout=f)
        return None
    return subprocess.run(cmd + ['-A', '-t'], check=True, capture_output=True, text=True).stdout.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', choices=['dry_run'], default='dry_run')
    ap.add_argument('--out', default='supabase/reference/procedure-sources')
    ap.add_argument('--work', default='/tmp/proc-summary')
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    os.makedirs(a.out, exist_ok=True)
    csv = os.path.join(a.work, 'rows.csv')

    t0 = time.time()
    # Read only, and a plain scan: no ORDER BY, so no sort files on the server.
    psql('set default_transaction_read_only = on; '
         f"copy (select {', '.join(COLS)} from public.cms_procedures_full) to stdout with (format csv, header true)", out=csv)
    t_export = time.time() - t0
    size_csv = os.path.getsize(csv)

    db = duckdb.connect()
    db.execute(f"create table r as select * from read_csv('{csv}', header=true, all_varchar=false, "
               "types={'zip':'VARCHAR','npi':'VARCHAR','hcpcs_cd':'VARCHAR','entity_code':'VARCHAR'})")
    raw_rows = db.execute('select count(*) from r').fetchone()[0]
    t1 = time.time()
    # One row per ZIP, specialty and code. Sums keep the panel's figures exact:
    # patients and services add; averages are kept both as plain sums (the
    # panel's current per-row average) and as service-weighted sums, and the
    # paid amount is split by billing entity (I clinician, O organization).
    db.execute("""
      create table s as select
        zip, specialty, hcpcs_cd, any_value(hcpcs_desc) as hcpcs_desc,
        count(*) as row_count, count(distinct npi) as billers,
        sum(tot_benes) as tot_benes, sum(tot_srvcs) as tot_srvcs,
        sum(avg_sbmtd_chrg) as sum_avg_charge, sum(avg_mdcr_alowd_amt) as sum_avg_allowed, sum(avg_mdcr_pymt_amt) as sum_avg_paid,
        sum(avg_mdcr_alowd_amt * tot_srvcs) as allowed_x_srvcs, sum(avg_mdcr_pymt_amt * tot_srvcs) as paid_x_srvcs,
        sum(case when entity_code = 'I' then tot_srvcs end) as srvcs_i, sum(case when entity_code = 'I' then avg_mdcr_pymt_amt * tot_srvcs end) as paid_x_srvcs_i,
        sum(case when entity_code = 'O' then tot_srvcs end) as srvcs_o, sum(case when entity_code = 'O' then avg_mdcr_pymt_amt * tot_srvcs end) as paid_x_srvcs_o
      from r group by 1, 2, 3""")
    t_agg = time.time() - t1
    sum_rows = db.execute('select count(*) from s').fetchone()[0]
    zips = db.execute('select count(distinct zip) from s').fetchone()[0]
    check = db.execute('select (select sum(tot_srvcs) from r), (select sum(tot_srvcs) from s), '
                       '(select sum(tot_benes) from r), (select sum(tot_benes) from s)').fetchone()
    dense = []
    for z in DENSE:
        a_ = db.execute('select count(*) from r where zip = ?', [z]).fetchone()[0]
        b_ = db.execute('select count(*) from s where zip = ?', [z]).fetchone()[0]
        dense.append((z, a_, b_))
    per_zip = db.execute('select quantile_cont(n, 0.5), quantile_cont(n, 0.99), max(n) from '
                         '(select zip, count(*) n from s group by zip)').fetchone()

    db_size = psql("select pg_size_pretty(pg_database_size(current_database()))")
    tbl = psql("select pg_size_pretty(pg_total_relation_size('public.cms_procedures_full'))")
    est = sum_rows * (ROW_BYTES + 2 * INDEX_BYTES)

    lines = [
        '# Medicare procedures summary: dry run',
        '',
        f'Run {time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())} by scripts/build-procedure-summary.py. Nothing was written to the database.',
        '',
        f'- Rows read from `cms_procedures_full`: {raw_rows:,} (plain COPY, {size_csv / 1e9:.2f} GB of CSV, {t_export:.0f}s)',
        f'- Summary rows (ZIP x specialty x code): **{sum_rows:,}** across {zips:,} ZIPs ({sum_rows / max(raw_rows, 1):.0%} of the rows; built in {t_agg:.0f}s on the runner)',
        f'- Services kept exact: {check[0]:,.0f} read, {check[1]:,.0f} summed; patients summed {check[2]:,.0f} = {check[3]:,.0f}',
        f'- Summary rows per ZIP: median {per_zip[0]:,.0f}, 99th percentile {per_zip[1]:,.0f}, largest {per_zip[2]:,}',
        f'- Estimated size on disk with a (zip, specialty) index and a (zip, hcpcs_cd) index: about **{est / 1e9:.2f} GB**',
        f'- Database now: {db_size}; `cms_procedures_full`: {tbl}',
        '',
        '| ZIP | rows now | summary rows |',
        '|---|---|---|',
    ] + [f'| {z} | {a_:,} | {b_:,} |' for z, a_, b_ in dense] + [
        '',
        'Loading it would need about the estimate above in free disk, plus the same again for the',
        'staging copy and its WAL. Check Supabase, Settings, Usage, Disk before any apply.',
    ]
    path = os.path.join(a.out, 'summary-dry-run.md')
    with open(path, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))


if __name__ == '__main__':
    main()
