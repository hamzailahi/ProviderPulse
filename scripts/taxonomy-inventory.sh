#!/usr/bin/env bash
# Builds the taxonomy reference files in supabase/reference/:
#
#   taxonomy-inventory.csv  every distinct primary_taxonomy value stored in
#                           clinics, provider_individuals and
#                           clinic_secondary_locations, with its row count in
#                           each (aggregates of public directory data only;
#                           nothing from provider_profiles or patients)
#   nucc_taxonomy.csv       the newest official NUCC code set, so each stored
#                           name can be matched to its 10-character code
#
# Usage: SUPABASE_DB_URL=postgresql://... scripts/taxonomy-inventory.sh
# Read only: one SELECT, run in a read-only transaction.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL (Supabase Session pooler connection string)}"
out=supabase/reference
mkdir -p "$out"

# Annotations (::error::) reach the job's check run, where they can be read
# without the full log. Each stage reports its own failure that way.
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }

# Full-table GROUP BYs over millions of rows: give them time, and run them in
# a READ ONLY transaction so this script cannot change anything even by
# mistake. (Session options in PGOPTIONS are not passed through Supabase's
# pooler, so they are set inside the transaction instead.)
cat > /tmp/inventory.sql <<SQL
begin transaction read only;
set local statement_timeout = '15min';
\copy (select coalesce(t.taxonomy, '') as primary_taxonomy, sum(case when t.src = 'clinics' then t.n else 0 end)::bigint as clinics_rows, sum(case when t.src = 'individuals' then t.n else 0 end)::bigint as individual_rows, sum(case when t.src = 'secondary' then t.n else 0 end)::bigint as secondary_rows, sum(t.n)::bigint as total_rows from (select 'clinics' as src, primary_taxonomy::text as taxonomy, count(*) as n from public.clinics group by 2 union all select 'individuals', primary_taxonomy, count(*) from public.provider_individuals group by 2 union all select 'secondary', primary_taxonomy, count(*) from public.clinic_secondary_locations group by 2) t group by 1 order by total_rows desc, primary_taxonomy) to '$out/taxonomy-inventory.csv' with (format csv, header true)
commit;
SQL
echo "Counting taxonomies (this can take several minutes)..."
if ! psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -f /tmp/inventory.sql 2> /tmp/psql.err; then
  fail "Database query failed: $(tr '\n' ' ' < /tmp/psql.err | cut -c1-400)"
fi

rows=$(($(wc -l < "$out/taxonomy-inventory.csv") - 1))
[ "$rows" -ge 100 ] || fail "Only $rows distinct taxonomies came back; expected hundreds. Not keeping it."
echo "Inventory: $rows distinct taxonomy values"

# NUCC names each release's file by version (nucc_taxonomy_251.csv, ...), so
# read the link off the CSV page and take the highest version. A NUCC failure
# is a warning, not a failure: the inventory above is still worth keeping.
nucc() {
  local page='https://www.nucc.org/index.php/code-sets-mainmenu-41/provider-taxonomy-mainmenu-40/csv-mainmenu-57'
  local ua='Mozilla/5.0 (X11; Linux x86_64) ProviderPulse taxonomy inventory'
  local html link codes
  html=$(curl -fsSL -A "$ua" "$page" 2>&1) || { echo "::warning::NUCC page unreachable: $(echo "$html" | tail -1 | cut -c1-200)"; return 0; }
  link=$(echo "$html" | grep -oE '/images/stories/CSV/nucc_taxonomy_[0-9]+\.csv' | sort -t_ -k3 -V | tail -1)
  [ -n "$link" ] || { echo "::warning::No NUCC CSV link found on the NUCC page"; return 0; }
  curl -fsSL -A "$ua" "https://www.nucc.org$link" -o /tmp/nucc.csv || { echo "::warning::NUCC download failed for $link"; return 0; }
  codes=$(grep -cE '^"?[0-9A-Z]{9}X' /tmp/nucc.csv || true)
  [ "$codes" -ge 500 ] || { echo "::warning::NUCC file has only $codes codes; not kept"; return 0; }
  mv /tmp/nucc.csv "$out/nucc_taxonomy.csv"
  echo "${link##*/}" > "$out/nucc_version.txt"
  echo "::notice::NUCC: $codes codes from ${link##*/}"
}
nucc
