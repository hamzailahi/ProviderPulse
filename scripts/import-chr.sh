#!/usr/bin/env bash
# Loads County Health Rankings' preventable hospital stays into
# county_preventable_stays (migration 055; 2026-11-20). MODE=dry_run (default)
# stages and counts, then rolls back; MODE=apply runs 055 and replaces the
# table in one transaction, refusing under 2,500 counties.
set -euo pipefail
: "${SUPABASE_DB_URL:?}"; MODE="${MODE:-dry_run}"; W=/tmp/chr; mkdir -p "$W"
node scripts/import-chr.mjs --out "$W/chr.csv" ${CHR_URL:+--url "$CHR_URL"}
END=rollback
if [ "$MODE" = apply ]; then END=commit; psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -f supabase/migrations/055_county_preventable_stays.sql; fi
OUT=$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -qAt -X <<SQL
begin;
create temp table s (fips text, rate numeric, release_year int, data_years text);
\copy s from '$W/chr.csv' with (format csv, header true)
select 'staged', count(*), min(release_year), round(percentile_cont(0.5) within group (order by rate)::numeric), min(rate), max(rate) from s;
select 'counties also in cms_county_utilization', count(*) from s where fips in (select fips from public.cms_county_utilization);
$( [ "$MODE" = apply ] && cat <<'A'
delete from public.county_preventable_stays;
insert into public.county_preventable_stays (fips, rate, release_year, data_years) select fips, rate, release_year, nullif(data_years, '') from s;
do $$ begin if (select count(*) from public.county_preventable_stays) < 2500 then raise exception 'fewer than 2,500 counties'; end if; end $$;
select 'written', count(*) from public.county_preventable_stays;
A
)
$END;
SQL
)
echo "$OUT"
{ echo "# Preventable hospital stays load ($MODE, $(date -u +%F))"; echo; echo "Source: County Health Rankings analytic data, measure v005 (stays for ambulatory-care-sensitive conditions per 100,000 Medicare fee-for-service enrollees). staged: counties, release year, median, min, max."; echo; echo '```'; echo "$OUT"; echo '```'; } > supabase/reference/chr-preventable-stays.md
