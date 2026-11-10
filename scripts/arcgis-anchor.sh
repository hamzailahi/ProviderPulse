#!/usr/bin/env bash
# The hospital distance check (2026-11-10, the user's go-ahead) for ArcGIS
# points taken back because their ZIP has no Census area: see
# scripts/arcgis-anchor.mjs for the rule. Reads arcgis-noarea.csv.gz from a
# tmp/ branch, reads every pinned listing in those ZIPs (read only), decides
# in Node, then writes the passing points through scripts/arcgis-apply.sh's
# guarded transaction (both coordinates still null, address and ZIP
# unchanged). Re-placed keys leave arcgis-reverted.csv and rejoin
# arcgis-applied.csv. Counts in supabase/reference/arcgis-anchor.md.
#
# Env: SUPABASE_DB_URL, DATA_BRANCH (tmp/...), MODE (dry_run | apply), MAX_M (150), WORK
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"; : "${DATA_BRANCH:?Set DATA_BRANCH}"
MODE="${MODE:-dry_run}"; MAX_M="${MAX_M:-150}"
case "$MODE" in dry_run|apply) ;; *) echo "MODE must be dry_run or apply" >&2; exit 2;; esac
case "$DATA_BRANCH" in tmp/*) ;; *) echo "DATA_BRANCH must start with tmp/" >&2; exit 2;; esac
WORK="${WORK:-$(mktemp -d)}"
git fetch -q origin "$DATA_BRANCH"
git show FETCH_HEAD:arcgis-noarea.csv.gz | gunzip > "$WORK/rows.csv"
zips=$(python3 -c "import csv,sys; z=sorted({r['zip'][:5] for r in csv.DictReader(open(sys.argv[1])) if r['zip'][:5].isdigit()}); print(','.join(\"'%s'\" % x for x in z))" "$WORK/rows.csv")
[ -n "$zips" ] || { echo "no ZIPs" >&2; exit 1; }
PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=600000' psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -c "\\copy (
  select address, state, zip, latitude::float8 as lat, longitude::float8 as lng from public.clinics where zip in ($zips) and latitude is not null and longitude is not null
  union all
  select address, state, zip, latitude, longitude from public.provider_individuals where zip in ($zips) and latitude is not null and longitude is not null
  union all
  select concat_ws(' ', address, nullif(address2, '')), state, zip, latitude, longitude from public.clinic_secondary_locations
   where zip in ($zips) and latitude is not null and longitude is not null and coalesce(geocode_precision, '') !~* 'zip|centroid'
) to '$WORK/anchors.csv' with (format csv, header true)"
node scripts/arcgis-anchor.mjs --rows "$WORK/rows.csv" --anchors "$WORK/anchors.csv" --out "$WORK/place.csv" --report "$WORK/anchor.txt" --max-m "$MAX_M"
LOAD_FILE="$WORK/place.csv" REPORT="$WORK/apply.md" MODE="$MODE" WORK="$WORK" bash scripts/arcgis-apply.sh
{
  echo "# ArcGIS points, hospital distance check: $MODE"; echo
  echo "Run $(date -u '+%F %H:%M') UTC by scripts/arcgis-anchor.sh. For points taken back on 2026-11-08 because their ZIP has no Census area: a point goes back on the map only when another listing at the same street address in the same ZIP already has a pin from another source (a point no other address shares) and the ArcGIS point is within $MAX_M m of it.$([ "$MODE" = apply ] || echo ' Dry run: rolled back, nothing written.')"; echo
  cat "$WORK/anchor.txt"; echo; echo "## Write"; echo
  tail -n +4 "$WORK/apply.md"
} > supabase/reference/arcgis-anchor.md
cat supabase/reference/arcgis-anchor.md
if [ "$MODE" = apply ]; then
  python3 - "$WORK/done.csv" supabase/reference/arcgis-reverted.csv <<'PY'
import csv, sys
done, rec = sys.argv[1:]
back = {(r['tbl'], r['key']) for r in csv.DictReader(open(done))}
rows = [r for r in csv.DictReader(open(rec)) if (r['tbl'], r['key']) not in back]
w = csv.DictWriter(open(rec, 'w', newline=''), fieldnames=['tbl', 'key', 'reason', 'reverted_on'], lineterminator='\n')
w.writeheader(); w.writerows(rows)
PY
fi
