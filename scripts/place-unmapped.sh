#!/usr/bin/env bash
# Places listings that have no coordinates (place-unmapped.yml). Rows the
# hourly ZIP job inserted, and rows the weekly NPPES refresh could not place,
# are stored without latitude/longitude and never drawn on any map.
#
#   MODE=dry_run (default)  counts what is unplaced and geocodes a sample of
#                           300; writes nothing
#   MODE=apply              geocodes up to MAX_ROWS (default 60000) and fills
#                           in only coordinates that are still null
#
# Rows are taken in an order that changes every ISO week (md5 of key and
# week), so an address that has no exact match does not block the rest of the
# queue week after week. Exact Census matches only (scripts/place-unmapped.mjs).
# Env: SUPABASE_DB_URL (Session pooler string), MODE, MAX_ROWS.
# Writes supabase/reference/unmapped-listings.md.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
MODE="${MODE:-dry_run}"; MAX_ROWS="${MAX_ROWS:-60000}"
WORK=$(mktemp -d); OUT=supabase/reference/unmapped-listings.md
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
psqlq() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }
[ "$MODE" = dry_run ] || [ "$MODE" = apply ] || fail "MODE must be dry_run or apply, got $MODE"
[[ "$MAX_ROWS" =~ ^[0-9]+$ ]] || fail "MAX_ROWS must be a number"

# ---- 1. What is unplaced (read only) -----------------------------------------
# Only rows with a street address and a 5-digit ZIP can be geocoded at all.
echo "== Counting unplaced listings"
psqlq -At -F, > "$WORK/counts.csv" 2> "$WORK/err" <<'SQL' || fail "count failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin transaction read only;
set local statement_timeout = '20min';
select 'clinics', count(*), count(*) filter (where address <> '' and zip ~ '^[0-9]{5}$') from public.clinics where latitude is null or longitude is null
union all
select 'provider_individuals', count(*), count(*) filter (where address <> '' and zip ~ '^[0-9]{5}$') from public.provider_individuals where latitude is null or longitude is null
union all
select 'clinic_secondary_locations', count(*), count(*) filter (where address <> '' and zip ~ '^[0-9]{5}$') from public.clinic_secondary_locations where latitude is null or longitude is null;
commit;
SQL
cat "$WORK/counts.csv"

# ---- 2. Export this run's share (read only) ------------------------------------
LIMIT=$([ "$MODE" = dry_run ] && echo 300 || echo "$MAX_ROWS")
echo "== Exporting up to $LIMIT rows"
psqlq > /dev/null 2> "$WORK/err" <<SQL || fail "export failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin transaction read only;
set local statement_timeout = '20min';
\\copy (select tbl, key, address, city, state, zip from (select 'clinics' as tbl, npi::text as key, address, city, state, zip from public.clinics where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$' union all select 'provider_individuals', npi, address, city, state, zip from public.provider_individuals where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$' union all select 'clinic_secondary_locations', id::text, address, city, state, zip from public.clinic_secondary_locations where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$') u order by md5(key || to_char(now(), 'IYYY-IW')) limit $LIMIT) to '$WORK/rows.csv' with (format csv, header true)
commit;
SQL
echo "exported $(($(wc -l < "$WORK/rows.csv") - 1)) rows"

# ---- 3. Geocode -------------------------------------------------------------------
rc=0
node scripts/place-unmapped.mjs --in "$WORK/rows.csv" --out "$WORK/placed.csv" --summary "$WORK/geo.md" || rc=$?
placed=$(($(wc -l < "$WORK/placed.csv") - 1))

# ---- 4. Write (apply only) ---------------------------------------------------------
written=""
if [ "$MODE" = apply ] && [ "$placed" -gt 0 ]; then
  echo "== Writing $placed locations"
  psqlq -At > "$WORK/written.txt" 2> "$WORK/err" <<SQL || fail "write failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin;
set local statement_timeout = '20min';
create temp table placed (tbl text, key text, lat double precision, lng double precision) on commit drop;
\\copy placed from '$WORK/placed.csv' with (format csv, header true)
with u as (update public.clinics c set latitude = p.lat, longitude = p.lng from placed p
  where p.tbl = 'clinics' and c.npi = p.key and (c.latitude is null or c.longitude is null) returning 1)
select 'clinics=' || count(*) from u;
with u as (update public.provider_individuals c set latitude = p.lat, longitude = p.lng from placed p
  where p.tbl = 'provider_individuals' and c.npi = p.key and (c.latitude is null or c.longitude is null) returning 1)
select 'provider_individuals=' || count(*) from u;
with u as (update public.clinic_secondary_locations c set latitude = p.lat, longitude = p.lng, geocode_precision = 'address' from placed p
  where p.tbl = 'clinic_secondary_locations' and c.id::text = p.key and (c.latitude is null or c.longitude is null) returning 1)
select 'clinic_secondary_locations=' || count(*) from u;
commit;
SQL
  written=$(tr '\n' ' ' < "$WORK/written.txt")
fi

# ---- 5. Summary ------------------------------------------------------------------
{
  echo "# Unmapped listings, $(date -u +%F)$([ "$MODE" = dry_run ] && echo ' (dry run: nothing written)')"; echo
  echo "Listings with no coordinates are never drawn on a map. This pass places them only by an exact Census match in the same ZIP."; echo
  echo "| Table | Without coordinates | With an address to try |"; echo "|---|---|---|"
  while IFS=, read -r t n a; do printf '| %s | %s | %s |\n' "$t" "$(printf "%'d" "$n")" "$(printf "%'d" "$a")"; done < "$WORK/counts.csv"
  echo; cat "$WORK/geo.md"; echo
  [ "$MODE" = apply ] && echo "Written: ${written:-nothing to write}"
} > "$OUT"
cat "$OUT"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT" >> "$GITHUB_STEP_SUMMARY" || true
exit $rc
