#!/usr/bin/env bash
# Fills clinics.phone (NPI-2 organizations) from the NPPES monthly full file.
# Patient search showed no number for a pharmacy, urgent care or hospital,
# because clinics never had a phone column (provider_individuals does).
#
#   MODE=dry_run (default)  reads only: size check, NPPES, how many would change
#   MODE=apply              runs migration 040, then writes; refuses unless
#                           DISK_FREE_GB covers the need
#
# Env: SUPABASE_DB_URL (Session pooler string), MODE, DISK_FREE_GB (free disk
# shown in Supabase, Settings > Compute and Disk), SOURCE (file, the NPPES
# monthly file, or api, the NPI Registry API ZIP by ZIP: CMS's download site
# was down for maintenance on 2026-10-24), NPPES_URL (optional override for
# file), ZIP_LIMIT (api: only the N largest ZIPs, a sample), PHONES_FROM (a
# dry run's npi,phone file, so apply skips the API pass).
# Writes supabase/reference/org-phone-backfill-summary.md. Re-running is safe:
# rows already right are skipped, so an interrupted apply resumes.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
MODE="${MODE:-dry_run}"
SOURCE="${SOURCE:-file}"
WORK="${WORK:-/tmp/phonebf}"
REF=supabase/reference
mkdir -p "$WORK" "$REF"
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
psqlq() { psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -X "$@"; }
[ "$MODE" = dry_run ] || [ "$MODE" = apply ] || fail "MODE must be dry_run or apply, got $MODE"
[ "$SOURCE" = file ] || [ "$SOURCE" = api ] || fail "SOURCE must be file or api, got $SOURCE"
[ "$MODE" = dry_run ] || [ -z "${ZIP_LIMIT:-}" ] || fail "ZIP_LIMIT is for dry runs only: an apply from a sample would leave most organizations without a phone"

# ---- 1. Size check (read only) ------------------------------------------------
# An UPDATE writes a new version of each changed row (and index entries); the
# old ones are reclaimed by vacuum. Budget the table once more, the staging
# table and a burst of WAL.
echo "== Size check"
bytes=$(psqlq -At -c "select pg_total_relation_size('public.clinics')") || fail "Size check failed"
need_gb=$(awk -v b="$bytes" 'BEGIN { printf "%.1f", (b * 1.1 + 0.3e9 + 2e9) / 1e9 }')
has_col=$(psqlq -At -c "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'clinics' and column_name = 'phone'")
{
  echo "## Size check"; echo
  awk -v b="$bytes" 'BEGIN { printf "- clinics: %.2f GB\n", b / 1e9 }'
  echo "- Estimated extra disk needed: **${need_gb} GB** (the table rewritten once, staging and WAL)"
  echo "- Free disk entered: ${DISK_FREE_GB:-not given}"
  echo "- clinics.phone column (migration 040): $([ "$has_col" = 1 ] && echo present || echo 'not yet; apply adds it')"
} > "$WORK/size.md"
cat "$WORK/size.md"
if [ "$MODE" = apply ]; then
  [ -n "${DISK_FREE_GB:-}" ] || fail "Apply needs disk_free_gb (Supabase: Settings, Compute and Disk). Estimated need: ${need_gb} GB."
  awk -v f="$DISK_FREE_GB" -v n="$need_gb" 'BEGIN { exit !(f + 0 >= n + 0) }' \
    || fail "Not enough headroom: ${DISK_FREE_GB} GB free, ${need_gb} GB needed. Grow the disk in Supabase first, then run again."
fi

# ---- 2. Export organizations (read only) ----------------------------------------
echo "== Exporting clinics"
phone_expr=$([ "$has_col" = 1 ] && echo "coalesce(phone,'')" || echo "''")
psqlq > /dev/null 2> "$WORK/err" <<SQL || fail "clinics export failed: $(tr '\n' ' ' < "$WORK/err" | cut -c1-300)"
begin transaction read only;
set local statement_timeout = '30min';
\\copy (select distinct on (npi) npi::text, $phone_expr as phone, coalesce(zip, '') as zip from public.clinics where npi ~ '^[0-9]{10}$' order by npi) to '$WORK/clinics.csv' with (format csv, header true)
commit;
SQL
echo "   $(($(wc -l < "$WORK/clinics.csv") - 1)) organizations"

# ---- 3. NPPES phones: a dry run's results, the API, or the monthly file ----------
: > "$WORK/api.md"
if [ -n "${PHONES_FROM:-}" ]; then
  echo "== NPPES phones from an earlier dry run"
  [ -s "$PHONES_FROM" ] && head -1 "$PHONES_FROM" | grep -qx 'npi,phone' || fail "PHONES_FROM is not an npi,phone file: $PHONES_FROM"
  cp "$PHONES_FROM" "$WORK/nppes-phones.csv"
  [ -s "$(dirname "$PHONES_FROM")/api.md" ] && cp "$(dirname "$PHONES_FROM")/api.md" "$WORK/api.md"
  src_label="the NPI Registry API (results of dry run ${FROM_RUN:-?})"
  nppes_stats="$(($(wc -l < "$WORK/nppes-phones.csv") - 1)) organizations with a phone"
