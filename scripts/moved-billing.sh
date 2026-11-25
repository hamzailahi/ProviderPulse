#!/usr/bin/env bash
# Exports the moved clinicians (read only) and runs scripts/moved-billing.mjs.
set -euo pipefail
: "${SUPABASE_DB_URL:?}"
W=/tmp/moved; mkdir -p $W
psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 -c "\\copy (select npi, nppes_zip, nppes_state, zip, state from public.provider_individuals where address_source = 'medicare') to '$W/moved.csv' with (format csv, header true)"
node --max-old-space-size=4096 scripts/moved-billing.mjs --moved $W/moved.csv --report supabase/reference/moved-billing.md ${PUF_URL:+--puf-url "$PUF_URL"}
