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
LIMIT=$([ "$MODE" = dry_run ] && echo 2000 || echo "$MAX_ROWS")
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
node scripts/place-unmapped.mjs --in "$WORK/todo.csv" --out "$WORK/placed.csv" --summary "$WORK/geo.md" --misses "$WORK/misses.csv" || rc=$?
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

# Decisions (the user's rules, reworked 2026-11-24 after the first dry run
# showed most flagged rows were a right address with a wrong ZIP):
#   keep  - the Census finds the same address (exact, or the one-word rule) in
#           another ZIP and the current pin is within KEEP_MI of that match:
#           the ZIP is the typo, the pin is right; nothing is written;
#   move  - a new point inside the listing's own ZIP;
#   unpin - anything else, except rows the geocoder never answered (an outage
#           is not "no match"). decide.csv holds only move and unpin.
python3 - "$WORK/todo.csv" "$WORK/moved.csv" "$WORK/decide.csv" "$rc" "$WORK/misses.csv" "$WORK/keep.csv" "${KEEP_MI:-0.25}" <<'PY'
import csv, sys, math
todo = list(csv.DictReader(open(sys.argv[1], newline='')))
moved = {(r['tbl'], r['key']): r for r in csv.DictReader(open(sys.argv[2], newline=''))}
outage = sys.argv[4] != '0'
miss = {(r['tbl'], r['key']): r for r in csv.DictReader(open(sys.argv[5], newline=''))}
keep_mi = float(sys.argv[7])
reasons = {}
leave = 0
import os
UNPIN_MI = os.environ.get('UNPIN_MI', '10')
def mi(a1, o1, a2, o2):
    a1, o1, a2, o2 = map(math.radians, (a1, o1, a2, o2))
    d = math.sin((a2 - a1) / 2) ** 2 + math.cos(a1) * math.cos(a2) * math.sin((o2 - o1) / 2) ** 2
    return 3958.8 * 2 * math.asin(min(1, math.sqrt(d)))
w = csv.DictWriter(open(sys.argv[3], 'w', newline=''), fieldnames=['tbl', 'key', 'old_lat', 'old_lng', 'new_lat', 'new_lng', 'action'], lineterminator='\n'); w.writeheader()
k = csv.DictWriter(open(sys.argv[6], 'w', newline=''), fieldnames=['tbl', 'key', 'state', 'zip', 'census_zip', 'miles_from_match'], lineterminator='\n'); k.writeheader()
for r in todo:
    key = (r['tbl'], r['key'])
    m = moved.get(key)
    if m: w.writerow({'tbl': r['tbl'], 'key': r['key'], 'old_lat': r['lat'], 'old_lng': r['lng'], 'new_lat': m['lat'], 'new_lng': m['lng'], 'action': 'move'}); continue
    x = miss.get(key)
    if x and (x['exact'] == '1' or x['near'] == '1') and x['mzip'] and x['mzip'] != r['zip'][:5]:
        d = mi(float(r['lat']), float(r['lng']), float(x['lat']), float(x['lng']))
        if d <= keep_mi:
            k.writerow({'tbl': r['tbl'], 'key': r['key'], 'state': r['state'], 'zip': r['zip'][:5], 'census_zip': x['mzip'], 'miles_from_match': f'{d:.2f}'}); continue
    # The user's rule (2026-11-24): unpin only a pin 10+ miles outside its ZIP
    # that the Census cannot confirm; nearer ones and Minnesota (a suspected
    # source problem, looked at separately) are left alone.
    if float(r['miles']) < float(UNPIN_MI) or r['state'] == 'MN':
        leave += 1; continue
    if not outage:
        w.writerow({'tbl': r['tbl'], 'key': r['key'], 'old_lat': r['lat'], 'old_lng': r['lng'], 'new_lat': '', 'new_lng': '', 'action': 'unpin'})
        if not x: why = 'no Census match'
        elif x['exact'] != '1' and x['near'] != '1': why = 'Census matched a different street'
        elif x['mzip'] == r['zip'][:5]: why = 'same ZIP match, but outside the ZIP area'
        else:
            d = mi(float(r['lat']), float(r['lng']), float(x['lat']), float(x['lng']))
            why = 'address found in another ZIP, pin ' + ('0.25-1 mi' if d < 1 else '1-5 mi' if d < 5 else '5+ mi') + ' from it'
        reasons[why] = reasons.get(why, 0) + 1
