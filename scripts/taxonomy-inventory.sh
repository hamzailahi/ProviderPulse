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

# Full-table GROUP BYs over millions of rows: give them time, and make the
# session read-only so this script cannot change anything even by mistake.
PGOPTIONS='-c statement_timeout=900000 -c default_transaction_read_only=on' \
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -c "\copy (
  select coalesce(t.taxonomy, '') as primary_taxonomy,
         sum(case when t.src = 'clinics' then t.n else 0 end)::bigint as clinics_rows,
         sum(case when t.src = 'individuals' then t.n else 0 end)::bigint as individual_rows,
         sum(case when t.src = 'secondary' then t.n else 0 end)::bigint as secondary_rows,
         sum(t.n)::bigint as total_rows
  from (
    select 'clinics' as src, primary_taxonomy::text as taxonomy, count(*) as n
      from public.clinics group by 2
    union all
    select 'individuals', primary_taxonomy, count(*)
      from public.provider_individuals group by 2
    union all
    select 'secondary', primary_taxonomy, count(*)
      from public.clinic_secondary_locations group by 2
  ) t
  group by 1
  order by total_rows desc, primary_taxonomy
) to '$out/taxonomy-inventory.csv' with (format csv, header true)"

rows=$(($(wc -l < "$out/taxonomy-inventory.csv") - 1))
if [ "$rows" -lt 100 ]; then
  echo "Only $rows distinct taxonomies came back; expected hundreds. Not keeping it." >&2
  exit 1
fi
echo "Inventory: $rows distinct taxonomy values"

# NUCC names each release's file by version (nucc_taxonomy_251.csv, ...), so
# read the link off the CSV page and take the highest version.
page='https://www.nucc.org/index.php/code-sets-mainmenu-41/provider-taxonomy-mainmenu-40/csv-mainmenu-57'
link=$(curl -fsSL "$page" | grep -oE '/images/stories/CSV/nucc_taxonomy_[0-9]+\.csv' | sort -t_ -k3 -V | tail -1)
if [ -z "$link" ]; then
  echo "Could not find the NUCC CSV link on $page" >&2
  exit 1
fi
curl -fsSL "https://www.nucc.org$link" -o "$out/nucc_taxonomy.csv"
codes=$(grep -cE '^"?[0-9A-Z]{9}X' "$out/nucc_taxonomy.csv" || true)
if [ "$codes" -lt 500 ]; then
  echo "NUCC file has only $codes codes; expected about 870." >&2
  exit 1
fi
echo "NUCC: $codes codes from ${link##*/}"
echo "${link##*/}" > "$out/nucc_version.txt"
