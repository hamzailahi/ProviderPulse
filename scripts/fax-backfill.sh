#!/usr/bin/env bash
# Fills clinics.fax (NPI-2 organizations) and provider_individuals.fax
# (NPI-1 clinicians) from the NPPES monthly full file. Neither table ever
# had a fax column; the only fax anywhere in the product was a live,
# non-persisted NPI Registry API lookup in the dashboard popup.
#
#   MODE=dry_run (default)  reads only: size check, NPPES, how many would change
#   MODE=apply              runs migration 047, then writes; refuses unless
#                           DISK_FREE_GB covers the need
#
# Env: SUPABASE_DB_URL (Session pooler string), MODE, DISK_FREE_GB (free disk
# shown in Supabase, Settings > Compute and Disk), NPPES_URL (optional
# override for the monthly file link).
# Writes supabase/reference/fax-backfill-summary.md. Re-running is safe: rows
# already right are skipped, so an interrupted apply resumes.
#
# Source is the NPPES monthly file only (no API fallback, unlike the phone
# backfill): fax needs both entity types in one pass and the API crawler
# (scripts/lib/nppes-api-phones.mjs) was built and paced for organizations
# only. If the monthly file site is down again, wait for it rather than
# building a two-entity-type API crawler for a one-time backfill.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
MODE="${MODE:-dry_run}"
WORK="${WORK:-/tmp/faxbf}"
REF=supabase/reference
mkdir -p "$WORK" "$REF"
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
psqlq() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }
[ "$MODE" = dry_run ] || [ "$MODE" = apply ] || fail "MODE must be dry_run or apply, got $MODE"

# ---- 1. Size check (read only) ------------------------------------------------
# An UPDATE writes a new version of each changed row (and index entries); the
# old ones are reclaimed by vacuum. Budget each table once more, staging and a
# burst of WAL.
echo "== Size check"
clinics_bytes=$(psqlq -At -c "select pg_total_relation_size('public.clinics')") || fail "Size check failed"
indiv_bytes=$(psqlq -At -c "select pg_total_relation_size('public.provider_individuals')") || fail "Size check failed"
need_gb=$(awk -v a="$clinics_bytes" -v b="$indiv_bytes" 'BEGIN { printf "%.1f", ((a + b) * 1.1 + 0.3e9 + 2e9) / 1e9 }')
has_col_clinics=$(psqlq -At -c "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'clinics' and column_name = 'fax'")
has_col_indiv=$(psqlq -At -c "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'provider_individuals' and column_name = 'fax'")
{
  echo "## Size check"; echo
  awk -v a="$clinics_bytes" -v b="$indiv_bytes" 'BEGIN { printf "- clinics: %.2f GB\n- provider_individuals: %.2f GB\n", a / 1e9, b / 1e9 }'
  echo "- Estimated extra disk needed: **${need_gb} GB** (both tables rewritten once, staging and WAL)"
  echo "- Free disk entered: ${DISK_FREE_GB:-not given}"
  echo "- fax columns (migration 047): clinics $([ "$has_col_clinics" = 1 ] && echo present || echo 'not yet; apply adds it'), provider_individuals $([ "$has_col_indiv" = 1 ] && echo present || echo 'not yet; apply adds it')"
} > "$WORK/size.md"
cat "$WORK/size.md"
if [ "$MODE" = apply ]; then
  [ -n "${DISK_FREE_GB:-}" ] || fail "Apply needs disk_free_gb (Supabase: Settings, Compute and Disk). Estimated need: ${need_gb} GB."
  awk -v f="$DISK_FREE_GB" -v n="$need_gb" 'BEGIN { exit !(f + 0 >= n + 0) }' \
    || fail "Not enough headroom: ${DISK_FREE_GB} GB free, ${need_gb} GB needed. Grow the disk in Supabase first, then run again."
fi

# ---- 2. Export both tables (read only) ----------------------------------------
echo "== Exporting clinics and provider_individuals"
clinics_fax_expr=$([ "$has_col_clinics" = 1 ] && echo "coalesce(fax,'')" || echo "''")
indiv_fax_expr=$([ "$has_col_indiv" = 1 ] && echo "coalesce(fax,'')" || echo "''")
psqlq > /dev/null 2> "$WORK/err" <<SQL || fail "clinics export failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select distinct on (npi) npi::text, $clinics_fax_expr as fax from public.clinics where npi ~ '^[0-9]{10}\$' order by npi) to '$WORK/clinics.csv' with (format csv, header true)
commit;
SQL
psqlq > /dev/null 2> "$WORK/err" <<SQL || fail "provider_individuals export failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select distinct on (npi) npi::text, $indiv_fax_expr as fax from public.provider_individuals where npi ~ '^[0-9]{10}\$' order by npi) to '$WORK/individuals.csv' with (format csv, header true)
commit;
SQL
echo "   $(($(wc -l < "$WORK/clinics.csv") - 1)) organizations, $(($(wc -l < "$WORK/individuals.csv") - 1)) individuals"

# ---- 3. NPPES faxes: the monthly file, both entity types in one pass ----------
echo "== NPPES monthly file"
if [ -z "${NPPES_URL:-}" ]; then
  # shellcheck source=lib/nppes-url.sh
  . scripts/lib/nppes-url.sh
  NPPES_URL=$(nppes_monthly_url) || fail "No NPPES monthly file found (see the links listed above). Pass nppes_url to the workflow."
