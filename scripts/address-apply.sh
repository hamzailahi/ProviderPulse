#!/usr/bin/env bash
# Clinician address check and apply (2026-11-20). MODE=dry_run (read only:
# report and per-NPI CSVs) or apply (migration 056, then one transaction:
# moved clinicians shown at their Medicare address with the NPPES one kept,
# clinicians who no longer qualify put back, other Medicare offices replaced).
# Needs SUPABASE_DB_URL. CHECK: NPIs to print in the log.
set -euo pipefail
: "${SUPABASE_DB_URL:?}"; MODE="${MODE:-dry_run}"; W=/tmp/addr; mkdir -p $W
REF=supabase/reference
ro() { psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 -c "set default_transaction_read_only=on" "$@"; }
[ "$MODE" = apply ] && psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/migrations/056_clinician_medicare_address.sql
has=$(psql "$SUPABASE_DB_URL" -X -At -c "select count(*) from information_schema.columns where table_schema='public' and table_name='provider_individuals' and column_name='address_source'")
if [ "$has" = 1 ]; then
  ro -c "\copy (select npi, coalesce(nppes_state, state), coalesce(nppes_zip, zip), coalesce(nppes_city, city), taxonomy_code, address_source from public.provider_individuals) to '$W/ours.csv' csv"
else
  ro -c "\copy (select npi, state, zip, city, taxonomy_code, null from public.provider_individuals) to '$W/ours.csv' csv"
fi
ro -c "\copy (select distinct parent_npi, state from public.clinic_secondary_locations where entity_type = '1') to '$W/secondary.csv' csv"
node --max-old-space-size=6144 scripts/address-check.mjs --ours $W/ours.csv --secondary $W/secondary.csv \
  --report $REF/address-check.md --csv $W/address-mismatches.csv --check "${CHECK:-}" \
  --moves $W/moves.csv --sites $W/sites.csv --restore $W/restore.csv --release-out $W/release.txt
gzip -kf $W/address-mismatches.csv
[ "$MODE" = apply ] || exit 0

echo "== Geocode the Medicare addresses"
node scripts/address-geocode.mjs $W/moves.csv $W/moves_geo.csv
REL=$(cat $W/release.txt)
OUT=$(psql "$SUPABASE_DB_URL" -X -qAt -v ON_ERROR_STOP=1 <<SQL
begin;
-- 138,000 row updates outlast the role's statement timeout (the first apply,
-- 2026-11-20, was cancelled after 2 minutes and wrote nothing).
set local statement_timeout = 0;
set local lock_timeout = '60s';
create temp table mv (npi text, address text, city text, state text, zip text, facility text, lat numeric, lng numeric);
\copy mv from '$W/moves_geo.csv' csv
create index on mv (npi); analyze mv;
create temp table rs (npi text);
\copy rs from '$W/restore.csv' csv
create temp table st (npi text, address text, city text, state text, zip text, facility text);
\copy st from '$W/sites.csv' csv
do \$\$ begin
  if (select count(*) from mv) > 300000 then raise exception 'too many moves: %', (select count(*) from mv); end if;
  if (select count(*) from mv) < 1000 then raise exception 'too few moves: %, the CMS file looks wrong', (select count(*) from mv); end if;
end \$\$;
with u as (
  update public.provider_individuals p set
    nppes_address = case when p.address_source is null then p.address else p.nppes_address end,
    nppes_city = case when p.address_source is null then p.city else p.nppes_city end,
    nppes_state = case when p.address_source is null then p.state else p.nppes_state end,
    nppes_zip = case when p.address_source is null then p.zip else p.nppes_zip end,
    nppes_latitude = case when p.address_source is null then p.latitude else p.nppes_latitude end,
    nppes_longitude = case when p.address_source is null then p.longitude else p.nppes_longitude end,
    address = mv.address, city = mv.city, state = mv.state, zip = mv.zip, latitude = mv.lat, longitude = mv.lng,
    address_source = 'medicare', address_checked = '$REL'
  from mv where p.npi = mv.npi returning (mv.lat is not null) placed)
select 'moved', count(*), count(*) filter (where placed) from u;
with u as (
  update public.provider_individuals p set
    address = p.nppes_address, city = p.nppes_city, state = p.nppes_state, zip = p.nppes_zip,
    latitude = p.nppes_latitude, longitude = p.nppes_longitude, address_source = null, address_checked = null,
    nppes_address = null, nppes_city = null, nppes_state = null, nppes_zip = null, nppes_latitude = null, nppes_longitude = null
  from rs where p.npi = rs.npi and p.address_source = 'medicare' returning 1)
select 'restored', count(*) from u;
truncate public.clinician_medicare_sites;
insert into public.clinician_medicare_sites (npi, address, city, state, zip, facility, release_date)
  select npi, address, city, state, zip, nullif(facility, ''), '$REL' from st on conflict do nothing;
select 'other offices', count(*) from public.clinician_medicare_sites;
select 'shown at a Medicare address now', count(*) from public.provider_individuals where address_source = 'medicare';
commit;
SQL
)
echo "$OUT"
printf '\n## Applied %s (CMS release %s)\n\n```\n%s\n```\n' "$(date -u +%F)" "$REL" "$OUT" >> $REF/address-check.md
