#!/usr/bin/env bash
# Dry run of "fax via organization" (read only). See scripts/lib/fax-via-org.mjs.
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
WORK="${WORK:-/tmp/faxorg}"; REF=supabase/reference
mkdir -p "$WORK" "$REF"
psqlq() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }
echo "== Exporting (read only)"
psqlq <<SQL
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select distinct on (npi) npi::text, address, state, zip from public.provider_individuals where npi ~ '^[0-9]{10}\$' and fax is null order by npi) to '$WORK/individuals.csv' with (format csv, header true)
\\copy (select distinct on (npi) npi::text, name, address, state, zip, fax from public.clinics where npi ~ '^[0-9]{10}\$' and fax is not null order by npi) to '$WORK/clinics.csv' with (format csv, header true)
commit;
SQL
echo "   $(($(wc -l < "$WORK/individuals.csv") - 1)) clinicians without a fax, $(($(wc -l < "$WORK/clinics.csv") - 1)) organizations with one"
node scripts/fax-via-org.mjs --docs "$WORK/individuals.csv" --orgs "$WORK/clinics.csv" \
  --out "$WORK/matches.csv" --report "$REF/fax-via-org-dry-run.md" \
  ${PPEF_URL:+--ppef "$PPEF_URL"} ${REASSIGN_URL:+--reassign "$REASSIGN_URL"}
gzip -kf "$WORK/matches.csv"
