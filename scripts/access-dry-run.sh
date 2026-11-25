#!/usr/bin/env bash
# E2SFCA drive-time access dry run for one state (read only). See
# scripts/access-dry-run.mjs and scripts/lib/e2sfca.mjs.
# Env: SUPABASE_DB_URL, STATE_LABEL, FOCUS (ZIP3 range, e.g. 370-385),
# BBOX (minlon,minlat,maxlon,maxlat: the state plus about 60 miles),
# GEOFABRIK (space-separated us/<state> names covering BBOX), SAMPLE, WORK.
set -euo pipefail
: "${SUPABASE_DB_URL:?}" "${FOCUS:?}" "${BBOX:?}" "${GEOFABRIK:?}"
WORK="${WORK:-/tmp/access}"; REF=supabase/reference/access-e2sfca
mkdir -p "$WORK/osm" "$REF"
IFS=, read -r MINLON MINLAT MAXLON MAXLAT <<< "$BBOX"

# Site weighting (step 10, 2026-11-23): clinicians who split time across
# offices count 0.6 at their main address (migration 052), and the national
# rate is the matching weighted one. WEIGHTED=0 reproduces the old run.
if [ "${WEIGHTED:-1}" = 1 ]; then
  IND_TABLE=provider_individuals_weighted; IND_COUNT='sum(w)'
  BENCH_FIELD="coalesce(data->>'rate_per_1k_weighted', data->>'rate_per_1k')"
else
  IND_TABLE=provider_individuals; IND_COUNT='count(*)'; BENCH_FIELD="data->>'rate_per_1k'"
fi
# Start points (step 10, 2026-11-23): each ZIP's population-weighted centre
# (zip_pop_centres, migration 059) when it exists, else the middle of its shape.
BOXQ="lat between $MINLAT and $MAXLAT and lon between $MINLON and $MAXLON and zip ~ '^[0-9]{5}\$'"
GBOXQ="g.lat between $MINLAT and $MAXLAT and g.lon between $MINLON and $MAXLON and g.zip ~ '^[0-9]{5}\$'"
if [ "$(psql "$SUPABASE_DB_URL" -At -X -c "select to_regclass('public.zip_pop_centres') is not null")" = t ]; then
  ZIPQ="select g.zip, coalesce(p.lat, avg(g.lat)) lat, coalesce(p.lon, avg(g.lon)) lon, max(g.pop_18plus) adults from public.zip_geo g left join public.zip_pop_centres p on p.zip = g.zip where $GBOXQ group by g.zip, p.lat, p.lon order by g.zip"
  echo "   start points: population-weighted ZIP centres"
else
  ZIPQ="select zip, avg(lat) lat, avg(lon) lon, max(pop_18plus) adults from public.zip_geo where $BOXQ group by zip order by zip"
  echo "   start points: ZIP shape centres (zip_pop_centres not loaded)"
fi
echo "== Export (read only)"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X <<SQL
begin transaction read only;
set local statement_timeout = '30min';
\\copy ($ZIPQ) to '$WORK/zips.csv' with (format csv, header true)
\\copy (select key, $BENCH_FIELD from public.market_benchmarks where kind = 'specialty') to '$WORK/bench.csv' with (format csv, header true)
\\copy (select z, taxonomy_code, sum(n) from (select left(zip, 5) z, taxonomy_code, count(*) n from public.clinics where taxonomy_code is not null and left(zip, 5) in (select zip from public.zip_geo where true and lat between $MINLAT and $MAXLAT and lon between $MINLON and $MAXLON) group by 1, 2 union all select left(zip, 5), taxonomy_code, $IND_COUNT from public.$IND_TABLE where taxonomy_code is not null and left(zip, 5) in (select zip from public.zip_geo where true and lat between $MINLAT and $MAXLAT and lon between $MINLON and $MAXLON) group by 1, 2) x group by 1, 2) to '$WORK/supply.csv' with (format csv, header true)
\\copy (select zip, (signals->'no_vehicle'->>'n')::numeric / nullif((signals->'no_vehicle'->>'of')::numeric, 0) as share from public.census_acs_zcta where signals ? 'no_vehicle' and (signals->'no_vehicle'->>'of')::numeric > 0) to '$WORK/nocar.csv' with (format csv, header true)
\\copy (select distinct on (x.zip) x.zip, e.state, e.county from public.zip_county_crosswalk x join public.medicare_county_enrollment e on e.fips = x.fips order by x.zip, x.res_ratio desc) to '$WORK/zipcounty.csv' with (format csv, header true)
\\copy (select zip, taxonomy_code, sum(n) n, sum(n * lat) / sum(n) lat, sum(n * lng) / sum(n) lng from public.listing_counts_zip where lat is not null and lng is not null and zip in (select zip from public.zip_geo where true and lat between $MINLAT and $MAXLAT and lon between $MINLON and $MAXLON) group by 1, 2) to '$WORK/pins.csv' with (format csv, header true)
commit;
SQL
echo "   $(($(wc -l < "$WORK/zips.csv") - 1)) ZIPs, $(($(wc -l < "$WORK/supply.csv") - 1)) ZIP x code supply rows"

