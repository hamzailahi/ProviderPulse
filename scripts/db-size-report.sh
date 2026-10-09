#!/usr/bin/env bash
# Read-only report of where the database's disk goes: every table with its
# heap, TOAST and index sizes, live and dead rows and last vacuum; every index
# with its size and how often it has been used; and the write-ahead log.
# Writes supabase/reference/db-size-report.md. Changes nothing.
# Usage: SUPABASE_DB_URL=postgresql://... scripts/db-size-report.sh
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"
OUT=supabase/reference/db-size-report.md
W=$(mktemp -d)
q() { psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1 --csv -c "begin transaction read only; $1; commit;" | sed '/^BEGIN$/d;/^COMMIT$/d' ; }

q "select pg_size_pretty(pg_database_size(current_database())) as database_size, version() as server" > "$W/db.csv"

q "select n.nspname as schema, c.relname as table_name,
   pg_size_pretty(pg_total_relation_size(c.oid)) as total,
   pg_size_pretty(pg_relation_size(c.oid)) as heap,
   pg_size_pretty(coalesce(pg_total_relation_size(c.reltoastrelid),0)) as toast,
   pg_size_pretty(pg_indexes_size(c.oid)) as indexes,
   coalesce(s.n_live_tup,0) as live_rows, coalesce(s.n_dead_tup,0) as dead_rows,
   round(100.0 * coalesce(s.n_dead_tup,0) / nullif(coalesce(s.n_live_tup,0) + coalesce(s.n_dead_tup,0),0), 1) as dead_pct,
   to_char(greatest(s.last_vacuum, s.last_autovacuum), 'YYYY-MM-DD') as last_vacuum
 from pg_class c join pg_namespace n on n.oid = c.relnamespace
 left join pg_stat_all_tables s on s.relid = c.oid
 where c.relkind in ('r','p','m') and n.nspname not in ('pg_catalog','information_schema','pg_toast')
 order by pg_total_relation_size(c.oid) desc limit 40" > "$W/tables.csv"

q "select s.schemaname as schema, s.relname as table_name, s.indexrelname as index_name,
   pg_size_pretty(pg_relation_size(s.indexrelid)) as size, s.idx_scan as times_used,
   case when i.indisunique then 'yes' else '' end as unique_or_pk
 from pg_stat_all_indexes s join pg_index i on i.indexrelid = s.indexrelid
 where s.schemaname not in ('pg_catalog','information_schema','pg_toast')
 order by pg_relation_size(s.indexrelid) desc limit 40" > "$W/indexes.csv"

# The WAL directory listing needs a monitoring role; report it if allowed.
q "select pg_size_pretty(sum(size)) as wal_size, count(*) as wal_files from pg_ls_waldir()" > "$W/wal.csv" 2>/dev/null \
  || echo "wal_size,wal_files
not readable with this role," > "$W/wal.csv"
q "select stats_reset::date as index_stats_since from pg_stat_database where datname = current_database()" > "$W/since.csv" 2>/dev/null || true

python3 - "$W" "$OUT" <<'PY'
import csv, sys, os, datetime
w, out = sys.argv[1], sys.argv[2]
def md(name, title):
    p = os.path.join(w, name)
    if not os.path.exists(p) or not open(p).read().strip(): return f"## {title}\n\n(not available)\n"
    rows = list(csv.reader(open(p)))
    s = f"## {title}\n\n| " + " | ".join(rows[0]) + " |\n|" + "---|" * len(rows[0]) + "\n"
    for r in rows[1:]: s += "| " + " | ".join(r) + " |\n"
    return s
parts = [f"# Database size report\n\nRead-only snapshot, {datetime.datetime.utcnow():%Y-%m-%d %H:%M} UTC, by scripts/db-size-report.sh.\n",
         md("db.csv", "Database"), md("wal.csv", "Write-ahead log"), md("since.csv", "Index usage counted since"),
         md("tables.csv", "Largest tables (top 40)"), md("indexes.csv", "Largest indexes (top 40)")]
open(out, "w").write("\n".join(parts))
print(open(out).read())
PY
