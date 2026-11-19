#!/usr/bin/env bash
# Step 1 loader: MODE=dry_run (read only) or apply (migration 051, replace
# clinician_status in one transaction). Needs SUPABASE_DB_URL, WORK.
set -euo pipefail
: "${SUPABASE_DB_URL:?}" "${WORK:?}"
mkdir -p "$WORK"; REF=supabase/reference
echo "== Export (read only)"
psql "$SUPABASE_DB_URL" -X -q -c "set default_transaction_read_only=on" \
  -c "\copy (select npi, taxonomy_code from public.provider_individuals) to '$WORK/individuals.csv' csv"
psql "$SUPABASE_DB_URL" -X -q -c "set default_transaction_read_only=on" \
  -c "\copy (select parent_npi, count(*) from public.clinic_secondary_locations where entity_type = '1' group by parent_npi) to '$WORK/secondary.csv' csv"
wc -l "$WORK/individuals.csv" "$WORK/secondary.csv"
node scripts/dac-load.mjs --individuals "$WORK/individuals.csv" --secondary "$WORK/secondary.csv" \
  --out "$WORK/clinician_status.csv" --weights "$WORK/clinician_weight.csv" --report "$REF/clinician-status-dry-run.md"
if [ "${MODE:-dry_run}" = apply ]; then
  echo "== Apply"
  psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/051_clinician_status.sql
  psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/052_clinician_weight.sql
  psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -1 \
    -c "truncate public.clinician_status" \
    -c "\copy public.clinician_status (npi, ind_pac_id, grad_year, telehealth, sites, org_pac_ids, cms_specialty, release_date) from '$WORK/clinician_status.csv' csv" \
    -c "truncate public.clinician_weight" \
    -c "\copy public.clinician_weight (npi, w) from '$WORK/clinician_weight.csv' csv"
  got=$(psql "$SUPABASE_DB_URL" -At -X -c "select count(*) from public.clinician_status")
  want=$(wc -l < "$WORK/clinician_status.csv")
  [ "$got" = "$want" ] || { echo "::error::loaded $got of $want"; exit 1; }
  printf '\n## Applied %s\n\n- %s clinicians stored in clinician_status.\n' "$(date -u +%F)" "$got" >> "$REF/clinician-status-dry-run.md"
fi
