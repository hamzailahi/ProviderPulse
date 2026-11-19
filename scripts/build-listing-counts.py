#!/usr/bin/env python3
"""Directory listings counted per ZIP, NUCC code and table (2026-11-19).

psql streams clinics and provider_individuals (with each clinician's site
weight, migration 052) as plain COPYs, DuckDB adds them up on the runner, and
--mode apply loads listing_counts_zip (migration 053) in one transaction:
truncate, copy, then check the row count and listing totals. ZIPs are padded
to five digits (clinics.zip is not always padded). Reports to
supabase/reference/listing-counts.md.
"""
import argparse, os, subprocess, sys, time
import duckdb

DENSE = ['10001', '10016', '60611', '02114', '77030', '38017']


def psql(sql, out=None, single=False):
    url = os.environ.get('SUPABASE_DB_URL') or sys.exit('SUPABASE_DB_URL is not set')
    cmd = ['psql', url, '-v', 'ON_ERROR_STOP=1', '-X', '-q'] + (['-1'] if single else []) + ['-c', sql]
    if out:
        with open(out, 'wb') as f:
            subprocess.run(cmd, check=True, stdout=f)
        return None
    return subprocess.run(cmd + ['-A', '-t'], check=True, capture_output=True, text=True).stdout.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', choices=['dry_run', 'apply'], default='dry_run')
    ap.add_argument('--work', default='/tmp/listing-counts')
    ap.add_argument('--report', default='supabase/reference/listing-counts.md')
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    c_csv, i_csv, out_csv = (os.path.join(a.work, x) for x in ('c.csv', 'i.csv', 'counts.csv'))
    t0 = time.time()
    psql("set default_transaction_read_only = on; copy (select npi, zip, taxonomy_code, latitude, longitude "
         "from public.clinics) to stdout with (format csv, header true)", out=c_csv)
    psql("set default_transaction_read_only = on; copy (select p.npi, p.zip, p.taxonomy_code, p.latitude, p.longitude, "
         "coalesce(cw.w, 1) as w from public.provider_individuals p left join public.clinician_weight cw on cw.npi = p.npi) "
         "to stdout with (format csv, header true)", out=i_csv)
    t_export = time.time() - t0

    db = duckdb.connect()
    T = "types={'npi':'VARCHAR','zip':'VARCHAR','taxonomy_code':'VARCHAR','latitude':'DOUBLE','longitude':'DOUBLE'}"
    db.execute(f"create table c as select *, 1.0::double as w from read_csv('{c_csv}', header=true, {T})")
    db.execute(f"create table i as select * from read_csv('{i_csv}', header=true, {T})")
    db.execute("""
      create table src as
        select 'c' as src, npi, zip, taxonomy_code, latitude, longitude, w from c
        union all select 'i', npi, zip, taxonomy_code, latitude, longitude, w from i""")
    raw = dict(db.execute("select src, count(*) from src group by 1").fetchall())
    no_zip = db.execute("select count(*) from src where regexp_extract(coalesce(zip,''), '^[0-9]+') = ''").fetchone()[0]
    db.execute("""
      create table agg as
      with s as (
        select src, npi, w, latitude, longitude,
               lpad(left(regexp_extract(zip, '^[0-9]+'), 5), 5, '0') as z,
               coalesce(taxonomy_code, '') as code
        from src where regexp_extract(coalesce(zip,''), '^[0-9]+') <> '')
      select z || '|' || code || '|' || src as k, z as zip, code as taxonomy_code, src,
             count(*)::int as n, round(sum(w), 3) as w,
             count(distinct npi || '|' || coalesce(latitude::varchar,'') || '|' || coalesce(longitude::varchar,''))::int as sites,
             count(latitude) filter (where longitude is not null)::int as pinned,
             avg(latitude) filter (where longitude is not null) as lat,
             avg(longitude) filter (where latitude is not null) as lng
      from s group by 1,2,3,4""")
    rows, listings = db.execute("select count(*), sum(n) from agg").fetchone()
    db.execute(f"copy (select k, zip, taxonomy_code, src, n, w, sites, pinned, lat, lng from agg) to '{out_csv}' (header, delimiter ',')")
    dense = db.execute(f"select zip, sum(n) filter (where src='i'), sum(n) filter (where src='c'), count(*) from agg "
                       f"where zip in ({','.join(repr(z) for z in DENSE)}) group by 1 order by 1").fetchall()

    lines = ['# Listing counts per ZIP and code', '',
             f'Built {time.strftime("%Y-%m-%d", time.gmtime())} by scripts/build-listing-counts.py, mode {a.mode}.', '',
             f'- Read: {raw.get("c",0):,} organizations, {raw.get("i",0):,} clinicians ({t_export:.0f}s export).',
             f'- Left out for no usable ZIP: {no_zip:,}.',
             f'- Summary: {rows:,} rows covering {listings:,} listings.', '',
             '| ZIP | Clinicians | Organizations | Rows |', '|---|---|---|---|']
    lines += [f'| {z} | {ci or 0:,} | {co or 0:,} | {r:,} |' for z, ci, co, r in dense]

    if a.mode == 'apply':
        if rows < 500000 or listings < 8000000:
            sys.exit(f'Refusing: {rows} rows / {listings} listings is too few')
        sql = (f"truncate public.listing_counts_zip; "
               f"\\copy public.listing_counts_zip (k, zip, taxonomy_code, src, n, w, sites, pinned, lat, lng) from '{out_csv}' with (format csv, header true)")
        url = os.environ['SUPABASE_DB_URL']
        subprocess.run(['psql', url, '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-1'],
                       input=sql.replace('; ', ';\n') + '\n', text=True, check=True)
        got = psql('select count(*) || \',\' || sum(n) from public.listing_counts_zip').split(',')
        if int(got[0]) != rows or int(got[1]) != listings:
            sys.exit(f'Load check failed: {got} vs {rows},{listings}')
        lines += ['', f'## Applied', '', f'Loaded {rows:,} rows, {listings:,} listings; counts match.']
    with open(a.report, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))


if __name__ == '__main__':
    main()
