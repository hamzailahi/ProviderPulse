#!/usr/bin/env bash
# Applies one ordinary migration file through psql (apply-migration.yml) and
# shows the result, so a migration need not be pasted into the SQL editor.
# The file must already be in git (CLAUDE.md: Supabase keeps no history of
# editor SQL). Concurrent index migrations use build-indexes.sh instead.
#
# Usage: SUPABASE_DB_URL=... bash scripts/apply-migration.sh supabase/migrations/041_listing_reports.sql
set -euo pipefail
FILE="${1:?migration file}"
[ -f "$FILE" ] || { echo "No such file: $FILE"; exit 1; }
[ -n "${SUPABASE_DB_URL:-}" ] || { echo "SUPABASE_DB_URL is not set"; exit 1; }
if grep -qi 'concurrently' "$FILE"; then echo "$FILE builds indexes concurrently; use concurrent-indexes.yml"; exit 1; fi
echo "== Applying $FILE"
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -q -f "$FILE"
# The REST API caches the schema: a new table answers 404 (PGRST205) until it
# reloads, so the functions could not write to 041's table straight after.
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -q -c "notify pgrst, 'reload schema';"
sleep 3
case "$(basename "$FILE")" in
  041_*)
    echo "== listing_reports"
    psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -At -c "
      select 'table: ' || count(*) from information_schema.tables where table_schema = 'public' and table_name = 'listing_reports';
      select 'rls enabled: ' || relrowsecurity from pg_class where oid = 'public.listing_reports'::regclass;
      select 'policies: ' || count(*) from pg_policies where schemaname = 'public' and tablename = 'listing_reports';
      select 'anon/authenticated grants: ' || count(*) from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'listing_reports' and grantee in ('anon', 'authenticated');"
    ;;
esac
echo "== Done"