echo "== Roads (OpenStreetMap via Geofabrik, clipped to the region)"
# Many states at once overwhelm Geofabrik: start at a random moment in 5 minutes.
sleep $((RANDOM % 300))
parts=()
for s in $GEOFABRIK; do
  f="$WORK/osm/$(basename "$s").osm.pbf"
  # Read the repo's own mirror first (osm-mirror.yml, release "osm-extracts"):
  # Geofabrik refuses an address that downloads a lot (2026-11-19), and the
  # France mirror's paths did not match (404). Geofabrik stays the fallback.
  b=$(basename "$s")
  curl -sSfL --retry 5 --retry-all-errors --retry-delay 20 -o "$f" "https://github.com/hamzailahi/ProviderPulse/releases/download/osm-extracts/$b.osm.pbf" ||
  curl -sSfL --retry 20 --retry-all-errors --retry-delay 45 -o "$f" "https://download.geofabrik.de/north-america/$s-latest.osm.pbf"
  osmium extract -b "$BBOX" "$f" -o "$f.clip.pbf" --overwrite -s smart >/dev/null
  rm -f "$f"; parts+=("$f.clip.pbf")
done
osmium merge "${parts[@]}" -o "$WORK/osm/region.osm.pbf" --overwrite
rm -f "${parts[@]}"
ls -lh "$WORK/osm/region.osm.pbf"

echo "== OSRM (car profile, MLD)"
IMG=ghcr.io/project-osrm/osrm-backend:v5.27.1
docker run --rm -v "$WORK/osm:/data" $IMG osrm-extract -p /opt/car.lua /data/region.osm.pbf >/dev/null
docker run --rm -v "$WORK/osm:/data" $IMG osrm-partition /data/region.osrm >/dev/null
docker run --rm -v "$WORK/osm:/data" $IMG osrm-customize /data/region.osrm >/dev/null
docker run -d --name osrm -p 5000:5000 -v "$WORK/osm:/data" $IMG osrm-routed --algorithm mld --max-table-size 1000 /data/region.osrm >/dev/null
for i in $(seq 1 60); do curl -s "http://127.0.0.1:5000/nearest/v1/driving/$MINLON,$MINLAT" >/dev/null && break; sleep 2; done

# Walking network (2026-11-19, the user's choice: people without a car are
# scored on walking times; a car-time slowdown is kept as a sensitivity check).
echo "== OSRM (foot profile, MLD)"
mkdir -p "$WORK/foot"; cp "$WORK/osm/region.osm.pbf" "$WORK/foot/region.osm.pbf"
docker run --rm -v "$WORK/foot:/data" $IMG osrm-extract -p /opt/foot.lua /data/region.osm.pbf >/dev/null
docker run --rm -v "$WORK/foot:/data" $IMG osrm-partition /data/region.osrm >/dev/null
docker run --rm -v "$WORK/foot:/data" $IMG osrm-customize /data/region.osrm >/dev/null
docker run -d --name osrmfoot -p 5001:5000 -v "$WORK/foot:/data" $IMG osrm-routed --algorithm mld --max-table-size 1000 /data/region.osrm >/dev/null
for i in $(seq 1 60); do curl -s "http://127.0.0.1:5001/nearest/v1/walking/$MINLON,$MINLAT" >/dev/null && break; sleep 2; done

