#!/usr/bin/env bash
# Runs migration 030 (indexes on taxonomy_code, built CONCURRENTLY) through
# psql, where each statement commits on its own. The Supabase SQL editor wraps
# a multi-statement paste in one transaction, which CREATE INDEX CONCURRENTLY
# refuses ("cannot run inside a transaction block"). A concurrent build that
# fails part way leaves an INVALID index behind that "if not exists" would then
# skip, so invalid ones are dropped first and validity is checked after.
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
psqlq() { psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -q "$@"; }
names="'clinics_taxonomy_code_idx','provider_individuals_taxonomy_code_idx','clinic_secondary_locations_taxonomy_code_idx'"

for ix in $(psqlq -At -c "select c.relname from pg_index i join pg_class c on c.oid = i.indexrelid where c.relname in ($names) and not i.indisvalid"); do
  echo "Dropping invalid leftover index $ix"
  psqlq -c "drop index concurrently if exists public.$ix" || fail "Could not drop invalid index $ix"
done

echo "Building indexes (a few minutes each; the tables stay usable)"
{ echo "set statement_timeout = 0;"; grep -v '^--' supabase/migrations/030_taxonomy_code_indexes.sql; } > /tmp/030.sql
psqlq -f /tmp/030.sql 2> /tmp/030.err || fail "Index build failed: $(tr '\n' ' ' < /tmp/030.err | cut -c1-300)"

report=$(psqlq -At -F ' | ' -c "select c.relname, case when i.indisvalid then 'valid' else 'INVALID' end, pg_size_pretty(pg_relation_size(c.oid)) from pg_index i join pg_class c on c.oid = i.indexrelid where c.relname in ($names) order by 1")
echo "$report"
[ "$(echo "$report" | grep -c '| valid |')" = "3" ] || fail "Expected 3 valid indexes, got: $(echo "$report" | tr '\n' ';')"
echo "::notice::All three taxonomy_code indexes are built and valid: $(echo "$report" | tr '\n' ';')"
