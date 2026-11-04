# Medicare procedures summary: dry run

Run 2026-11-04 15:53 UTC by scripts/build-procedure-summary.py. Nothing was written to the database.

- Rows read from `cms_procedures_full`: 9,781,673 (plain COPY, 1.62 GB of CSV, 41s)
- Summary rows (ZIP x specialty x code): **4,128,906** across 20,747 ZIPs (42% of the rows; built in 5s on the runner)
- Services kept exact: 2,756,663,769 read, 2,756,663,769 summed; patients summed 831,319,216 = 831,319,216
- Summary rows per ZIP: median 48, 99th percentile 1,795, largest 4,563
- Estimated size on disk with its primary key (zip, specialty, code): about **1.16 GB**
- Database now: 9887 MB; `cms_procedures_full`: 4041 MB

| ZIP | rows now | summary rows |
|---|---|---|
| 02114 | 25,809 | 3,180 |
| 10001 | 1,111 | 488 |
| 77030 | 40,333 | 4,563 |
| 38017 | 1,313 | 665 |
| 76104 | 18,966 | 3,436 |

Loading it would need about the estimate above in free disk, plus the same again for the
staging copy and its WAL. Check Supabase, Settings, Usage, Disk before any apply.
