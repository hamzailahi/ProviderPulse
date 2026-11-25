#!/usr/bin/env bash
# Which data year each back-test county outcome comes from (2026-11-25, the
# user's ask for citable figures). Read only. Mirrors backtest-entry.sh's
# selection: per county, the newest year with a non-null ER figure and,
# separately, readmission figure; preventable stays by CHR release year.
# Report: supabase/reference/outcome-years.md
set -euo pipefail
: "${SUPABASE_DB_URL:?}"
OUT=supabase/reference/outcome-years.md
q() { psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 -A -F ' | ' -P footer=off -c "begin transaction read only; $1; commit;" | grep -v -E '^(BEGIN|COMMIT)$'; }
{
  echo "# Outcome data years for the back-test"
  echo
  echo "Run $(date -u +%F) by scripts/outcome-years.sh. Read only. Same selection as scripts/backtest-entry.sh: per county, the newest year with a value."
  echo
  echo "## ER visits per 1,000 (cms_county_utilization)"; echo
  echo '```'
  q "select yr as year, count(*) counties from (select fips, max(year) as yr from public.cms_county_utilization where fips is not null and er_visits_per_1000 is not null group by fips) t group by yr order by yr"
  echo '```'; echo
  echo "## Readmission rate (cms_county_utilization)"; echo
  echo '```'
  q "select yr as year, count(*) counties from (select fips, max(year) as yr from public.cms_county_utilization where fips is not null and readmission_rate is not null group by fips) t group by yr order by yr"
  echo '```'; echo
  echo "## Every year present in cms_county_utilization"; echo
  echo '```'
  q "select year, count(*) rows, count(er_visits_per_1000) with_er, count(readmission_rate) with_readmissions from public.cms_county_utilization group by year order by year"
  echo '```'; echo
  echo "## Preventable hospital stays (county_preventable_stays, County Health Rankings v005)"; echo
  echo '```'
  q "select release_year, coalesce(nullif(data_years, ''), '(not in the file)') data_years, count(*) counties from public.county_preventable_stays group by 1, 2 order by 1"
  echo '```'; echo
  echo "County Health Rankings' analytic CSV carries the release year only, not the measurement years behind v005; the import stores data_years empty for that reason."
} > "$OUT"
cat "$OUT"