import json; reasons['left alone (under the unpin distance, or Minnesota)'] = leave; json.dump(reasons, open(sys.argv[3] + '.why.json', 'w'))
PY
moves=$(grep -c ',move$' "$WORK/decide.csv" || true); unpins=$(grep -c ',unpin$' "$WORK/decide.csv" || true)
keeps=$(($(wc -l < "$WORK/keep.csv") - 1))
echo "decided: keep $keeps, move $moves, unpin $unpins"

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

python3 - "$WORK/stats.json" "$WORK/flagged.csv" "$EXAMPLE_ZIP" "$MARGIN_MI" "$MODE" "$f" "$moves" "$unpins" "$written" "$WORK/geo.md" "$keeps" "$WORK/decide.csv" "$WORK/todo.csv" > "$OUT" <<'PY'
import csv, json, sys, datetime
st, flagged, ez, margin, mode, f, mv, up, written, geo, kp, dec, todo = sys.argv[1:]
s = json.load(open(st)); c = s['counts']
n = lambda v: f'{int(v):,}'
print(f'# Pins outside their own ZIP, {datetime.date.today()}' + (' (dry run: nothing written)' if mode == 'dry_run' else ''))
print()
print(f'A pin counts as away when it lies more than {margin} miles outside the listing\'s own 2020 Census ZIP area (ZCTA). A flagged listing is geocoded again. If the Census finds the same address in another ZIP and the current pin sits within a quarter mile of it, the ZIP on the listing is the mistake and the pin is kept. Otherwise a new point in the listing\'s own ZIP replaces it, or, failing that, the listing loses its pin and stays listed without one. A ZIP with no Census area cannot be judged and is left alone.')
print()
print(f"- Pinned listings checked: {n(c.get('rows', 0))}")
print(f"- Inside or within {margin} mi of their ZIP: {n(c.get('ok', 0))}")
print(f"- ZIP has no Census area (not judged): {n(c.get('no_zip_area', 0))}")
print(f"- **Away from their ZIP: {n(c.get('away', 0))}**")
tried = sum(1 for _ in csv.DictReader(open(todo, newline='')))
print(f"- This run, {n(tried)} {'sampled' if mode == 'dry_run' else 'tried'}: keep (wrong ZIP, right pin) {n(kp)}, move {n(mv)}, unpin {n(up)}" + ('' if mode == 'dry_run' else f"; written: {written or 'nothing'}"))
ts = {(r['tbl'], r['key']): r['state'] for r in csv.DictReader(open(todo, newline=''))}
import collections
bys = collections.defaultdict(collections.Counter)
for r in csv.DictReader(open(dec, newline='')): bys[ts.get((r['tbl'], r['key']), '')][r['action']] += 1
print()
print('| How far outside | Listings |'); print('|---|---|')
for k in ['0.5-2 mi', '2-10 mi', '10-50 mi', '50+ mi']: print(f"| {k} | {n(s['distance'].get(k, 0))} |")
print()
print('| Table | Away |'); print('|---|---|')
for k, v in s['by_table'].items(): print(f'| {k} | {n(v)} |')
print()
print('States with the most: ' + ', '.join(f'{k} {n(v)}' for k, v in s['by_state'][:12]))
print()
print('Decisions in this run by state (top 12 by unpins): ' + ', '.join(f"{k} move {v['move']} / unpin {v['unpin']}" for k, v in sorted(bys.items(), key=lambda kv: -kv[1]['unpin'])[:12]))
print()
rows = [r for r in csv.DictReader(open(flagged, newline='')) if r['zip'][:5] == ez]
print(f'## Listed in {ez}: {len(rows)} away'); print()
if rows:
    print('| Table | Address | City | Miles outside |'); print('|---|---|---|---|')
    for r in sorted(rows, key=lambda r: -float(r['miles']))[:25]:
        print(f"| {r['tbl']} | {r['address'].replace('|', '/')} | {r['city']} | {r['miles']} |")
print()
try:
    why = json.load(open(dec + '.why.json'))
    print('## Why the unpins (and what is left alone)'); print(); print('| Reason | Listings |'); print('|---|---|')
    for k, v in sorted(why.items(), key=lambda kv: -kv[1]): print(f'| {k} | {n(v)} |')
    print()
except Exception: pass
print(open(geo).read())
PY
cat "$OUT"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT" >> "$GITHUB_STEP_SUMMARY" || true
cp "$WORK/flagged.csv" "$WORK/decide.csv" "$WORK/keep.csv" "${ARTIFACT_DIR:-$WORK}/" 2>/dev/null || true