slug=$(echo "${STATE_LABEL:-region}" | tr 'A-Z ' 'a-z-')
TRANSIT_ARGS=()
if [ "${TRANSIT:-0}" = 1 ]; then
  # Transit pilot (2026-11-25): a metro box, its GTFS feeds, r5py. Report under
  # its own name so the state reports stay as they are; never applied.
  [ "${MODE:-dry_run}" = apply ] && { echo "::error::the transit pilot is a dry run only"; exit 1; }
  echo "== Transit (GTFS from the Mobility Database catalog, r5py)"
  python3 -I scripts/access-transit.py "$WORK/zips.csv" "$WORK/osm/region.osm.pbf" "$WORK/gtfs" "$WORK/transit.csv" "$BBOX"
  TRANSIT_ARGS=(--transit "$WORK/transit.csv"); slug="$slug-transit-pilot"
fi
echo "== E2SFCA"
node scripts/access-dry-run.mjs --zips "$WORK/zips.csv" --supply "$WORK/supply.csv" --bench "$WORK/bench.csv" \
  --osrm http://127.0.0.1:5000 --osrm-foot http://127.0.0.1:5001 --nocar "$WORK/nocar.csv" --focus "$FOCUS" --label "${STATE_LABEL:-region}" --sample "${SAMPLE:-}" \
  --td supabase/reference/network-adequacy/time-distance.csv --specmap supabase/reference/network-adequacy/specialty-map.csv --zipcounty "$WORK/zipcounty.csv" --aliases supabase/reference/network-adequacy/county-aliases.csv --pins "$WORK/pins.csv" "${TRANSIT_ARGS[@]}" --burden "$WORK/$slug-burden.csv" \
  --report "$REF/$slug-dry-run.md" --csv "$WORK/$slug-access.csv" --load "$WORK/load.csv"
gzip -kf "$WORK/$slug-access.csv"; [ -f "$WORK/$slug-burden.csv" ] && gzip -kf "$WORK/$slug-burden.csv"
docker rm -f osrm osrmfoot >/dev/null || true

# ---- apply (the user's go-ahead for Tennessee, 2026-11-18): store the
# drive-time figures for the focus state's ZIPs in access_e2sfca (049), which
# market-score reads. One transaction: the state's earlier rows are replaced.
if [ "${MODE:-dry_run}" = apply ]; then
  [[ "${STATE_CODE:-}" =~ ^[A-Z]{2}$ ]] || { echo "::error::apply needs state_code (two letters)"; exit 1; }
  n=$(($(wc -l < "$WORK/load.csv") - 1))
  [ "$n" -ge "${MIN_ROWS:-400}" ] || { echo "::error::only $n rows to load; not writing"; exit 1; }
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X -f supabase/migrations/049_access_e2sfca.sql
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X <<SQL
begin;
create temp table s (zip text, specialty text, per_1k numeric, catchment_minutes integer) on commit drop;
\\copy s from '$WORK/load.csv' with (format csv, header true)
delete from public.access_e2sfca where state = '$STATE_CODE';
insert into public.access_e2sfca (zip, specialty, per_1k, catchment_minutes, state) select zip, specialty, per_1k, catchment_minutes, '$STATE_CODE' from s;
commit;
SQL
  got=$(psql "$SUPABASE_DB_URL" -At -X -c "select count(*) from public.access_e2sfca where state = '$STATE_CODE'")
  [ "$got" -eq "$n" ] || { echo "::error::wrote $got rows, expected $n"; exit 1; }
  printf '\n## Applied %s\n\n- %s rows (ZIP x specialty) stored in access_e2sfca for %s; market-score now uses drive-time access for these ZIPs.\n' "$(date -u +%F)" "$got" "$STATE_CODE" >> "$REF/$slug-dry-run.md"
  echo "applied $got rows"
fi
