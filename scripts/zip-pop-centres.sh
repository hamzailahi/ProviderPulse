#!/usr/bin/env bash
# Builds population-weighted ZIP centres and, in apply mode, loads them into
# zip_pop_centres (migration 059) in one transaction. Env: SUPABASE_DB_URL, MODE.
set -euo pipefail
: "${SUPABASE_DB_URL:?}"
W=$(mktemp -d); REF=supabase/reference/zip-pop-centres.md
python3 scripts/zip-pop-centres.py "$W" "$W/centres.csv"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -c "\\copy (select zip, avg(lat) lat, avg(lon) lon, max(pop_18plus) adults from public.zip_geo where zip ~ '^[0-9]{5}\$' group by zip) to '$W/geo.csv' with (format csv, header true)"
python3 - "$W/centres.csv" "$W/geo.csv" "$REF" "${MODE:-dry_run}" <<'PY'
import csv, math, sys, datetime
c = {r['zip']: r for r in csv.DictReader(open(sys.argv[1]))}
g = {r['zip']: r for r in csv.DictReader(open(sys.argv[2]))}
def mi(a, b, x, y):
    R, r = 3958.8, math.pi / 180
    h = math.sin((x - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(x * r) * math.sin((y - b) * r / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))
d = sorted((mi(float(g[z]['lat']), float(g[z]['lon']), float(c[z]['lat']), float(c[z]['lon'])), z) for z in g if z in c)
q = lambda p: d[int(p * (len(d) - 1))][0]
L = ['# Population-weighted ZIP centres', '', f'Run {datetime.date.today()} ({sys.argv[4]}) by scripts/zip-pop-centres.sh.', '',
     'Each ZIP\'s point is the mean of its 2020 Census blocks\' internal points weighted by block population. The drive-time job starts trips here instead of at the middle of the ZIP\'s shape (CDC PLACES centroid or Census Gazetteer point, `zip_geo`).', '',
     f'- ZCTAs built: {len(c):,}; with a `zip_geo` point to compare: {len(d):,}; in `zip_geo` with no block centre: {len([z for z in g if z not in c]):,}',
     f'- How far the start point moves: median {q(.5):.2f} mi, 90th percentile {q(.9):.2f} mi, 99th {q(.99):.2f} mi, largest {d[-1][0]:.1f} mi', '',
     '## Largest moves', '', '| ZIP | Miles moved | Population | Blocks |', '|---|---|---|---|']
for m, z in d[::-1][:25]: L.append(f'| {z} | {m:.1f} | {int(c[z]["pop"]):,} | {c[z]["blocks"]} |')
open(sys.argv[3], 'w').write('\n'.join(L) + '\n'); print('\n'.join(L[:8]))
PY
if [ "${MODE:-dry_run}" = apply ]; then
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -f supabase/migrations/059_zip_pop_centres.sql
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -1 <<SQL
truncate public.zip_pop_centres;
\\copy public.zip_pop_centres (zip, lat, lon, pop, blocks) from '$W/centres.csv' with (format csv, header true)
SQL
  got=$(psql "$SUPABASE_DB_URL" -At -X -c "select count(*) from public.zip_pop_centres")
  want=$(($(wc -l < "$W/centres.csv") - 1))
  [ "$got" = "$want" ] || { echo "::error::loaded $got rows, expected $want"; exit 1; }
  echo "- Loaded into \`zip_pop_centres\`: $got rows." >> "$REF"
fi
