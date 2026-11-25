#!/usr/bin/env bash
# National drive-time vs 10-mile comparison and site-weighting flips
# (2026-11-25, the user's ask for citable national figures). Read only.
# Exports every ZIP centre (population-weighted where loaded), supply per ZIP
# and NUCC code (plain and site-weighted), the stored drive-time figures
# (access_e2sfca) and the national rates, then scripts/access-national.mjs
# writes supabase/reference/access-national.md. Needs SUPABASE_DB_URL.
set -euo pipefail
: "${SUPABASE_DB_URL:?}"
W="${WORK:-/tmp/access-national}"; mkdir -p "$W"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X <<SQL
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select g.zip, coalesce(p.lat, avg(g.lat)) lat, coalesce(p.lon, avg(g.lon)) lon, max(g.pop_18plus) adults, max(a.state) state from public.zip_geo g left join public.zip_pop_centres p on p.zip = g.zip left join public.census_acs_zcta a on a.zip = g.zip where g.zip ~ '^[0-9]{5}\$' group by g.zip, p.lat, p.lon) to '$W/zips.csv' with (format csv, header true)
\\copy (select z, taxonomy_code, sum(n) n, sum(w) w from (select left(zip, 5) z, taxonomy_code, count(*) n, count(*)::numeric w from public.clinics where taxonomy_code is not null group by 1, 2 union all select left(zip, 5), taxonomy_code, count(*), sum(w) from public.provider_individuals_weighted where taxonomy_code is not null group by 1, 2) x group by 1, 2) to '$W/supply.csv' with (format csv, header true)
\\copy (select zip, specialty, per_1k from public.access_e2sfca) to '$W/e2sfca.csv' with (format csv, header true)
\\copy (select key, (data->>'rate_per_1k')::numeric, (data->>'rate_per_1k_weighted')::numeric from public.market_benchmarks where kind = 'specialty') to '$W/bench.csv' with (format csv, header true)
commit;
SQL
wc -l "$W"/*.csv
node --max-old-space-size=6144 scripts/access-national.mjs --zips "$W/zips.csv" --supply "$W/supply.csv" --e2sfca "$W/e2sfca.csv" --bench "$W/bench.csv" --report supabase/reference/access-national.md
