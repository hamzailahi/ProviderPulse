#!/usr/bin/env bash
# Fills the avoidable admission columns of cms_county_utilization from CMS's
# Medicare Geographic Variation file (2026-11-19). MODE=dry_run counts what
# would change; MODE=apply updates matching (fips, year) rows in one
# transaction, only those columns plus pqi_year. Nothing else is touched.
set -euo pipefail
: "${SUPABASE_DB_URL:?}"; MODE="${MODE:-dry_run}"; W=/tmp/gvpqi; mkdir -p "$W"
node scripts/import-gv-pqi.mjs --out "$W/pqi.csv" ${GV_URL:+--url "$GV_URL"}
COLS=$(head -1 "$W/pqi.csv" | cut -d, -f3-)
SETS=$(echo "$COLS" | tr , '\n' | sed 's/.*/& = s.&/' | paste -sd, -)
DEFS=$(echo "$COLS" | tr , '\n' | sed 's/$/ numeric/' | paste -sd, -)
END=rollback; [ "$MODE" = apply ] && END=commit
OUT=$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -qAt <<SQL
begin;
create temp table s (fips text, year text, $DEFS);
\copy s from '$W/pqi.csv' with (format csv, header true)
select 'staged', count(*), count(distinct year), min(year), max(year) from s;
select 'table years', string_agg(year || ':' || n, ' ' order by year) from (select year, count(*) n from public.cms_county_utilization group by year) y;
with u as (update public.cms_county_utilization c set $SETS, pqi_year = s.year from s where c.fips = s.fips and c.year = s.year returning c.chf_admits_65_74) select 'rows updated', count(*), count(chf_admits_65_74) from u;
$END;
SQL
)
echo "$OUT"
{ echo "# Avoidable admission rates load ($MODE, $(date -u +%F))"; echo; echo "Source: CMS Medicare Geographic Variation by county, BENE_AGE_LVL All. Only the *_admits_* columns and pqi_year of rows matching (fips, year) are written."; echo; echo '```'; echo "$OUT"; echo '```'; } > supabase/reference/gv-pqi-load.md
