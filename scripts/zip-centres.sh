#!/usr/bin/env bash
# Loads zip_centres (migration 054): the Census Gazetteer's point for every
# ZCTA that cdc_places lacks, adults from census_acs_zcta's age bands.
# MODE=dry_run reports only; MODE=apply runs 054 and replaces the table in one
# transaction. Report: supabase/reference/zip-centres.md.
set -euo pipefail
MODE="${MODE:-dry_run}"; WORK="${WORK:-/tmp/zip-centres}"; REF=supabase/reference/zip-centres.md
mkdir -p "$WORK"
year=""
for y in 2025 2024 2023; do
  u="https://www2.census.gov/geo/docs/maps-data/data/gazetteer/${y}_Gazetteer/${y}_Gaz_zcta_national.zip"
  if curl -fsSL --retry 5 --retry-all-errors -o "$WORK/gaz.zip" "$u"; then year=$y; break; fi
done
[ -n "$year" ] || { echo "No Gazetteer file found"; exit 1; }
unzip -o -q "$WORK/gaz.zip" -d "$WORK"
f=$(ls "$WORK"/*Gaz_zcta_national*.txt | head -1)
# Tab separated, header GEOID ... INTPTLAT INTPTLONG (trailing spaces).
awk -F'\t' 'NR==1{for(i=1;i<=NF;i++){h=$i;gsub(/ /,"",h);c[h]=i};next} {g=$c["GEOID"];la=$c["INTPTLAT"];lo=$c["INTPTLONG"];gsub(/ /,"",la);gsub(/ /,"",lo);print g","la","lo}' "$f" > "$WORK/gaz.csv"
n=$(wc -l < "$WORK/gaz.csv"); echo "Gazetteer $year: $n ZCTAs"
[ "$n" -ge 30000 ] || { echo "Too few ZCTAs"; exit 1; }
[ "$MODE" = apply ] && psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -X -q -f supabase/migrations/054_zip_centres.sql
TX=$([ "$MODE" = apply ] && echo "begin;" || echo "begin transaction read only;")
END=$([ "$MODE" = apply ] && echo "commit;" || echo "rollback;")
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -X -q -A -t > "$WORK/out.txt" <<SQL
$TX
create temp table gaz (zip text, lat numeric, lon numeric) on commit drop;
\\copy gaz from '$WORK/gaz.csv' with (format csv)
create temp table cand on commit drop as
  select g.zip, g.lat, g.lon,
    round(
      (select coalesce(sum(v::numeric), 0) from jsonb_array_elements_text(a.age_male) with ordinality t(v, i) where i >= 5)
    + (select coalesce(sum(v::numeric), 0) from jsonb_array_elements_text(a.age_female) with ordinality t(v, i) where i >= 5)
    + 0.4 * (coalesce((a.age_male->>3)::numeric, 0) + coalesce((a.age_female->>3)::numeric, 0)))::int as adults
  from gaz g join public.census_acs_zcta a on a.zip = g.zip
  where not exists (select 1 from public.cdc_places p where p.zip = g.zip and p.measureid = 'DENTAL');
select 'missing_from_places|' || (select count(*) from gaz g where not exists (select 1 from public.cdc_places p where p.zip = g.zip and p.measureid = 'DENTAL'));
select 'with_acs|' || count(*) || '|' || coalesce(sum(adults), 0) from cand;
select 'pr|' || count(*) || '|' || coalesce(sum(adults), 0) from cand where zip like '00%';
select 'sample|' || zip || ' ' || round(lat::numeric, 3) || ',' || round(lon::numeric, 3) || ' adults ' || adults from cand order by zip limit 8;
$( [ "$MODE" = apply ] && echo "delete from public.zip_centres; insert into public.zip_centres (zip, lat, lon, pop_18plus, gazetteer_year) select zip, lat, lon, adults, $year from cand where adults > 0; select 'loaded|' || count(*) from public.zip_centres;" )
$END
SQL
cat "$WORK/out.txt"
{
  echo "# ZIP centres where CDC PLACES has none"; echo
  echo "Run $(date -u +%F), mode $MODE, Census Gazetteer $year ($n ZCTAs)."; echo
  awk -F'|' '
    $1=="missing_from_places"{print "- ZCTAs with no PLACES centre: " $2}
    $1=="with_acs"{print "- Of those, with Census age data: " $2 " (" $3 " adults)"}
    $1=="pr"{print "- Puerto Rico: " $2 " ZCTAs, " $3 " adults"}
    $1=="loaded"{print "- Loaded into zip_centres: " $2}
    $1=="sample"{s=s "\n  - " $2}
    END{if(s) print "- Sample:" s}' "$WORK/out.txt"
} > "$REF"
cat "$REF"
