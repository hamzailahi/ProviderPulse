#!/usr/bin/env bash
# Back-test of the need score against clinician entry (2026-11-19). Read only:
# exports from the database in a read-only transaction, the NPPES monthly file,
# then scripts/backtest-entry.mjs. Report: supabase/reference/backtest-entry.md.
set -euo pipefail
: "${SUPABASE_DB_URL:?}"
WORK="${WORK:-/tmp/backtest}"; mkdir -p "$WORK"
MEASURES=$(node -e "console.log(require('./v2/assets/market-model.js').measureIds().map(m=>\"'\"+m+\"'\").join(','))")
echo "== Export (read only)"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X <<SQL
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select zip, avg(lat) lat, avg(lon) lon, max(pop_18plus) adults from public.zip_geo where zip ~ '^[0-9]{5}\$' group by zip) to '$WORK/zips.csv' with (format csv, header true)
\\copy (select distinct on (zip, measureid) zip, measureid, value from public.cdc_places where measureid in ($MEASURES) and value is not null order by zip, measureid, data_year desc) to '$WORK/places.csv' with (format csv, header true)
\\copy (select kind, key, data::text from public.market_benchmarks where kind in ('measure','specialty')) to '$WORK/bench.csv' with (format csv, header true)
\\copy (select state, county, discipline, hpsa_score from public.hpsa_designations where county is not null) to '$WORK/hpsa.csv' with (format csv, header true)
\\copy (select distinct on (x.zip) x.zip, x.fips, m.county, m.state from public.zip_county_crosswalk x join (select distinct on (fips) fips, county, state from public.medicare_county_enrollment order by fips, data_year desc) m on m.fips = x.fips order by x.zip, x.res_ratio desc) to '$WORK/zipcounty.csv' with (format csv, header true)
\\copy (select zip, state, ins_universe, ins_uninsured, median_hh_income from public.census_acs_zcta) to '$WORK/acs.csv' with (format csv, header true)
\\copy (select distinct on (fips) fips, er_visits_per_1000, readmission_rate, chf_admits_65_74, diabetes_admits_65_74, copd_admits_65_74, htn_admits_65_74, pneumonia_admits_65_74, uti_admits_65_74, amputation_admits_65_74 from public.cms_county_utilization where fips is not null order by fips, year desc) to '$WORK/util.csv' with (format csv, header true)
commit;
SQL
wc -l "$WORK"/*.csv
echo "== NPPES monthly file"
if [ -z "${NPPES_URL:-}" ]; then . scripts/lib/nppes-url.sh; NPPES_URL=$(nppes_monthly_url); fi
echo "   $NPPES_URL"
curl -fsSL --retry 5 --retry-all-errors -o "$WORK/nppes.zip" "$NPPES_URL"
member=$(unzip -Z1 "$WORK/nppes.zip" | grep -E '^npidata_pfile_.*\.csv$' | grep -vi fileheader | head -1)
unzip -p "$WORK/nppes.zip" "$member" | node --max-old-space-size=6144 scripts/backtest-nppes.mjs > "$WORK/counts.csv" 2> "$WORK/nppes.log"
rm -f "$WORK/nppes.zip"
export NPPES_STATS="$(tail -1 "$WORK/nppes.log")"; echo "   $NPPES_STATS"
echo "== Score and compare"
node --max-old-space-size=6144 scripts/backtest-entry.mjs --counts "$WORK/counts.csv" --zips "$WORK/zips.csv" --places "$WORK/places.csv" \
  --bench "$WORK/bench.csv" --hpsa "$WORK/hpsa.csv" --zipcounty "$WORK/zipcounty.csv" --acs "$WORK/acs.csv" --util "$WORK/util.csv" \
  --report supabase/reference/backtest-entry.md --csv "$WORK/backtest-entry.csv"
gzip -kf "$WORK/backtest-entry.csv"
