#!/usr/bin/env bash
# Runs a CREATE INDEX CONCURRENTLY migration through psql, where each
# statement commits on its own (the Supabase SQL editor wraps a paste in one
# transaction, which CONCURRENTLY refuses: 25001). Invalid leftovers from a
# failed earlier build are dropped first, and every index the migration names
# must be valid at the end. Generalizes scripts/taxonomy-indexes.sh (030).
#
# Usage: SUPABASE_DB_URL=... scripts/build-indexes.sh supabase/migrations/038_geo_indexes.sql
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
file="${1:?migration file}"
fail() { echo "::error::$1"; echo "$1" >&2; exit 1; }
psqlq() { psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -q "$@"; }
[ -f "$file" ] || fail "No such file: $file"
mapfile -t idx < <(grep -oiE 'create index concurrently if not exists [a-z0-9_]+' "$file" | awk '{print $NF}')
[ "${#idx[@]}" -gt 0 ] || fail "$file creates no concurrent index"
names=$(printf "'%s'," "${idx[@]}"); names=${names%,}

for ix in $(psqlq -At -c "select c.relname from pg_index i join pg_class c on c.oid = i.indexrelid where c.relname in ($names) and not i.indisvalid"); do
  echo "Dropping invalid leftover index $ix"
  psqlq -c "drop index concurrently if exists public.$ix" || fail "Could not drop invalid index $ix"
done

echo "Building ${#idx[@]} index(es) from $file (the tables stay usable)"
{ echo "set statement_timeout = 0;"; grep -v '^--' "$file"; } > /tmp/concurrent.sql
psqlq -f /tmp/concurrent.sql 2> /tmp/concurrent.err || fail "Index build failed: $(tr '\n' ' ' < /tmp/concurrent.err | cut -c1-300)"

report=$(psqlq -At -F ' | ' -c "select c.relname, case when i.indisvalid then 'valid' else 'INVALID' end, pg_size_pretty(pg_relation_size(c.oid)) from pg_index i join pg_class c on c.oid = i.indexrelid where c.relname in ($names) order by 1")
echo "$report"
[ "$(echo "$report" | grep -c '| valid |')" = "${#idx[@]}" ] || fail "Expected ${#idx[@]} valid indexes, got: $(echo "$report" | tr '\n' ';')"
echo "::notice::Built and valid: $(echo "$report" | tr '\n' ';')"
