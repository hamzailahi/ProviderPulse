#!/usr/bin/env python3
"""NAD rows at the house numbers and ZIPs we need (nad-dry-run.sh).

    unzip -p NAD.zip <file> | python3 scripts/nad-candidates.py --header "<first line>" --keys keys.csv --out cands.csv

Reads the National Address Database text file from stdin in one pass (DuckDB,
every column as text, so ZIPs keep their leading zeros) and keeps only rows
whose 5-digit ZIP and house number are in keys.csv. Column names are found
from the header by name, case-insensitively; a missing essential column
stops the run and prints the header, so a schema change is visible.
"""
import argparse, csv, io, sys, time

import duckdb

WANT = {
    'num': ['add_number', 'addnumber', 'address_number'],
    'num_pre': ['addnum_pre'],
    'num_suf': ['addnum_suf'],
    'pre_mod': ['st_premod'],
    'pre_dir': ['st_predir'],
    'pre_type': ['st_pretyp', 'st_pretype'],
    'pre_sep': ['st_presep'],
    'name': ['st_name', 'streetname'],
    'post_type': ['st_postyp', 'st_posttyp', 'st_postype'],
    'post_dir': ['st_posdir', 'st_postdir'],
    'post_mod': ['st_posmod', 'st_postmod'],
    'zip': ['zip_code', 'zipcode', 'zip', 'post_code'],
    'state': ['state'],
    'lat': ['latitude', 'lat'],
    'lng': ['longitude', 'long', 'lon'],
    'placement': ['placement'],
    'source': ['dataset_id', 'datasetid', 'source', 'addauth'],
}
ESSENTIAL = ['num', 'name', 'zip', 'lat', 'lng']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--header', required=True)
    ap.add_argument('--keys', required=True)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    line = a.header.lstrip('﻿').rstrip('\r\n')
    delim = max([',', '|', '\t', ';'], key=line.count)
    head = next(csv.reader(io.StringIO(line), delimiter=delim))
    low = {h.strip().lower(): h for h in head}
    pick = {k: next((low[c] for c in cands if c in low), None) for k, cands in WANT.items()}
    missing = [k for k in ESSENTIAL if not pick[k]]
    if missing:
        sys.exit(f'NAD header lacks {missing}; delimiter {delim!r}; header: {head}')
    print('delimiter', repr(delim), 'columns', {k: v for k, v in pick.items() if v}, flush=True)

    db = duckdb.connect()
    db.execute("create table keys as select * from read_csv(?, header=true, all_varchar=true)", [a.keys])
    cols = {h: 'VARCHAR' for h in head}
    q = lambda c: '"' + c.replace('"', '""') + '"'
    sel = ', '.join(f"s.{q(pick[k])} as {k}" if pick[k] else f"null as {k}" for k in WANT)
    t0 = time.time()
    # One streaming pass: the file is the probe side of a hash join against
    # the small keys table, so memory stays at the size of the matches.
    db.execute(f"""
      create table c as select {sel} from read_csv('/dev/stdin', header=true, auto_detect=false, delim=?, quote='"',
        columns=?, ignore_errors=true, null_padding=true) s
      join keys k on k.zip = lpad(left(trim(s.{q(pick['zip'])}), 5), 5, '0')
       and k.house = coalesce(nullif(ltrim(trim(s.{q(pick['num'])}), '0'), ''), '0')""", [delim, cols])
    m = db.execute('select count(*) from c').fetchone()[0]
    db.execute(f"copy c to '{a.out}' (header, delimiter ',')")
    print(f'NAD rows at our ZIPs and house numbers: {m:,}; {time.time() - t0:.0f}s', flush=True)


if __name__ == '__main__':
    main()
