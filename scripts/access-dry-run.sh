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

echo "== Export (read only)"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X <<SQL
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select zip, avg(lat) lat, avg(lon) lon, max(pop_18plus) adults from public.cdc_places where measureid = 'DENTAL' and lat between $MINLAT and $MAXLAT and lon between $MINLON and $MAXLON and zip ~ '^[0-9]{5}\$' group by zip order by zip) to '$WORK/zips.csv' with (format csv, header true)
\\copy (select key, data->>'rate_per_1k' from public.market_benchmarks where kind = 'specialty') to '$WORK/bench.csv' with (format csv, header true)
\\copy (select z, taxonomy_code, sum(n) from (select left(zip, 5) z, taxonomy_code, count(*) n from public.clinics where taxonomy_code is not null and left(zip, 5) in (select zip from public.cdc_places where measureid = 'DENTAL' and lat between $MINLAT and $MAXLAT and lon between $MINLON and $MAXLON) group by 1, 2 union all select left(zip, 5), taxonomy_code, count(*) from public.provider_individuals where taxonomy_code is not null and left(zip, 5) in (select zip from public.cdc_places where measureid = 'DENTAL' and lat between $MINLAT and $MAXLAT and lon between $MINLON and $MAXLON) group by 1, 2) x group by 1, 2) to '$WORK/supply.csv' with (format csv, header true)
commit;
SQL
echo "   $(($(wc -l < "$WORK/zips.csv") - 1)) ZIPs, $(($(wc -l < "$WORK/supply.csv") - 1)) ZIP x code supply rows"

echo "== Roads (OpenStreetMap via Geofabrik, clipped to the region)"
parts=()
for s in $GEOFABRIK; do
  f="$WORK/osm/$(basename "$s").osm.pbf"
  curl -sSfL --retry 6 --retry-all-errors --retry-delay 20 -o "$f" "https://download.geofabrik.de/north-america/$s-latest.osm.pbf"
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

echo "== E2SFCA"
slug=$(echo "${STATE_LABEL:-region}" | tr 'A-Z ' 'a-z-')
node scripts/access-dry-run.mjs --zips "$WORK/zips.csv" --supply "$WORK/supply.csv" --bench "$WORK/bench.csv" \
  --osrm http://127.0.0.1:5000 --focus "$FOCUS" --label "${STATE_LABEL:-region}" --sample "${SAMPLE:-}" \
  --report "$REF/$slug-dry-run.md" --csv "$WORK/$slug-access.csv" --load "$WORK/load.csv"
gzip -kf "$WORK/$slug-access.csv"
docker rm -f osrm >/dev/null || true

# ---- apply (the user's go-ahead for Tennessee, 2026-11-18): store the
# drive-time figures for the focus state's ZIPs in access_e2sfca (049), which
# market-score reads. One transaction: the state's earlier rows are replaced.
if [ "${MODE:-dry_run}" = apply ]; then
  [[ "${STATE_CODE:-}" =~ ^[A-Z]{2}$ ]] || { echo "::error::apply needs state_code (two letters)"; exit 1; }
  n=$(($(wc -l < "$WORK/load.csv") - 1))
  [ "$n" -ge 1000 ] || { echo "::error::only $n rows to load; not writing"; exit 1; }
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
