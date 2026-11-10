#!/usr/bin/env bash
# Dry run (2026-11-10, the user's ask for free sources): how many listings
# with no pin the Overture Maps addresses theme would place, by state and by
# source dataset and licence. Reads our database (read only) and Overture's
# public S3 bucket; writes nothing to the database. Report:
# supabase/reference/overture-dry-run.md.
#
# Env: SUPABASE_DB_URL, OVERTURE_RELEASE (default: the newest in the bucket), WORK
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
WORK="${WORK:-$(mktemp -d)}"
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
if [ -z "${OVERTURE_RELEASE:-}" ]; then
  OVERTURE_RELEASE=$(aws s3 ls --no-sign-request --region us-west-2 s3://overturemaps-us-west-2/release/ | awk '{print $2}' | tr -d / | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}' | sort | tail -1)
fi
[ -n "$OVERTURE_RELEASE" ] || fail "no Overture release found"
export OVERTURE_RELEASE; echo "Overture release: $OVERTURE_RELEASE"

echo "== Exporting listings with no pin (read only)"
PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=1200000' psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -c "\\copy (select 'clinics' as tbl, npi::text as key, address, city, state, zip from public.clinics where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$' union all select 'provider_individuals', npi, address, city, state, zip from public.provider_individuals where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$' union all select 'clinic_secondary_locations', id::text, address, city, state, zip from public.clinic_secondary_locations where (latitude is null or longitude is null) and address <> '' and zip ~ '^[0-9]{5}\$') to '$WORK/unplaced.csv' with (format csv, header true)" || fail "export failed"
echo "unplaced: $(($(wc -l < "$WORK/unplaced.csv") - 1))"
node scripts/nad-dry-run.mjs keys --rows "$WORK/unplaced.csv" --out "$WORK/keys.csv"

echo "== Pulling Overture address points at our ZIPs and house numbers"
python3 scripts/overture-candidates.py --release "$OVERTURE_RELEASE" --keys "$WORK/keys.csv" --out "$WORK/cands.csv"

echo "== Matching"
node scripts/overture-dry-run.mjs --unplaced "$WORK/unplaced.csv" --cands "$WORK/cands.csv" --out supabase/reference/overture-dry-run.md