elif [ "$SOURCE" = api ]; then
  echo "== NPI Registry API, ZIP by ZIP"
  # Leave room in the job's 350 minutes: apply still has to write.
  budget=$([ "$MODE" = apply ] && echo 180 || echo 300)
  node scripts/nppes-phones-api.mjs --clinics "$WORK/clinics.csv" --out "$WORK/nppes-phones.csv" \
    --stats "$WORK/api-stats.json" --summary "$WORK/api.md" --budget-min "$budget" ${ZIP_LIMIT:+--zip-limit "$ZIP_LIMIT"} \
    || fail "NPI Registry API pass failed (see the lines above)"
  src_label="the NPI Registry API${ZIP_LIMIT:+ (sample: the $ZIP_LIMIT largest ZIPs)}"
  nppes_stats=$(cat "$WORK/api-stats.json")
else
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
unzip -p "$WORK/nppes.zip" "$member" | node scripts/nppes-phones.mjs > "$WORK/nppes-phones.csv" 2> "$WORK/nppes.log" \
  || fail "NPPES parse failed: $(tail -3 "$WORK/nppes.log" | tr '\n' ' ' | cut -c1-300)"
rm -f "$WORK/nppes.zip"
nppes_stats=$(tail -1 "$WORK/nppes.log")
src_label="NPPES file $(basename "$NPPES_URL")"
fi
echo "   $nppes_stats"

# ---- 4. Which rows change -----------------------------------------------------------
node --max-old-space-size=4096 scripts/org-phone-assign.mjs --rows "$WORK/clinics.csv" --nppes "$WORK/nppes-phones.csv" \
  --assign "$WORK/assign.csv" --summary "$WORK/assign.md"
to_write=$(($(wc -l < "$WORK/assign.csv") - 1))
{
  echo "<!-- Written by scripts/org-phone-backfill.sh. -->"
  echo "Run: $(date -u +%F' '%H:%M) UTC, mode **$MODE**, source: $src_label."
  echo; echo "NPPES extract: \`$nppes_stats\`"
  echo; cat "$WORK/size.md"; echo; cat "$WORK/assign.md"
  [ -s "$WORK/api.md" ] && { echo; cat "$WORK/api.md"; }
} > "$REF/org-phone-backfill-summary.md"

if [ "$MODE" = dry_run ]; then
  echo "Dry run: nothing written. $to_write organizations would get a phone."
  exit 0
fi

# ---- 5. Apply ---------------------------------------------------------------------
echo "== Migration 040"
psqlq -f supabase/migrations/040_clinics_phone.sql || fail "Migration 040 failed"

if [ "$to_write" -gt 0 ]; then
  echo "== Staging $to_write phones"
  psqlq <<SQL || fail "Staging failed"
create unlogged table if not exists public.phone_backfill_stage (npi text primary key, phone text not null);
truncate public.phone_backfill_stage;
\\copy public.phone_backfill_stage from '$WORK/assign.csv' with (format csv, header true)
analyze public.phone_backfill_stage;
SQL
  # One UPDATE per 4-digit NPI prefix (about 1,000 rows each), each its own
  # transaction, with VACUUM every 250 batches; rows already right are skipped.
  echo "== Updating in batches"
  sql="$WORK/batches.sql"
  {
    echo "set statement_timeout = 0;"
    i=0
    for p in $(seq 1000 2999); do
      echo "update public.clinics t set phone = s.phone from public.phone_backfill_stage s where s.npi = t.npi and t.npi >= '$p' and t.npi < '$((p + 1))' and t.phone is distinct from s.phone;"
      i=$((i + 1))
      if [ $((i % 250)) -eq 0 ]; then echo "\\echo clinics: $i of 2000 batches"; echo "vacuum (analyze) public.clinics;"; fi
    done
    echo "vacuum (analyze) public.clinics;"
  } > "$sql"
  psqlq -f "$sql" 2> "$WORK/err" || fail "Batch update failed: $(tail -3 "$WORK/err" | tr '\n' ' ' | cut -c1-300)"
  psqlq -c "drop table if exists public.phone_backfill_stage;"
fi

echo "== Checking"
psqlq -At -c "select count(*) filter (where phone is not null), count(*) from public.clinics" \
  | awk -F'|' '{ printf "\n## After apply\n\n- clinics with a phone: %\047d of %\047d\n", $1, $2 }' \
  | tee -a "$REF/org-phone-backfill-summary.md"
echo "Done. Next: add phone to the clinics select in v2/assets/directory.js."
