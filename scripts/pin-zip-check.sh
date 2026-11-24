#!/usr/bin/env bash
# Pins outside their own ZIP (pin-zip-check.yml; 2026-11-24, the user's
# report that a 38017 search drew listings well away from it, and the user's
# rules: "away" = more than MARGIN_MI (0.5) miles outside the listing's own
# 2020 Census ZIP area; such a listing is geocoded again (Census, the same
# rule as place-unmapped: same house number and street in the same ZIP) and
# keeps a new point only if it passes the same test, else it loses its pin;
# accurate or nothing). A ZIP with no Census area is left alone, and so is a
# row whose re-geocode failed because the geocoder was down.
#
#   MODE=dry_run (default)  flags every pinned listing, re-geocodes a sample
#                           of 300 flagged ones, writes nothing
#   MODE=apply              re-geocodes up to MAX_ROWS flagged rows (order
#                           changes weekly) and, in one transaction, moves or
#                           unpins only rows still at the flagged point
# Env: SUPABASE_DB_URL, MODE, MAX_ROWS, MARGIN_MI, EXAMPLE_ZIP.
# Writes supabase/reference/pin-zip-check.md (counts and examples of public
# listing addresses); the per-row list is a workflow artifact.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
MODE="${MODE:-dry_run}"; MAX_ROWS="${MAX_ROWS:-60000}"; MARGIN_MI="${MARGIN_MI:-0.5}"; EXAMPLE_ZIP="${EXAMPLE_ZIP:-38017}"
case "$MODE" in dry_run|apply) ;; *) echo "MODE must be dry_run or apply" >&2; exit 2;; esac
[[ "$MAX_ROWS" =~ ^[0-9]+$ ]] || { echo "MAX_ROWS must be a number" >&2; exit 2; }
[[ "$EXAMPLE_ZIP" =~ ^[0-9]{5}$ ]] || { echo "EXAMPLE_ZIP must be 5 digits" >&2; exit 2; }
WORK="${WORK:-$(mktemp -d)}"; OUT=supabase/reference/pin-zip-check.md
psqlq() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }

echo "== Export every pinned listing (read only)"
psqlq <<SQL
begin transaction read only;
set local statement_timeout = '60min';
\\copy (select 'clinics' tbl, npi::text "key", address, city, state, zip, latitude lat, longitude lng from public.clinics where latitude is not null and longitude is not null and zip ~ '^[0-9]{5}' union all select 'provider_individuals', npi::text, address, city, state, zip, latitude, longitude from public.provider_individuals where latitude is not null and longitude is not null and zip ~ '^[0-9]{5}' union all select 'clinic_secondary_locations', id::text, address, city, state, zip, latitude, longitude from public.clinic_secondary_locations where latitude is not null and longitude is not null and zip ~ '^[0-9]{5}') to '$WORK/rows.csv' with (format csv, header true)
commit;
SQL
n=$(($(wc -l < "$WORK/rows.csv") - 1)); echo "pinned rows: $n"
[ "$n" -ge 5000000 ] || { echo "only $n pinned rows; refusing" >&2; exit 1; }

echo "== ZIP areas (TIGER/Line 2020, full resolution)"
url=https://www2.census.gov/geo/tiger/TIGER2020/ZCTA520/tl_2020_us_zcta520.zip
for i in 1 2 3 4 5 6; do curl -fsSL -C - --retry 3 -o "$WORK/zcta.zip" "$url" && unzip -tq "$WORK/zcta.zip" && break; sleep $((i * 10)); done
unzip -oq "$WORK/zcta.zip" -d "$WORK/zcta"
SHP="$WORK/zcta/tl_2020_us_zcta520.shp"

echo "== Flag pins more than $MARGIN_MI miles outside their own ZIP"
python3 scripts/pin-zip-check.py flag "$WORK/rows.csv" "$SHP" "$WORK/flagged.csv" "$WORK/stats.json" "$MARGIN_MI"
rm -f "$WORK/rows.csv"
f=$(($(wc -l < "$WORK/flagged.csv") - 1)); echo "flagged: $f"

