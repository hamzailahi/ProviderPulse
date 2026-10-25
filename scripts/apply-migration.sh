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
  043_*|044_*)
    echo "== write privileges left to anon and authenticated (expect column lists only)"
    psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -At -c "
      select table_name || ' ' || grantee || ' ' || privilege_type from information_schema.role_table_grants
        where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
          and table_name in ('provider_profiles', 'provider_locations', 'appointment_requests', 'provider_npis', 'provider_npi_insurance')
        order by 1;
      select 'column grants: ' || table_name || '.' || privilege_type || ' ' || string_agg(column_name, ',' order by column_name)
        from information_schema.column_privileges
        where table_schema = 'public' and grantee = 'authenticated' and privilege_type in ('INSERT', 'UPDATE')
          and table_name in ('provider_profiles', 'provider_locations', 'appointment_requests')
        group by table_name, privilege_type order by 1;
      select 'triggers: ' || string_agg(tgname, ', ' order by tgname) from pg_trigger
        where tgrelid in ('public.appointment_requests'::regclass) and not tgisinternal;"
    if [ "$(basename "$FILE")" = "044_provider_npis.sql" ]; then
      psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -At -c "
        select 'provider_npis rls ' || relrowsecurity from pg_class where oid = 'public.provider_npis'::regclass;
        select 'provider_npis policies: ' || string_agg(policyname, ', ') from pg_policies where tablename in ('provider_npis', 'provider_npi_insurance');
        select 'appointment_requests.npi column: ' || count(*) from information_schema.columns where table_name = 'appointment_requests' and column_name = 'npi';"
    fi
    ;;
  042_*)
    echo "== market_benchmarks kinds"
    psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -At -c "select pg_get_constraintdef(oid) from pg_constraint where conname = 'market_benchmarks_kind_check';"
    ;;
esac
echo "== Done"
