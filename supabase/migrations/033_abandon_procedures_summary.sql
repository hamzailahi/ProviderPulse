-- Abandons the procedures summary (migrations 031 and 032, 2026-10-09).
--
-- 031 built cms_procedures_by_zip in 100 ZIP batches, but each batch read a
-- scattered 1% of the 4 GB cms_procedures_full from a small disk, so the build
-- ran for many minutes while holding an exclusive lock on the summary table
-- (which also made the dashboard's Procedures panel fail while it ran). The
-- user chose to stop and leave cms_procedures_full as it is. The dashboard
-- reads cms_procedures_full again, exactly as before 031.
--
-- This file:
--   1. ends any session still building the summary (it holds the table's
--      exclusive lock; ending the session rolls its work back), and
--   2. drops cms_procedures_by_zip, which nothing reads any more.
-- cms_procedures_full is NOT touched. Safe to re-run.
--
-- Paste the whole file into the SQL editor and run it.

select pid, pg_terminate_backend(pid) as ended
from pg_locks
where relation = to_regclass('public.cms_procedures_by_zip')
  and mode = 'AccessExclusiveLock'
  and pid <> pg_backend_pid();

drop table if exists public.cms_procedures_by_zip;
