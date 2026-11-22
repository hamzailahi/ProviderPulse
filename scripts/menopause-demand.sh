#!/usr/bin/env bash
# Menopause care demand dry run (read only, 2026-11-22, the user's ask).
# Exports women by age band per ZIP, ZIP centres and the listings of the
# menopause-care codes per ZIP, then scripts/menopause-demand.mjs writes
# supabase/reference/menopause/<state>-demand.md. Env: SUPABASE_DB_URL, STATE.
set -euo pipefail
: "${SUPABASE_DB_URL:?}" "${STATE:?}"
W=$(mktemp -d); OUT=supabase/reference/menopause; mkdir -p "$OUT"
CODES=$(node -e "import('./scripts/lib/menopause.mjs').then(m=>console.log([...m.CORE,...m.BROAD].map(c=>\"'\"+c+\"'\").join(',')))")
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X <<SQL
begin transaction read only;
set local statement_timeout = '20min';
\\copy (select zip, state, age_female::text from public.census_acs_zcta where age_female is not null) to '$W/women.csv' with (format csv, header true)
\\copy (select zip, avg(lat) lat, avg(lon) lon from public.zip_geo where zip ~ '^[0-9]{5}\$' group by zip) to '$W/geo.csv' with (format csv, header true)
\\copy (select left(zip, 5) z, taxonomy_code, count(*) n from (select zip, taxonomy_code from public.clinics where taxonomy_code in ($CODES) union all select zip, taxonomy_code from public.provider_individuals where taxonomy_code in ($CODES)) x group by 1, 2) to '$W/supply.csv' with (format csv, header true)
commit;
SQL
node scripts/menopause-demand.mjs --women "$W/women.csv" --geo "$W/geo.csv" --supply "$W/supply.csv" --state "$STATE" --report "$OUT/$(echo "$STATE" | tr A-Z a-z)-demand.md"
