#!/usr/bin/env bash
# Dry run: how many unplaced listings the USDOT National Address Database
# (NAD) would place, and how well NAD agrees with the Census on listings
# already placed (nad-dry-run.yml). Reads the database, writes nothing to it.
#
#   1. export every listing with no pin, and a sample of 3,000 clinicians the
#      weekly refresh placed with an exact Census match (read only)
#   2. download the NAD text file and keep only rows at those ZIPs and house
#      numbers, in one streaming pass (scripts/nad-candidates.py)
#   3. match with the placement job's street rule (scripts/lib/nad-match.mjs)
#      and write supabase/reference/nad-dry-run.md
#
#   4. MODE=apply only (2026-11-05, the user's go-ahead; public counties of the
#      partly public states added 2026-11-06 after the county check): write the matches in
#      wholly public-domain states, only where the row still has no pin and
#      its address and ZIP are what was matched, and only when the point lies
#      within FAR_MILES of the ZIP's centre (cdc_places); secondary rows get
#      geocode_precision 'nad'. The written rows go to
#      supabase/reference/nad-applied.csv (table, key, point) so they can be
#      found again, and the counts to supabase/reference/nad-apply.md.
#
# Env: SUPABASE_DB_URL, NAD_URL (default: data.transportation.gov's TXT zip),
#      MODE (dry_run | apply), FAR_MILES (default 25), MAX_WRITE (default 60000).
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
NAD_URL="${NAD_URL:-https://data.transportation.gov/download/fc2s-wawr/application/x-zip-compressed}"
WORK="${WORK:-$(mktemp -d)}"; OUT=supabase/reference/nad-dry-run.md
MODE="${MODE:-dry_run}"; FAR_MILES="${FAR_MILES:-25}"; MAX_WRITE="${MAX_WRITE:-60000}"
case "$MODE" in dry_run|apply) ;; *) echo "MODE must be dry_run or apply" >&2; exit 2;; esac
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
psqlq() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }

