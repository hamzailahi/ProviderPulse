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

--mode dry_run writes nothing to the database. It reports the summary's row
count, an estimate of its size on disk, what dense ZIPs shrink to, and the
database's own size, to supabase/reference/procedure-sources/summary-dry-run.md.

--mode apply (2026-11-04, the user's go-ahead with 7.2 GB free of 18) also
loads the summary into medicare_procedures_zip (migration 046): one
transaction that empties the table and COPYs the summary in, so readers see
the old rows or the new ones, never half. It refuses unless --disk-free-gb
covers three times the estimate (the table, its WAL, slack), checks the
loaded row count and services against what DuckDB built, and writes
summary-load.md. The table is locked while the transaction runs (a few
minutes), so the panel's large-area view waits or times out in that window.
"""
import argparse, os, subprocess, sys, time

import duckdb

COLS = ('zip', 'specialty', 'hcpcs_cd', 'hcpcs_desc', 'entity_code', 'npi',
        'tot_benes', 'tot_srvcs', 'avg_sbmtd_chrg', 'avg_mdcr_alowd_amt', 'avg_mdcr_pymt_amt')
DENSE = ['02114', '10001', '77030', '38017', '76104']
# Rough bytes per summary row in Postgres: tuple header and alignment, three
# short text keys, a description (shared, but stored per row), twelve numerics.
ROW_BYTES = 220
INDEX_BYTES = 60   # the primary key (zip, specialty, hcpcs_cd); two such were assumed until 046


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
    ap.add_argument('--mode', choices=['dry_run', 'apply'], default='dry_run')
    ap.add_argument('--disk-free-gb', type=float, default=0)
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
        zip, coalesce(specialty, '') as specialty, coalesce(hcpcs_cd, '') as hcpcs_cd, any_value(hcpcs_desc) as hcpcs_desc,
        count(*) as row_count, count(distinct npi) as billers,
        sum(tot_benes) as tot_benes, sum(tot_srvcs) as tot_srvcs,
        sum(avg_sbmtd_chrg) as sum_avg_charge, sum(avg_mdcr_alowd_amt) as sum_avg_allowed, sum(avg_mdcr_pymt_amt) as sum_avg_paid,
        sum(avg_mdcr_alowd_amt * tot_srvcs) as allowed_x_srvcs, sum(avg_mdcr_pymt_amt * tot_srvcs) as paid_x_srvcs,
        sum(case when entity_code = 'I' then tot_srvcs end) as srvcs_i, sum(case when entity_code = 'I' then avg_mdcr_pymt_amt * tot_srvcs end) as paid_x_srvcs_i,
        sum(case when entity_code = 'O' then tot_srvcs end) as srvcs_o, sum(case when entity_code = 'O' then avg_mdcr_pymt_amt * tot_srvcs end) as paid_x_srvcs_o
      from r where zip is not null group by 1, 2, 3""")
    t_agg = time.time() - t1
    sum_rows = db.execute('select count(*) from s').fetchone()[0]
    zips = db.execute('select count(distinct zip) from s').fetchone()[0]
    check = db.execute('select (select sum(tot_srvcs) from r where zip is not null), (select sum(tot_srvcs) from s), '
                       '(select sum(tot_benes) from r where zip is not null), (select sum(tot_benes) from s)').fetchone()
    dense = []
    for z in DENSE:
        a_ = db.execute('select count(*) from r where zip = ?', [z]).fetchone()[0]
        b_ = db.execute('select count(*) from s where zip = ?', [z]).fetchone()[0]
        dense.append((z, a_, b_))
    per_zip = db.execute('select quantile_cont(n, 0.5), quantile_cont(n, 0.99), max(n) from '
                         '(select zip, count(*) n from s group by zip)').fetchone()

    db_size = psql("select pg_size_pretty(pg_database_size(current_database()))")
    tbl = psql("select pg_size_pretty(pg_total_relation_size('public.cms_procedures_full'))")
    est = sum_rows * (ROW_BYTES + INDEX_BYTES)

    lines = [
        '# Medicare procedures summary: dry run',
        '',
        f'Run {time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())} by scripts/build-procedure-summary.py. Nothing was written to the database.',
        '',
        f'- Rows read from `cms_procedures_full`: {raw_rows:,} (plain COPY, {size_csv / 1e9:.2f} GB of CSV, {t_export:.0f}s)',
        f'- Summary rows (ZIP x specialty x code): **{sum_rows:,}** across {zips:,} ZIPs ({sum_rows / max(raw_rows, 1):.0%} of the rows; built in {t_agg:.0f}s on the runner)',
        f'- Services kept exact: {check[0]:,.0f} read, {check[1]:,.0f} summed; patients summed {check[2]:,.0f} = {check[3]:,.0f}',
        f'- Summary rows per ZIP: median {per_zip[0]:,.0f}, 99th percentile {per_zip[1]:,.0f}, largest {per_zip[2]:,}',
        f'- Estimated size on disk with its primary key (zip, specialty, code): about **{est / 1e9:.2f} GB**',
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
    if a.mode == 'apply':
        load(db, a, sum_rows, check[1], est)


LOAD_COLS = ('zip', 'specialty', 'hcpcs_cd', 'hcpcs_desc', 'row_count', 'billers', 'tot_benes', 'tot_srvcs',
             'sum_avg_charge', 'sum_avg_allowed', 'sum_avg_paid', 'allowed_x_srvcs', 'paid_x_srvcs',
             'srvcs_i', 'paid_x_srvcs_i', 'srvcs_o', 'paid_x_srvcs_o')


def load(db, a, sum_rows, sum_srvcs, est):
    need_gb = 3 * est / 1e9
    if a.disk_free_gb < need_gb:
        sys.exit(f'Refusing to load: --disk-free-gb {a.disk_free_gb} is under {need_gb:.1f} GB '
                 '(three times the estimated table: the table, its WAL and slack). Check Supabase, Settings, Usage, Disk.')
    if psql("select to_regclass('public.medicare_procedures_zip') is not null") != 't':
        sys.exit('medicare_procedures_zip does not exist: apply migration 046 first (apply-migration.yml).')
    csv = os.path.join(a.work, 'summary.csv')
    db.execute(f"copy (select {', '.join(LOAD_COLS)} from s) to '{csv}' (header, delimiter ',')")
    script = os.path.join(a.work, 'load.sql')
    with open(script, 'w') as f:
        f.write('set statement_timeout = 0;\n'
                'truncate public.medicare_procedures_zip;\n'
                f"\\copy public.medicare_procedures_zip ({', '.join(LOAD_COLS)}) from '{csv}' with (format csv, header true)\n")
    t0 = time.time()
    url = os.environ['SUPABASE_DB_URL']
    subprocess.run(['psql', url, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-1', '-f', script], check=True)
    t_load = time.time() - t0
    psql('analyze public.medicare_procedures_zip')
    got = psql('select count(*) || \',\' || coalesce(sum(tot_srvcs), 0) from public.medicare_procedures_zip').split(',')
    got_rows, got_srvcs = int(got[0]), float(got[1])
    size = psql("select pg_size_pretty(pg_total_relation_size('public.medicare_procedures_zip'))")
    db_size = psql('select pg_size_pretty(pg_database_size(current_database()))')
    ok = got_rows == sum_rows and abs(got_srvcs - sum_srvcs) <= max(1.0, sum_srvcs * 1e-9)
    lines = [
        '# Medicare procedures summary: load',
        '',
        f'Run {time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())} by scripts/build-procedure-summary.py --mode apply.',
        '',
        f'- Loaded into `medicare_procedures_zip`: {got_rows:,} rows (built {sum_rows:,}) in {t_load:.0f}s, one transaction',
        f'- Services in the table: {got_srvcs:,.0f} (built {sum_srvcs:,.0f})',
        f'- Table with its index: {size}; database now {db_size}',
        f'- Check: **{"passed" if ok else "FAILED"}**',
    ]
    with open(os.path.join(a.out, 'summary-load.md'), 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))
    if not ok:
        sys.exit('Loaded rows or services do not match what was built.')


if __name__ == '__main__':
    main()
