#!/usr/bin/env bash
# Dumps the structure of the Supabase `public` schema (tables, columns,
# constraints, indexes, functions, triggers, row level security, policies and
# grants) to supabase/schema/public.sql. Structure only: no table data.
#
# Usage: SUPABASE_DB_URL=postgresql://... scripts/dump-schema.sh
# The URL must be the Session pooler string (port 5432) from the Supabase
# dashboard's Connect button. GitHub runners have no IPv6, and the direct
# db.<ref>.supabase.co host is IPv6 only.
#
# The output is normalized so it only changes when the schema does:
# pg_dump's per-run \restrict token and its own version line are removed.
# Before anything is written, the dump is scanned for credentials, because
# this repository is public.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL (Supabase Session pooler connection string)}"
out="${1:-supabase/schema/public.sql}"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

pg_dump --dbname="$SUPABASE_DB_URL" --schema-only --schema=public --no-owner \
  | grep -vE '^\\(restrict|unrestrict) ' \
  | grep -v '^-- Dumped by pg_dump version' > "$tmp"

lines=$(wc -l < "$tmp")
if [ "$lines" -lt 200 ] || ! grep -q 'CREATE TABLE public.clinics' "$tmp"; then
  echo "Refusing to write: the dump has $lines lines and no clinics table, so it is not the real schema." >&2
  exit 1
fi

# Credentials must never reach git. A function body or column default could
# hold one; so could an error that echoed the connection string.
password="$(python3 -c 'import sys,urllib.parse as u; print(u.unquote(u.urlsplit(sys.argv[1]).password or ""))' "$SUPABASE_DB_URL")"
if { [ "${#password}" -ge 8 ] && grep -qF -- "$password" "$tmp"; } \
   || grep -qE 'sb_secret_|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY' "$tmp"; then
  echo "Refusing to write: the dump appears to contain a credential. Find it in the database and remove it first." >&2
  exit 1
fi

mkdir -p "$(dirname "$out")"
mv "$tmp" "$out"
trap - EXIT
echo "Wrote $out ($lines lines)"
