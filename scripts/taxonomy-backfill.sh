#!/usr/bin/env bash
# Fills taxonomy_code / taxonomy_code_source on clinics, provider_individuals
# and clinic_secondary_locations from the NPPES monthly full file, and loads
# taxonomy_map. Needs migration 029.
#
#   MODE=dry_run (default)  reads only: size check, NPPES, assignment, exceptions
#   MODE=apply              also writes; refuses unless DISK_FREE_GB covers the need
#
# Env: SUPABASE_DB_URL (Session pooler string), MODE, DISK_FREE_GB (free disk
# shown in Supabase, Settings > Compute and Disk), NPPES_URL (optional override).
# Outputs to supabase/reference/: taxonomy-backfill-summary.md and
# taxonomy-exceptions.csv. Re-running is safe: rows already correct are skipped.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
MODE="${MODE:-dry_run}"
WORK="${WORK:-/tmp/taxbf}"
REF=supabase/reference
mkdir -p "$WORK" "$REF"
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
psqlq() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }
[ "$MODE" = dry_run ] || [ "$MODE" = apply ] || fail "MODE must be dry_run or apply, got $MODE"

# ---- 1. Size check (read only) -------------------------------------------
# An UPDATE writes a new version of each row and, for indexed tables, new index
# entries; the old versions are only reclaimed by vacuum. Worst case the three
# tables need their current total size again, plus the staging table, plus a
# burst of write-ahead log (WAL) before checkpoints recycle it.
echo "== Size check"
psqlq -At -F $'\t' -c "begin transaction read only;
  select c.relname, pg_total_relation_size(c.oid) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('clinics','provider_individuals','clinic_secondary_locations');
  commit;" > "$WORK/sizes.tsv" 2> "$WORK/err" || fail "Size check failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
total_bytes=$(awk -F'\t' '{s+=$2} END {print s+0}' "$WORK/sizes.tsv")
need_gb=$(awk -v b="$total_bytes" 'BEGIN { printf "%.1f", (b * 1.1 + 1.5e9 + 2e9) / 1e9 }')
{
  echo "## Size check"; echo
  awk -F'\t' '{ printf "- %s: %.2f GB\n", $1, $2/1e9 }' "$WORK/sizes.tsv"
  echo "- Estimated extra disk needed for the backfill: **${need_gb} GB** (all three tables rewritten once, about 1.5 GB of staging and 2 GB of WAL)"
  echo "- Free disk entered: ${DISK_FREE_GB:-not given}"
} > "$WORK/size.md"
cat "$WORK/size.md"
if [ "$MODE" = apply ]; then
  [ -n "${DISK_FREE_GB:-}" ] || fail "Apply needs disk_free_gb (Supabase: Settings, Compute and Disk). Estimated need: ${need_gb} GB."
  awk -v f="$DISK_FREE_GB" -v n="$need_gb" 'BEGIN { exit !(f + 0 >= n + 0) }' \
    || fail "Not enough headroom: ${DISK_FREE_GB} GB free, ${need_gb} GB needed. Grow the disk in Supabase first, then run again."
fi

# ---- 2. Export the directory (read only) -----------------------------------
echo "== Exporting directory rows"
psqlq > /dev/null 2> "$WORK/err" <<SQL || {
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select 'clinics' as tbl, npi::text as key, npi::text as npi, coalesce(primary_taxonomy,'') as primary_taxonomy, coalesce(taxonomy_code,'') as current_code, coalesce(taxonomy_code_source,'') as current_source from public.clinics where npi is not null union all select 'individuals', npi, npi, coalesce(primary_taxonomy,''), coalesce(taxonomy_code,''), coalesce(taxonomy_code_source,'') from public.provider_individuals union all select 'secondary', id::text, parent_npi, coalesce(primary_taxonomy,''), coalesce(taxonomy_code,''), coalesce(taxonomy_code_source,'') from public.clinic_secondary_locations) to '$WORK/directory.csv' with (format csv, header true)
commit;
SQL
  grep -q 'taxonomy_code' "$WORK/err" && fail "Migration 029 is not applied (no taxonomy_code column). Run it in the SQL editor first."
  fail "Directory export failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
}
echo "   $(($(wc -l < "$WORK/directory.csv") - 1)) rows"

