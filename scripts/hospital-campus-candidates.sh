#!/usr/bin/env bash
# Read only. Lists places that look like hospital campuses missing from the
# Emergency rooms & hospitals door, for the user to review before any go into
# supabase/reference/hospital-campuses.csv (hospital-campus-candidates.yml).
#
# A candidate is a street address where an organization named "hospital" or
# "medical center" is listed under a code outside the door (a pharmacy, lab,
# imaging or therapy NPI), and no organization within about 200 m carries a
# hospital code. That is the Baptist Memorial Hospital-Collierville pattern:
# NPPES has only the campus pharmacy there. The number of clinicians listed at
# the same address is a strong hint of a real campus. Names are only a way to
# find candidates; nothing is added without a person checking it.
# Env: SUPABASE_DB_URL. Writes supabase/reference/hospital-campus-candidates.csv
# and hospital-campus-candidates.md.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
REF=supabase/reference; WORK=$(mktemp -d)
codes=$(node -e "const T=require('./v2/assets/taxonomy-map.js');console.log(T.codesForCare('Emergency rooms & hospitals').map(c=>\"'\"+c+\"'\").join(','))")
[ -n "$codes" ] || { echo "no hospital codes"; exit 1; }
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X > /dev/null <<SQL
begin transaction read only;
set local statement_timeout = '30min';
\\copy (with cand as (select npi::text as npi, name, upper(trim(address)) as address, city, state, zip, latitude, longitude, taxonomy_code, primary_taxonomy from public.clinics where (name ilike '%hospital%' or name ilike '%medical center%') and taxonomy_code is not null and taxonomy_code not in ($codes) and address <> '' and zip ~ '^[0-9]{5}\$' and latitude is not null), site as (select address, zip, min(city) as city, min(state) as state, avg(latitude)::float8 as lat, avg(longitude)::float8 as lng, string_agg(distinct name, ' | ') as names, string_agg(distinct npi || ' ' || coalesce(primary_taxonomy, taxonomy_code), ' | ') as npis from cand group by address, zip) select s.state, s.city, s.zip, s.address, s.names, s.npis, round(s.lat::numeric, 6) as latitude, round(s.lng::numeric, 6) as longitude, (select count(*) from public.provider_individuals i where i.zip = s.zip and upper(trim(i.address)) like s.address || '%') as clinicians_here from site s where not exists (select 1 from public.clinics h where h.taxonomy_code in ($codes) and h.latitude between s.lat - 0.002 and s.lat + 0.002 and h.longitude between s.lng - 0.0025 and s.lng + 0.0025) order by clinicians_here desc, s.state, s.city) to '$WORK/cand.csv' with (format csv, header true)
commit;
SQL
cp "$WORK/cand.csv" "$REF/hospital-campus-candidates.csv"
n=$(($(wc -l < "$WORK/cand.csv") - 1))
{
  echo "# Hospital campus candidates, $(date -u +%F)"; echo
  echo "$n addresses where an organization named hospital or medical center is listed under a non-hospital code and no hospital-coded listing sits within about 200 m. Sorted by how many clinicians list the same address (a real campus usually has many)."; echo
  echo "To add one: confirm it is an operating hospital campus (the system's website), find the NPI it bills under, and add a row to \`supabase/reference/hospital-campuses.csv\`, then run \`node scripts/build-hospital-campuses.mjs\`."; echo
  echo "Top 25:"; echo; echo "| State | City | Address | Names | Clinicians here |"; echo "|---|---|---|---|---|"
  python3 - "$WORK/cand.csv" <<'PY'
import csv, sys
r = list(csv.DictReader(open(sys.argv[1])))
for x in r[:25]:
    print(f"| {x['state']} | {x['city']} | {x['address']} | {x['names'][:80]} | {x['clinicians_here']} |")
PY
} > "$REF/hospital-campus-candidates.md"
cat "$REF/hospital-campus-candidates.md"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$REF/hospital-campus-candidates.md" >> "$GITHUB_STEP_SUMMARY" || true
