#!/usr/bin/env python3
"""Overture Maps address points at the house numbers and ZIPs we need
(overture-dry-run.sh). Reads the addresses theme's Parquet files straight
from Overture's public S3 bucket with DuckDB (no account, no key), keeps US
rows whose 5-digit postcode and house number are in keys.csv, and writes them
in the shape scripts/lib/nad-match.mjs reads (num, name, zip, lat, lng,
placement). `placement` carries the record's source dataset and licence, so
the report can count by both. The point is the row's bbox corner (a point's
bbox is the point, to about a metre), which is enough for a dry run.

    python3 scripts/overture-candidates.py --release 2026-10-22.0 --keys keys.csv --out cands.csv
"""
import argparse, time
import duckdb

ap = argparse.ArgumentParser()
ap.add_argument('--release', required=True)
ap.add_argument('--keys', required=True)
ap.add_argument('--out', required=True)
a = ap.parse_args()

db = duckdb.connect()
db.execute("install httpfs; load httpfs; set s3_region='us-west-2'; set enable_progress_bar=false")
src = f"read_parquet('s3://overturemaps-us-west-2/release/{a.release}/theme=addresses/type=address/*', hive_partitioning=1)"
cols = {r[0]: r[1] for r in db.execute(f"describe select * from {src}").fetchall()}
print('columns:', cols, flush=True)
for need in ('number', 'street', 'postcode', 'country', 'bbox'):
    if need not in cols:
        raise SystemExit(f'Overture addresses lack column {need!r}; columns: {list(cols)}')
lic = "coalesce(s.sources[1].license, '')" if 'license' in cols.get('sources', '') else "''"
ds = "coalesce(s.sources[1].dataset, '')" if 'sources' in cols else "''"
db.execute("create table keys as select * from read_csv(?, header=true, all_varchar=true)", [a.keys])
t0 = time.time()
db.execute(f"""
  create table c as
  select s.number as num, s.street as name, left(trim(s.postcode), 5) as zip,
         s.bbox.ymin::double as lat, s.bbox.xmin::double as lng,
         {ds} || ' | ' || {lic} as placement
  from {src} s
  join keys k on k.zip = left(trim(s.postcode), 5)
   and k.house = coalesce(nullif(ltrim(trim(s.number), '0'), ''), '0')
  where s.country = 'US' and s.postcode is not null and s.number is not null and s.street is not null""")
n = db.execute('select count(*) from c').fetchone()[0]
db.execute(f"copy c to '{a.out}' (header, delimiter ',')")
print(f'Overture rows at our ZIPs and house numbers: {n:,}; {time.time() - t0:.0f}s', flush=True)
for r in db.execute("select placement, count(*) from c group by 1 order by 2 desc limit 40").fetchall():
    print(f'  {r[1]:>9,}  {r[0]}')