# ---- 3. NPPES monthly full file ---------------------------------------------
echo "== NPPES"
if [ -z "${NPPES_URL:-}" ]; then
  page=https://download.cms.gov/nppes/NPI_Files.html
  html=$(curl -fsSL "$page") || fail "NPPES download page unreachable: $page"
  # The monthly full file is named by month and year; the weekly ones use digits.
  file=$(echo "$html" | grep -oE 'NPPES_Data_Dissemination_[A-Za-z]+_20[0-9]{2}(_V2)?\.zip' | sort -u | awk '/_V2/ {v2=$0} {any=$0} END {print (v2 ? v2 : any)}')
  [ -n "$file" ] || fail "No monthly NPPES file link found on $page. Pass nppes_url to the workflow."
  NPPES_URL="https://download.cms.gov/nppes/$file"
fi
echo "   $NPPES_URL"
curl -fsSL --retry 3 -o "$WORK/nppes.zip" "$NPPES_URL" || fail "NPPES download failed: $NPPES_URL"
member=$(unzip -Z1 "$WORK/nppes.zip" | grep -E '^npidata_pfile_.*\.csv$' | grep -vi fileheader | head -1)
[ -n "$member" ] || fail "No npidata_pfile CSV inside $(basename "$NPPES_URL")"
unzip -p "$WORK/nppes.zip" "$member" | node scripts/nppes-taxonomies.mjs > "$WORK/nppes-taxonomy.csv" 2> "$WORK/nppes.log" \
  || fail "NPPES parse failed: $(tail -3 "$WORK/nppes.log" | tr '\n' ' ' | cut -c1-300)"
rm -f "$WORK/nppes.zip"
nppes_stats=$(tail -1 "$WORK/nppes.log")
echo "   $nppes_stats"

# ---- 4. Decide every row's code ---------------------------------------------
echo "== Assigning codes"
node --max-old-space-size=8192 scripts/taxonomy-assign.mjs --nppes "$WORK/nppes-taxonomy.csv" --rows "$WORK/directory.csv" \
  --assign "$WORK/assign.csv" --exceptions "$WORK/exceptions.csv" --summary "$WORK/assign.md"
to_write=$(($(wc -l < "$WORK/assign.csv") - 1))
n_exc=$(($(wc -l < "$WORK/exceptions.csv") - 1))

# Exceptions are public directory data (NPIs and taxonomy names); cap the file
# so a bad run cannot commit a huge one.
CAP=200000
head -n $((CAP + 1)) "$WORK/exceptions.csv" > "$REF/taxonomy-exceptions.csv"
{
  echo "<!-- Written by scripts/taxonomy-backfill.sh. -->"
  echo "Run: $(date -u +%F' '%H:%M) UTC, mode **$MODE**, NPPES file $(basename "$NPPES_URL")."
  echo; echo "NPPES extract: \`$nppes_stats\` (nppes_first = no primary flag, first listed code used)."
  echo; cat "$WORK/size.md"; echo; cat "$WORK/assign.md"
  [ "$n_exc" -gt "$CAP" ] && echo && echo "taxonomy-exceptions.csv holds the first $CAP of $n_exc exceptions."
} > "$REF/taxonomy-backfill-summary.md"

if [ "$MODE" = dry_run ]; then
  echo "Dry run: nothing written. $to_write rows would change; $n_exc exceptions."
  exit 0
fi

# ---- 5. Apply ---------------------------------------------------------------
echo "== Loading taxonomy_map"
version=$(cat "$REF/nucc_version.txt" 2>/dev/null || echo unknown)
psqlq <<SQL || fail "Loading taxonomy_map failed"
create temp table tm_stage (nucc_code text, grouping text, classification text, specialization text, display_name text,
  section text, cms_specialty_code text, cms_specialty_name text, patient_specialties text, show_on_map text);
