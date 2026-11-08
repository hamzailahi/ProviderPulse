#!/usr/bin/env bash
# Takes back the ArcGIS points that fail the strict cut (scripts/arcgis-strict.py:
# score 100 and inside the listing's own Census ZIP area), 2026-11-08, the
# user's request: keep only points that are exactly the location.
#
# Input: arcgis-loaded.csv.gz on a tmp/ branch: the rows loaded on 2026-11-08
# with their points and ArcGIS score. In one transaction, a failing row's
# latitude and longitude go back to null only when the row still holds
# the loaded point (to 1e-7 degrees: clinics stores 8 decimals; anything
# moved since is left alone); secondary
# rows also lose geocode_precision 'arcgis'. MODE=dry_run rolls back.
# Records kept in git: supabase/reference/arcgis-reverted.csv (table, key,
# reason; no coordinates), the reverted keys removed from arcgis-applied.csv,
# and counts in arcgis-revert.md.
#
# Env: SUPABASE_DB_URL, DATA_BRANCH (tmp/...), MODE (dry_run | apply), WORK
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"; : "${DATA_BRANCH:?Set DATA_BRANCH}"
MODE="${MODE:-dry_run}"
case "$MODE" in dry_run|apply) ;; *) echo "MODE must be dry_run or apply" >&2; exit 2;; esac
case "$DATA_BRANCH" in tmp/*) ;; *) echo "DATA_BRANCH must start with tmp/" >&2; exit 2;; esac
WORK="${WORK:-$(mktemp -d)}"
git fetch -q origin "$DATA_BRANCH"
git show FETCH_HEAD:arcgis-loaded.csv.gz | gunzip > "$WORK/loaded.csv"
n=$(($(wc -l < "$WORK/loaded.csv") - 1)); echo "rows loaded: $n"
[ "$n" -gt 0 ] && [ "$n" -le 100000 ] || { echo "row count $n out of range" >&2; exit 1; }

# Full-resolution 2020 ZCTA polygons (TIGER/Line), not the generalized ones.
url=https://www2.census.gov/geo/tiger/TIGER2020/ZCTA520/tl_2020_us_zcta520.zip
for i in 1 2 3 4 5 6; do curl -fsSL -C - --retry 3 -o "$WORK/zcta.zip" "$url" && unzip -tq "$WORK/zcta.zip" && break; sleep $((i * 10)); done
unzip -oq "$WORK/zcta.zip" -d "$WORK/zcta"
python3 scripts/arcgis-strict.py "$WORK/loaded.csv" "$WORK/zcta/tl_2020_us_zcta520.shp" "$WORK/drop.csv" | tee "$WORK/classify.txt"
d=$(($(wc -l < "$WORK/drop.csv") - 1))
[ "$d" -lt "$n" ] || { echo "every row would be taken out; refusing" >&2; exit 1; }

END=$([ "$MODE" = apply ] && echo commit || echo rollback)
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -At > "$WORK/out.txt" <<SQL
begin;
set local statement_timeout = '30min';
create temp table d (tbl text, npi text, parent_npi text, address text, city text, state text, zip text, lat double precision, lng double precision, addr_type text, score text, reason text) on commit drop;
\\copy d from '$WORK/drop.csv' with (format csv, header true)
create temp table done (tbl text, key text, reason text) on commit drop;
with u as (update public.clinics c set latitude = null, longitude = null from d
  where d.tbl = 'clinics' and c.npi = d.npi and abs(c.latitude::float8 - d.lat) < 1e-7 and abs(c.longitude::float8 - d.lng) < 1e-7
  returning d.tbl, d.npi, d.reason)
insert into done select * from u;
with u as (update public.provider_individuals c set latitude = null, longitude = null from d
  where d.tbl = 'provider_individuals' and c.npi = d.npi and abs(c.latitude::float8 - d.lat) < 1e-7 and abs(c.longitude::float8 - d.lng) < 1e-7
  returning d.tbl, d.npi, d.reason)
insert into done select * from u;
with u as (update public.clinic_secondary_locations c set latitude = null, longitude = null, geocode_precision = null from d
  where d.tbl = 'clinic_secondary_locations' and c.parent_npi = d.parent_npi and c.geocode_precision = 'arcgis'
    and abs(c.latitude::float8 - d.lat) < 1e-7 and abs(c.longitude::float8 - d.lng) < 1e-7 and c.zip is not distinct from d.zip
  returning d.tbl, c.id::text, d.reason)
insert into done select * from u;
select tbl || '=' || count(*) from done group by tbl order by tbl;
select 'reason ' || reason || '=' || count(*) from done group by reason order by 1;
\\copy (select tbl, key, reason from done order by tbl, key) to '$WORK/done.csv' with (format csv, header true)
$END;
SQL
cat "$WORK/out.txt"
total=$(($(wc -l < "$WORK/done.csv") - 1))
{
  echo "# ArcGIS points, strict cut: $MODE"; echo
  echo "Run $(date -u '+%F %H:%M') UTC by scripts/arcgis-revert.sh. A loaded point stays only when ArcGIS scored it 100 and it lies inside the 2020 Census ZIP area (full-resolution TIGER polygon, no tolerance) of the listing's own ZIP; a ZIP with no Census area cannot be confirmed. Failing rows go back to no pin, only if they still hold the loaded point.$([ "$MODE" = apply ] || echo ' Dry run: rolled back, nothing written.')"; echo
  echo "- Rows loaded on 2026-11-08: $n"
  sed -n 's/^keep \([0-9]*\), take out \([0-9]*\).*/- Pass the strict cut: \1\n- Fail it: \2/p' "$WORK/classify.txt"
  grep -v '^$' "$WORK/out.txt" | sed 's/^/- /'
  echo "- Rows $([ "$MODE" = apply ] && echo 'set back to no pin' || echo 'that would be set back'): **$total**"
} > supabase/reference/arcgis-revert.md
cat supabase/reference/arcgis-revert.md
if [ "$MODE" = apply ]; then
  python3 - "$WORK/done.csv" supabase/reference/arcgis-applied.csv supabase/reference/arcgis-reverted.csv "$(date -u +%F)" <<'PY'
import csv, os, sys
done, applied, rec, day = sys.argv[1:]
gone = list(csv.DictReader(open(done)))
keys = {(r['tbl'], r['key']) for r in gone}
rows = [r for r in csv.DictReader(open(applied)) if (r['tbl'], r['key']) not in keys]
w = csv.DictWriter(open(applied, 'w', newline=''), fieldnames=['tbl', 'key', 'addr_type', 'applied_on'], lineterminator='\n')
w.writeheader(); w.writerows(rows)
old = list(csv.DictReader(open(rec))) if os.path.exists(rec) else []
have = {(r['tbl'], r['key']) for r in old}
old += [{**r, 'reverted_on': day} for r in gone if (r['tbl'], r['key']) not in have]
old.sort(key=lambda r: (r['tbl'], r['key']))
w = csv.DictWriter(open(rec, 'w', newline=''), fieldnames=['tbl', 'key', 'reason', 'reverted_on'], lineterminator='\n')
w.writeheader(); w.writerows(old)
PY
fi