fi
echo "   $NPPES_URL"
curl -fsSL --retry 3 -o "$WORK/nppes.zip" "$NPPES_URL" || fail "NPPES download failed: $NPPES_URL"
member=$(unzip -Z1 "$WORK/nppes.zip" | grep -E '^npidata_pfile_.*\.csv$' | grep -vi fileheader | head -1)
[ -n "$member" ] || fail "No npidata_pfile CSV inside $(basename "$NPPES_URL")"
unzip -p "$WORK/nppes.zip" "$member" | node scripts/nppes-fax.mjs > "$WORK/nppes-fax.csv" 2> "$WORK/nppes.log" \
  || fail "NPPES parse failed: $(tail -3 "$WORK/nppes.log" | tr '\n' ' ' | cut -c1-300)"
rm -f "$WORK/nppes.zip"
nppes_stats=$(tail -1 "$WORK/nppes.log")
src_label="NPPES file $(basename "$NPPES_URL")"
echo "   $nppes_stats"

# Split the combined npi,entity,fax file into the per-table npi,fax files
# the assign script expects.
awk -F, 'NR==1 { print "npi,fax" > o1; print "npi,fax" > o2; next } $2=="2" { print $1","$3 > o1 } $2=="1" { print $1","$3 > o2 }' \
  o1="$WORK/nppes-fax-orgs.csv" o2="$WORK/nppes-fax-indiv.csv" "$WORK/nppes-fax.csv"

# ---- 4. Which rows change, per table -------------------------------------------
node --max-old-space-size=4096 scripts/fax-assign.mjs --table clinics --rows "$WORK/clinics.csv" --nppes "$WORK/nppes-fax-orgs.csv" \
  --assign "$WORK/assign-clinics.csv" --summary "$WORK/assign-clinics.md"
node --max-old-space-size=4096 scripts/fax-assign.mjs --table provider_individuals --rows "$WORK/individuals.csv" --nppes "$WORK/nppes-fax-indiv.csv" \
  --assign "$WORK/assign-individuals.csv" --summary "$WORK/assign-individuals.md"
to_write_clinics=$(($(wc -l < "$WORK/assign-clinics.csv") - 1))
to_write_indiv=$(($(wc -l < "$WORK/assign-individuals.csv") - 1))
{
  echo "<!-- Written by scripts/fax-backfill.sh. -->"
  echo "Run: $(date -u +%F' '%H:%M) UTC, mode **$MODE**, source: $src_label."
  echo; echo "NPPES extract: \`$nppes_stats\`"
  echo; cat "$WORK/size.md"; echo; cat "$WORK/assign-clinics.md"; echo; cat "$WORK/assign-individuals.md"
} > "$REF/fax-backfill-summary.md"

if [ "$MODE" = dry_run ]; then
  echo "Dry run: nothing written. $to_write_clinics organizations and $to_write_indiv individuals would get a fax."
  exit 0
fi

# ---- 5. Apply ---------------------------------------------------------------------
echo "== Migration 047"
psqlq -f supabase/migrations/047_fax_numbers.sql || fail "Migration 047 failed"

update_table() {
  local table="$1" assign_csv="$2" to_write="$3"
  [ "$to_write" -gt 0 ] || return 0
  echo "== Staging $to_write faxes for $table"
  psqlq <<SQL || fail "Staging failed for $table"
create unlogged table if not exists public.fax_backfill_stage (npi text primary key, fax text not null);
truncate public.fax_backfill_stage;
\\copy public.fax_backfill_stage from '$assign_csv' with (format csv, header true)
analyze public.fax_backfill_stage;
SQL
  echo "== Updating $table in batches"
  local sql="$WORK/batches-$table.sql"
  {
    echo "set statement_timeout = 0;"
    local i=0
    for p in $(seq 1000 2999); do
      echo "update public.$table t set fax = s.fax from public.fax_backfill_stage s where s.npi = t.npi and t.npi >= '$p' and t.npi < '$((p + 1))' and t.fax is distinct from s.fax;"
      i=$((i + 1))
      if [ $((i % 250)) -eq 0 ]; then echo "\\echo $table: $i of 2000 batches"; echo "vacuum (analyze) public.$table;"; fi
    done
    echo "vacuum (analyze) public.$table;"
  } > "$sql"
  psqlq -f "$sql" 2> "$WORK/err-$table" || fail "Batch update failed for $table: $(tail -3 "$WORK/err-$table" | tr '\n' ' ' | cut -c1-300)"
  psqlq -c "drop table if exists public.fax_backfill_stage;"
}

update_table clinics "$WORK/assign-clinics.csv" "$to_write_clinics"
update_table provider_individuals "$WORK/assign-individuals.csv" "$to_write_indiv"

echo "== Checking"
{
  psqlq -At -c "select count(*) filter (where fax is not null), count(*) from public.clinics" \
    | awk -F'|' '{ printf "- clinics with a fax: %\047d of %\047d\n", $1, $2 }'
  psqlq -At -c "select count(*) filter (where fax is not null), count(*) from public.provider_individuals" \
    | awk -F'|' '{ printf "- provider_individuals with a fax: %\047d of %\047d\n", $1, $2 }'
} | tee -a "$REF/fax-backfill-summary.md" | sed '1s/^/\n## After apply\n\n/'
echo "Done. Next: add fax to the relevant selects in v2/assets/directory.js if it should be shown."
