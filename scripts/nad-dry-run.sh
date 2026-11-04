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
# Env: SUPABASE_DB_URL, NAD_URL (default: data.transportation.gov's TXT zip).
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
NAD_URL="${NAD_URL:-https://data.transportation.gov/download/fc2s-wawr/application/x-zip-compressed}"
WORK="${WORK:-$(mktemp -d)}"; OUT=supabase/reference/nad-dry-run.md
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
curl -sSL --fail --retry 3 --retry-delay 20 -o "$WORK/nad.zip" "$NAD_URL" || fail "NAD download failed: $NAD_URL"
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
  node scripts/nad-dry-run.mjs match --unplaced "$WORK/unplaced.csv" --sample "$WORK/sample.csv" --cands "$WORK/cands.csv" --out "$OUT"