echo "== Re-geocode"
LIMIT=$([ "$MODE" = dry_run ] && echo 300 || echo "$MAX_ROWS")
python3 - "$WORK/flagged.csv" "$WORK/todo.csv" "$LIMIT" <<'PY'
import csv, hashlib, sys, datetime
src, dst, lim = sys.argv[1], sys.argv[2], int(sys.argv[3])
wk = datetime.date.today().strftime('%G-%V')
rows = [r for r in csv.DictReader(open(src, newline='')) if (r['address'] or '').strip()]
rows.sort(key=lambda r: hashlib.md5((r['key'] + wk).encode()).hexdigest())
w = csv.DictWriter(open(dst, 'w', newline=''), fieldnames=list(rows[0].keys()) if rows else ['tbl','key','address','city','state','zip','lat','lng','miles'], lineterminator='\n')
w.writeheader(); w.writerows(rows[:lim])
PY
rc=0
node scripts/place-unmapped.mjs --in "$WORK/todo.csv" --out "$WORK/placed.csv" --summary "$WORK/geo.md" || rc=$?
[ "$rc" -eq 0 ] || echo "::warning::geocoder failures over 5%; rows it did not answer are left alone"

# Which re-geocoded points pass, and which rows had an answer at all.
python3 - "$WORK/todo.csv" "$WORK/placed.csv" "$WORK/new.csv" <<'PY'
import csv, sys
todo = {(r['tbl'], r['key']): r for r in csv.DictReader(open(sys.argv[1], newline=''))}
w = csv.DictWriter(open(sys.argv[3], 'w', newline=''), fieldnames=['tbl', 'key', 'zip', 'lat', 'lng'], lineterminator='\n'); w.writeheader()
for p in csv.DictReader(open(sys.argv[2], newline='')):
    t = todo.get((p['tbl'], p['key']))
    if t: w.writerow({'tbl': p['tbl'], 'key': p['key'], 'zip': t['zip'], 'lat': p['lat'], 'lng': p['lng']})
PY
python3 scripts/pin-zip-check.py check "$WORK/new.csv" "$SHP" "$WORK/moved.csv" "$MARGIN_MI"

# Decisions: moved (a new point inside the ZIP), else unpinned, except rows the
# geocoder never answered (an outage is not "no match").
python3 - "$WORK/todo.csv" "$WORK/moved.csv" "$WORK/decide.csv" "$rc" <<'PY'
import csv, sys
todo = list(csv.DictReader(open(sys.argv[1], newline='')))
moved = {(r['tbl'], r['key']): r for r in csv.DictReader(open(sys.argv[2], newline=''))}
outage = sys.argv[4] != '0'
w = csv.DictWriter(open(sys.argv[3], 'w', newline=''), fieldnames=['tbl', 'key', 'old_lat', 'old_lng', 'new_lat', 'new_lng', 'action'], lineterminator='\n'); w.writeheader()
for r in todo:
    m = moved.get((r['tbl'], r['key']))
    if m: w.writerow({'tbl': r['tbl'], 'key': r['key'], 'old_lat': r['lat'], 'old_lng': r['lng'], 'new_lat': m['lat'], 'new_lng': m['lng'], 'action': 'move'})
    elif not outage: w.writerow({'tbl': r['tbl'], 'key': r['key'], 'old_lat': r['lat'], 'old_lng': r['lng'], 'new_lat': '', 'new_lng': '', 'action': 'unpin'})
PY
moves=$(grep -c ',move$' "$WORK/decide.csv" || true); unpins=$(grep -c ',unpin$' "$WORK/decide.csv" || true)
echo "decided: move $moves, unpin $unpins"

written=""
if [ "$MODE" = apply ]; then
  [ "$f" -le 600000 ] || { echo "$f flagged is more than expected; refusing to write" >&2; exit 1; }
  psqlq -At > "$WORK/written.txt" <<SQL
begin;
set local statement_timeout = '30min';
create temp table d (tbl text, key text, old_lat float8, old_lng float8, new_lat float8, new_lng float8, action text) on commit drop;
\\copy d from '$WORK/decide.csv' with (format csv, header true)
with u as (update public.clinics c set latitude = d.new_lat, longitude = d.new_lng from d
  where d.tbl = 'clinics' and c.npi::text = d.key and abs(c.latitude::float8 - d.old_lat) < 1e-7 and abs(c.longitude::float8 - d.old_lng) < 1e-7 returning d.action)
