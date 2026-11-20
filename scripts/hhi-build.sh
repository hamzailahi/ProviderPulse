#!/usr/bin/env bash
# MODE=dry_run (read only) or apply (migration 057, replace market_concentration
# in one transaction). Needs SUPABASE_DB_URL, WORK.
set -euo pipefail
: "${SUPABASE_DB_URL:?}" "${WORK:?}"
mkdir -p "$WORK"; REF=supabase/reference
psql "$SUPABASE_DB_URL" -X -q -c "set default_transaction_read_only=on" \
  -c "\copy (select npi, taxonomy_code from public.provider_individuals where taxonomy_code is not null) to '$WORK/individuals.csv' csv"
node scripts/hhi-build.mjs --individuals "$WORK/individuals.csv" --out "$WORK/concentration.csv" --report "$REF/market-concentration.md"
want=$(wc -l < "$WORK/concentration.csv")
[ "$want" -ge 5000 ] || { echo "::error::only $want cells; refusing"; exit 1; }
if [ "${MODE:-dry_run}" = apply ]; then
  psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/057_market_concentration.sql
  psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -1 \
    -c "truncate public.market_concentration" \
    -c "\copy public.market_concentration (zip3, specialty, clinicians, groups, hhi, top_group, top_share, release_date) from '$WORK/concentration.csv' csv"
  got=$(psql "$SUPABASE_DB_URL" -At -X -c "select count(*) from public.market_concentration")
  [ "$got" = "$want" ] || { echo "::error::loaded $got of $want"; exit 1; }
  printf '\n## Applied %s\n\n- %s cells stored in market_concentration.\n' "$(date -u +%F)" "$got" >> "$REF/market-concentration.md"
fi