echo "== Exporting listings with no pin, and a placed sample (read only)"
psqlq > /dev/null 2> "$WORK/err" <<SQL || fail "export failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin transaction read only;
set local statement_timeout = '20min';
\\copy (select 'clinics' as tbl, npi::text as key, address, city, state, zip from public.clinics where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$' union all select 'provider_individuals', npi, address, city, state, zip from public.provider_individuals where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$' union all select 'clinic_secondary_locations', id::text, address, city, state, zip from public.clinic_secondary_locations where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$') to '$WORK/unplaced.csv' with (format csv, header true)
\\copy (select 'provider_individuals' as tbl, npi as key, address, city, state, zip, latitude as lat, longitude as lng from public.provider_individuals tablesample system (2) where source = 'nppes_weekly' and latitude is not null and address <> '' and zip ~ '^[0-9]{5}\$' limit 3000) to '$WORK/sample.csv' with (format csv, header true)
commit;
SQL
echo "unplaced: $(($(wc -l < "$WORK/unplaced.csv") - 1)); sample: $(($(wc -l < "$WORK/sample.csv") - 1))"
node scripts/nad-dry-run.mjs keys --rows "$WORK/unplaced.csv" --rows "$WORK/sample.csv" --out "$WORK/keys.csv"

echo "== Downloading the NAD text file"
# 8.5 GB: a reset mid-transfer (2026-11-06, 13 minutes in) resumes from where
# it stopped (-C -) instead of failing the run; six tries in all.
rm -f "$WORK/nad.zip"; ok=""
for try in 1 2 3 4 5 6; do
  if curl -sSL --fail --retry 3 --retry-delay 20 --retry-all-errors -C - -o "$WORK/nad.zip" "$NAD_URL"; then ok=1; break; fi
  echo "download try $try stopped at $(stat -c %s "$WORK/nad.zip" 2>/dev/null || echo 0) bytes; resuming in 30s"; sleep 30
done
[ -n "$ok" ] || fail "NAD download failed: $NAD_URL"
unzip -tq "$WORK/nad.zip" > /dev/null || fail "the NAD zip is damaged after resuming"
ls -l "$WORK/nad.zip"
unzip -l "$WORK/nad.zip" | tail -n +1 | head -20
ENTRY=$(unzip -Z1 "$WORK/nad.zip" | grep -iE '\.(txt|csv)$' | while read -r f; do printf '%s\t%s\n' "$(unzip -Zl "$WORK/nad.zip" "$f" | awk 'NR==1{print $4}')" "$f"; done | sort -n | tail -1 | cut -f2)
[ -n "$ENTRY" ] || fail "no .txt or .csv inside the NAD zip"
echo "using $ENTRY"
HEADER=$(set +o pipefail; unzip -p "$WORK/nad.zip" "$ENTRY" | head -1)
echo "header: $HEADER"
df -h "$WORK" | tail -1

echo "== Pulling NAD rows at our ZIPs and house numbers"
unzip -p "$WORK/nad.zip" "$ENTRY" | python3 scripts/nad-candidates.py --header "$HEADER" --keys "$WORK/keys.csv" --out "$WORK/cands.csv"

echo "== Matching"
NAD_FILE="$(basename "$ENTRY") from $NAD_URL ($(stat -c %s "$WORK/nad.zip") bytes zipped)" \
  node scripts/nad-dry-run.mjs match --unplaced "$WORK/unplaced.csv" --sample "$WORK/sample.csv" --cands "$WORK/cands.csv" --out "$OUT" --placements "$WORK/placements.csv" --counties supabase/reference/nad-public-counties.csv

[ "$MODE" = apply ] || exit 0
n=$(($(wc -l < "$WORK/placements.csv") - 1))
echo "== Applying: $n matches in wholly public-domain states"
[ "$n" -gt 0 ] || fail "nothing to apply"
[ "$n" -le "$MAX_WRITE" ] || fail "$n matches is more than MAX_WRITE ($MAX_WRITE); refusing"
psqlq -At > "$WORK/written.txt" 2> "$WORK/err" <<SQL || fail "write failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin;
set local statement_timeout = '30min';
create temp table nad_place (tbl text, key text, address text, zip text, lat double precision, lng double precision) on commit drop;
\\copy nad_place from '$WORK/placements.csv' with (format csv, header true)
create temp table zc on commit drop as
  select zip, avg(lat)::float8 as clat, avg(lon)::float8 as clon from public.cdc_places
  where measureid = 'DENTAL' and lat is not null and zip in (select distinct zip from nad_place) group by zip;
create temp table nad_ok on commit drop as
  select p.* from nad_place p left join zc on zc.zip = p.zip
  where zc.zip is null or 69.0 * sqrt((p.lat - zc.clat)^2 + ((p.lng - zc.clon) * cos(radians(zc.clat)))^2) <= $FAR_MILES;
select 'far_from_zip=' || ((select count(*) from nad_place) - (select count(*) from nad_ok));
create temp table applied (tbl text, key text, lat double precision, lng double precision) on commit drop;
with u as (update public.clinics c set latitude = o.lat, longitude = o.lng from nad_ok o
  where o.tbl = 'clinics' and c.npi = o.key and c.latitude is null and c.longitude is null
    and c.address is not distinct from o.address and c.zip is not distinct from o.zip returning o.tbl, o.key, o.lat, o.lng)
insert into applied select * from u;
with u as (update public.provider_individuals c set latitude = o.lat, longitude = o.lng from nad_ok o
  where o.tbl = 'provider_individuals' and c.npi = o.key and c.latitude is null and c.longitude is null
    and c.address is not distinct from o.address and c.zip is not distinct from o.zip returning o.tbl, o.key, o.lat, o.lng)
insert into applied select * from u;
with u as (update public.clinic_secondary_locations c set latitude = o.lat, longitude = o.lng, geocode_precision = 'nad' from nad_ok o
  where o.tbl = 'clinic_secondary_locations' and c.id::text = o.key and c.latitude is null and c.longitude is null
    and c.address is not distinct from o.address and c.zip is not distinct from o.zip returning o.tbl, o.key, o.lat, o.lng)
insert into applied select * from u;
select tbl || '=' || count(*) from applied group by tbl order by tbl;
\\copy (select tbl, key, round(lat::numeric, 7) as lat, round(lng::numeric, 7) as lng from applied order by tbl, key) to '$WORK/applied.csv' with (format csv, header true)
commit;
SQL
cat "$WORK/written.txt"
# Add this run's rows to the record (2026-11-06: the second apply replaced the
# file and the first run's rows had to be restored from git history).
python3 - "$WORK/applied.csv" supabase/reference/nad-applied.csv "$(date -u +%F)" <<'PY'
import csv, os, sys
new, rec, day = sys.argv[1], sys.argv[2], sys.argv[3]
rows = list(csv.DictReader(open(rec))) if os.path.exists(rec) else []
have = {(r['tbl'], r['key']) for r in rows}
for r in csv.DictReader(open(new)):
    if (r['tbl'], r['key']) not in have:
        r['applied_on'] = day; rows.append(r); have.add((r['tbl'], r['key']))
rows.sort(key=lambda r: (r['tbl'], r['key']))
w = csv.DictWriter(open(rec, 'w', newline=''), fieldnames=['tbl', 'key', 'lat', 'lng', 'applied_on'], lineterminator='\n', extrasaction='ignore')
w.writeheader(); w.writerows(rows)
PY
total=$(($(wc -l < "$WORK/applied.csv") - 1))
far=$(sed -n 's/^far_from_zip=//p' "$WORK/written.txt")
{
  echo "# National Address Database: apply"
  echo
  echo "Run $(date -u '+%F %H:%M') UTC by scripts/nad-dry-run.sh (MODE=apply). Only matches in states USDOT marks wholly public domain, or in counties of the partly public states that USDOT's county status layer shows wholly in the NAD with no non-public piece (nad-public-counties.csv), were written, only to rows that still had no pin and whose address and ZIP were the ones matched, and only when the NAD point lay within $FAR_MILES miles of the ZIP's centre."
  echo
  echo "- Matches offered: $n"
  echo "- Left out, more than $FAR_MILES miles from the ZIP's centre: ${far:-0}"
  echo "- Left out, the row was pinned or its address changed since the export: $((n - ${far:-0} - total))"
  grep -v '^far_from_zip=' "$WORK/written.txt" | sed 's/^\(.*\)=\(.*\)$/- Written to \1: \2/'
  echo "- Rows written in all: **$total** (added to nad-applied.csv with the point written and the date)"
  echo
  echo "Source: U.S. Department of Transportation, National Address Database ($(basename "$ENTRY"))."
} > supabase/reference/nad-apply.md
cat supabase/reference/nad-apply.md