select 'clinics ' || action || '=' || count(*) from u group by action;
with u as (update public.provider_individuals c set latitude = d.new_lat, longitude = d.new_lng from d
  where d.tbl = 'provider_individuals' and c.npi::text = d.key and abs(c.latitude::float8 - d.old_lat) < 1e-7 and abs(c.longitude::float8 - d.old_lng) < 1e-7 returning d.action)
select 'provider_individuals ' || action || '=' || count(*) from u group by action;
with u as (update public.clinic_secondary_locations c set latitude = d.new_lat, longitude = d.new_lng,
    geocode_precision = case when d.action = 'move' then 'address' else null end from d
  where d.tbl = 'clinic_secondary_locations' and c.id::text = d.key and abs(c.latitude::float8 - d.old_lat) < 1e-7 and abs(c.longitude::float8 - d.old_lng) < 1e-7 returning d.action)
select 'clinic_secondary_locations ' || action || '=' || count(*) from u group by action;
commit;
SQL
  written=$(tr '\n' ' ' < "$WORK/written.txt")
fi

python3 - "$WORK/stats.json" "$WORK/flagged.csv" "$EXAMPLE_ZIP" "$MARGIN_MI" "$MODE" "$f" "$moves" "$unpins" "$written" "$WORK/geo.md" > "$OUT" <<'PY'
import csv, json, sys, datetime
st, flagged, ez, margin, mode, f, mv, up, written, geo = sys.argv[1:]
s = json.load(open(st)); c = s['counts']
n = lambda v: f'{int(v):,}'
print(f'# Pins outside their own ZIP, {datetime.date.today()}' + (' (dry run: nothing written)' if mode == 'dry_run' else ''))
print()
print(f'A pin counts as away when it lies more than {margin} miles outside the listing\'s own 2020 Census ZIP area (ZCTA). A flagged listing is geocoded again (Census: same house number and street in the same ZIP) and keeps the new point only if it passes the same test; otherwise it loses its pin and stays listed without one. A ZIP with no Census area cannot be judged and is left alone.')
print()
print(f"- Pinned listings checked: {n(c.get('rows', 0))}")
print(f"- Inside or within {margin} mi of their ZIP: {n(c.get('ok', 0))}")
print(f"- ZIP has no Census area (not judged): {n(c.get('no_zip_area', 0))}")
print(f"- **Away from their ZIP: {n(c.get('away', 0))}**")
print(f"- This run{' (sample of 300)' if mode == 'dry_run' else ''}: would move {n(mv)}, would unpin {n(up)}" if mode == 'dry_run' else f"- This run: moved {n(mv)}, unpinned {n(up)} decided; written: {written or 'nothing'}")
print()
print('| How far outside | Listings |'); print('|---|---|')
for k in ['0.5-2 mi', '2-10 mi', '10-50 mi', '50+ mi']: print(f"| {k} | {n(s['distance'].get(k, 0))} |")
print()
print('| Table | Away |'); print('|---|---|')
for k, v in s['by_table'].items(): print(f'| {k} | {n(v)} |')
print()
print('States with the most: ' + ', '.join(f'{k} {n(v)}' for k, v in s['by_state'][:12]))
print()
rows = [r for r in csv.DictReader(open(flagged, newline='')) if r['zip'][:5] == ez]
print(f'## Listed in {ez}: {len(rows)} away'); print()
if rows:
    print('| Table | Address | City | Miles outside |'); print('|---|---|---|---|')
    for r in sorted(rows, key=lambda r: -float(r['miles']))[:25]:
        print(f"| {r['tbl']} | {r['address'].replace('|', '/')} | {r['city']} | {r['miles']} |")
print()
print(open(geo).read())
PY
cat "$OUT"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT" >> "$GITHUB_STEP_SUMMARY" || true
cp "$WORK/flagged.csv" "$WORK/decide.csv" "${ARTIFACT_DIR:-$WORK}/" 2>/dev/null || true
