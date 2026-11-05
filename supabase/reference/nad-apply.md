# National Address Database: apply

Run 2026-11-05 21:38 UTC by scripts/nad-dry-run.sh (MODE=apply). Only matches in states USDOT marks wholly public domain were written, only to rows that still had no pin and whose address and ZIP were the ones matched, and only when the NAD point lay within 25 miles of the ZIP's centre.

- Matches offered: 36513
- Left out, more than 25 miles from the ZIP's centre: 42
- Left out, the row was pinned or its address changed since the export: 0
- Written to clinics: 5867
- Written to provider_individuals: 30604
- Rows written in all: **36471** (listed in nad-applied.csv with the point written)

Source: U.S. Department of Transportation, National Address Database (NAD_r24.txt).
