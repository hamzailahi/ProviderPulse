#!/usr/bin/env bash
# "Fax via organization". See scripts/lib/fax-via-org.mjs.
#   MODE=dry_run (default)  read only: counts and the match list
#   MODE=apply              runs migration 048, then writes org_fax,
#                           org_fax_npi, org_fax_name on provider_individuals
#                           in one transaction (only rows whose own fax is
#                           null; rows that no longer match are cleared);
#                           refuses unless DISK_FREE_GB >= 1.
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
WORK="${WORK:-/tmp/faxorg}"; REF=supabase/reference
mkdir -p "$WORK" "$REF"
MODE="${MODE:-dry_run}"
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
[ "$MODE" = dry_run ] || [ "$MODE" = apply ] || fail "MODE must be dry_run or apply"
if [ "$MODE" = apply ]; then
  awk -v f="${DISK_FREE_GB:-0}" 'BEGIN { exit !(f + 0 >= 1) }' || fail "Apply needs disk_free_gb of at least 1 (about 150,000 rows are written)."
fi
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

if [ "$MODE" = apply ]; then
  n=$(($(wc -l < "$WORK/matches.csv") - 1))
  [ "$n" -ge 50000 ] || fail "Only $n matches; expected over 50,000. Not writing."
  echo "== Migration 048"
  psqlq -f supabase/migrations/048_org_fax.sql || fail "Migration 048 failed"
  echo "== Writing $n clinicians"
  psqlq > "$WORK/apply.log" <<SQL || fail "Apply failed: $(tail -c 400 "$WORK/apply.log")"
begin;
set local statement_timeout = '30min';
create temp table s (npi text primary key, org_npi text, org_name text, fax text) on commit drop;
\\copy s from '$WORK/matches.csv' with (format csv, header true)
update public.provider_individuals p set org_fax = s.fax, org_fax_npi = s.org_npi, org_fax_name = s.org_name
  from s where p.npi::text = s.npi and p.fax is null
  and (p.org_fax is distinct from s.fax or p.org_fax_npi is distinct from s.org_npi or p.org_fax_name is distinct from s.org_name);
update public.provider_individuals p set org_fax = null, org_fax_npi = null, org_fax_name = null
  where p.org_fax is not null and (p.fax is not null or not exists (select 1 from s where s.npi = p.npi::text));
commit;
SQL
  set_n=$(psqlq -At -c "select count(*) from public.provider_individuals where org_fax is not null")
  {
    echo; echo "## Applied $(date -u +%F)"; echo
    echo "- provider_individuals rows with a fax via their organization: $(printf "%'d" "$set_n")"
    echo "- update log: $(tr '\n' ' ' < "$WORK/apply.log")"
  } >> "$REF/fax-via-org-dry-run.md"
  cat "$REF/fax-via-org-dry-run.md"
fi
