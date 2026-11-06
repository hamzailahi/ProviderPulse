# National Address Database: apply

Run 2026-11-06 17:56 UTC by scripts/nad-dry-run.sh (MODE=apply). Only matches in states USDOT marks wholly public domain, or in counties of the partly public states that USDOT's county status layer shows wholly in the NAD with no non-public piece (nad-public-counties.csv), were written, only to rows that still had no pin and whose address and ZIP were the ones matched, and only when the NAD point lay within 25 miles of the ZIP's centre.

- Matches offered: 214
- Left out, more than 25 miles from the ZIP's centre: 44
- Left out, the row was pinned or its address changed since the export: 0
- Written to clinics: 48
- Written to provider_individuals: 122
- Rows written in all: **170** (added to nad-applied.csv with the point written and the date)

Source: U.S. Department of Transportation, National Address Database (NAD_r24.txt).