\\copy tm_stage from '$REF/taxonomy_map.csv' with (format csv, header true)
insert into public.taxonomy_map (nucc_code, grouping, classification, specialization, display_name, section,
  cms_specialty_code, cms_specialty_name, patient_specialties, show_on_map, nucc_version)
select nucc_code, grouping, classification, coalesce(specialization,''), display_name, section,
  coalesce(cms_specialty_code,''), coalesce(cms_specialty_name,''),
  case when coalesce(patient_specialties,'') = '' then '{}'::text[] else string_to_array(patient_specialties, '; ') end,
  show_on_map::boolean, '$version'
from tm_stage
on conflict (nucc_code) do update set grouping = excluded.grouping, classification = excluded.classification,
  specialization = excluded.specialization, display_name = excluded.display_name, section = excluded.section,
  cms_specialty_code = excluded.cms_specialty_code, cms_specialty_name = excluded.cms_specialty_name,
  patient_specialties = excluded.patient_specialties, show_on_map = excluded.show_on_map,
  nucc_version = excluded.nucc_version, loaded_at = now();
select 'taxonomy_map rows not in this NUCC file (kept, check them): ' || count(*)
  from public.taxonomy_map t where not exists (select 1 from tm_stage s where s.nucc_code = t.nucc_code);
SQL

if [ "$to_write" -eq 0 ]; then
  echo "Every row already has the right code."
else
  echo "== Staging $to_write assignments"
  psqlq <<SQL || fail "Staging failed"
create unlogged table if not exists public.taxonomy_backfill_stage (tbl text not null, key text not null, code text not null, src text not null, primary key (tbl, key));
truncate public.taxonomy_backfill_stage;
\\copy public.taxonomy_backfill_stage from '$WORK/assign.csv' with (format csv, header true)
analyze public.taxonomy_backfill_stage;
SQL

  # One UPDATE per 4-digit NPI prefix (about 5,000 rows each), each its own
  # transaction, with VACUUM every 250 batches so old row versions are reused
  # instead of piling up. Rows already correct are skipped, so a rerun resumes.
  echo "== Updating in batches"
  sql="$WORK/batches.sql"
  {
    echo "set statement_timeout = 0;"
    for spec in "clinics:clinics:npi:npi" "individuals:provider_individuals:npi:npi" "secondary:clinic_secondary_locations:parent_npi:id::text"; do
      IFS=: read -r tag table rangecol keyexpr <<< "$spec"
      i=0
      for p in $(seq 1000 2999); do
        echo "update public.$table t set taxonomy_code = s.code, taxonomy_code_source = s.src from public.taxonomy_backfill_stage s where s.tbl = '$tag' and s.key = t.$keyexpr and t.$rangecol >= '$p' and t.$rangecol < '$((p + 1))' and (t.taxonomy_code is distinct from s.code or t.taxonomy_code_source is distinct from s.src);"
        i=$((i + 1))
        if [ $((i % 250)) -eq 0 ]; then echo "\\echo $table: $i of 2000 batches"; echo "vacuum (analyze) public.$table;"; fi
      done
      echo "vacuum (analyze) public.$table;"
    done
  } > "$sql"
  psqlq -f "$sql" 2> "$WORK/err" || fail "Batch update failed: $(tail -3 "$WORK/err" | tr '\n' ' ' | cut -c1-300)"
  psqlq -c "drop table if exists public.taxonomy_backfill_stage;"
fi

echo "== Checking"
psqlq -At -c "select 'clinics', count(*) filter (where taxonomy_code is null), count(*) from public.clinics
  union all select 'individuals', count(*) filter (where taxonomy_code is null), count(*) from public.provider_individuals
  union all select 'secondary', count(*) filter (where taxonomy_code is null), count(*) from public.clinic_secondary_locations;" \
  | awk -F'|' 'BEGIN { print "\n## After apply\n\n| Table | Rows without a code | Rows |\n|---|---|---|" } { printf "| %s | %\047d | %\047d |\n", $1, $2, $3 }' \
  | tee -a "$REF/taxonomy-backfill-summary.md"
echo "Done. Next: run migration 030 (indexes) in the SQL editor."
