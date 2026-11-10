#!/usr/bin/env bash
# Writes geocoded points the user produced with ArcGIS on their own machine
# (2026-11-07, the user's decision: the keyless service, loaded knowingly
# without an Esri storage licence) to listings that still have no pin.
#
# Input: arcgis-load.csv.gz on a tmp/ branch (tbl, npi, parent_npi, address, city, state,
# zip, lat, lng, addr_type), already filtered by Claude to PointAddress,
# Subaddress or StreetAddress, score 90+, ArcGIS's ZIP equal to the listing's.
# Here, in one transaction, a row is written only when its latitude and
# longitude are both still null, its address and ZIP equal the ones geocoded,
# and the point lies within FAR_MILES of the ZIP's cdc_places centre.
# Secondary rows get geocode_precision 'arcgis'. MODE=dry_run rolls back.
# The record kept in git (supabase/reference/arcgis-applied.csv) names the
# rows written and their match type, never the coordinates.
#
# Env: SUPABASE_DB_URL, DATA_BRANCH (tmp/...), MODE (dry_run | apply), FAR_MILES (25),
# LOAD_FILE (a local list instead of the branch), REPORT (where the counts go)
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"; : "${DATA_BRANCH:?Set DATA_BRANCH}"
MODE="${MODE:-dry_run}"; FAR_MILES="${FAR_MILES:-25}"
case "$MODE" in dry_run|apply) ;; *) echo "MODE must be dry_run or apply" >&2; exit 2;; esac
case "$DATA_BRANCH" in tmp/*) ;; *) echo "DATA_BRANCH must start with tmp/" >&2; exit 2;; esac
WORK="${WORK:-$(mktemp -d)}"
REPORT="${REPORT:-supabase/reference/arcgis-apply.md}"
if [ -n "${LOAD_FILE:-}" ]; then cp "$LOAD_FILE" "$WORK/load.csv"   # arcgis-anchor.sh hands its own list
else git fetch -q origin "$DATA_BRANCH"; git show FETCH_HEAD:arcgis-load.csv.gz | gunzip > "$WORK/load.csv"; fi
n=$(($(wc -l < "$WORK/load.csv") - 1)); echo "rows offered: $n"
[ "$n" -ge 0 ] && [ "$n" -le 100000 ] || { echo "row count $n out of range" >&2; exit 1; }
END=$([ "$MODE" = apply ] && echo commit || echo rollback)
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -At > "$WORK/out.txt" <<SQL
begin;
set local statement_timeout = '30min';
create temp table g (tbl text, npi text, parent_npi text, address text, city text, state text, zip text, lat double precision, lng double precision, addr_type text) on commit drop;
\\copy g from '$WORK/load.csv' with (format csv, header true)
create temp table zc on commit drop as
  select zip, avg(lat)::float8 clat, avg(lon)::float8 clon from public.cdc_places
  where measureid = 'DENTAL' and lat is not null and zip in (select distinct zip from g) group by zip;
create temp table ok on commit drop as select g.* from g left join zc using (zip)
  where zc.zip is null or 69.0 * sqrt((g.lat - zc.clat)^2 + ((g.lng - zc.clon) * cos(radians(zc.clat)))^2) <= $FAR_MILES;
select 'far_from_zip=' || ((select count(*) from g) - (select count(*) from ok));
create temp table done (tbl text, key text, addr_type text) on commit drop;
with u as (update public.clinics c set latitude = o.lat, longitude = o.lng from ok o
  where o.tbl = 'clinics' and c.npi = o.npi and c.latitude is null and c.longitude is null
    and c.address is not distinct from o.address and c.zip is not distinct from o.zip returning o.tbl, o.npi, o.addr_type)
insert into done select * from u;
with u as (update public.provider_individuals c set latitude = o.lat, longitude = o.lng from ok o
  where o.tbl = 'provider_individuals' and c.npi = o.npi and c.latitude is null and c.longitude is null
    and c.address is not distinct from o.address and c.zip is not distinct from o.zip returning o.tbl, o.npi, o.addr_type)
insert into done select * from u;
with u as (update public.clinic_secondary_locations c set latitude = o.lat, longitude = o.lng, geocode_precision = 'arcgis' from ok o
  where o.tbl = 'clinic_secondary_locations' and c.parent_npi = o.parent_npi and c.latitude is null and c.longitude is null
    and concat_ws(' ', c.address, nullif(c.address2, '')) is not distinct from o.address and c.zip is not distinct from o.zip
  returning o.tbl, c.id::text, o.addr_type)
insert into done select * from u;
select tbl || '=' || count(*) from done group by tbl order by tbl;
select 'type ' || addr_type || '=' || count(*) from done group by addr_type order by 1;
\\copy (select tbl, key, addr_type from done order by tbl, key) to '$WORK/done.csv' with (format csv, header true)
$END;
SQL
cat "$WORK/out.txt"
total=$(($(wc -l < "$WORK/done.csv") - 1)); far=$(sed -n 's/^far_from_zip=//p' "$WORK/out.txt")
{
  echo "# ArcGIS points: $MODE"; echo
  echo "Run $(date -u '+%F %H:%M') UTC by scripts/arcgis-apply.sh. Points from the user's own ArcGIS run (keyless service, loaded by the user's decision without an Esri storage licence), filtered to address-level matches in the listing's ZIP. Written only to rows still without a pin whose address and ZIP were unchanged, within $FAR_MILES miles of the ZIP's centre.$([ "$MODE" = apply ] || echo ' Dry run: rolled back, nothing written.')"; echo
  echo "- Rows offered: $n"
  echo "- Left out, more than $FAR_MILES miles from the ZIP's centre: ${far:-0}"
  echo "- Left out, pinned or address changed since the export: $((n - ${far:-0} - total))"
  grep -v '^far_from_zip=' "$WORK/out.txt" | sed 's/^/- /'
  echo "- Rows $([ "$MODE" = apply ] && echo written || echo 'that would be written'): **$total**"
} > "$REPORT"
cat "$REPORT"
if [ "$MODE" = apply ]; then
  python3 - "$WORK/done.csv" supabase/reference/arcgis-applied.csv "$(date -u +%F)" <<'PY'
import csv, os, sys
new, rec, day = sys.argv[1:]
rows = list(csv.DictReader(open(rec))) if os.path.exists(rec) else []
have = {(r['tbl'], r['key']) for r in rows}
for r in csv.DictReader(open(new)):
    if (r['tbl'], r['key']) not in have:
        r['applied_on'] = day; rows.append(r)
rows.sort(key=lambda r: (r['tbl'], r['key']))
w = csv.DictWriter(open(rec, 'w', newline=''), fieldnames=['tbl', 'key', 'addr_type', 'applied_on'], lineterminator='\n')
w.writeheader(); w.writerows(rows)
PY
fi
