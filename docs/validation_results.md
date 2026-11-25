# ProviderPulse validation results

Compiled 2026-11-25 for citation (CMS-4214-P comment, immigration petition).
**Every figure below is copied from a report committed in this repository, or
computed from those reports by `scripts/validation-summary.mjs`.** Each
section names the script that produced the figure, the query or input it
read, and the committed file the figure comes from. Where a result does not
exist yet, the section says so under **Not yet produced**, with what it would
take.

Rules used here:

- No figure is estimated, rounded further, or recomputed from a rounded one.
  Correlations are shown at the two decimals the scripts print.
- "Not computed" means not computed. Intervals, p-values, controls and a
  holdout exist only where 1.6 reports them; nothing else is described as
  significant.
- Reports are the versions in git at commit time; `git log -- <file>` gives
  each run's date and commit.

---

## 1. Outcome back-test (2020 scores vs what happened after)

**Script:** `scripts/backtest-entry.sh` (exports) and
`scripts/backtest-entry.mjs` (scoring and Spearman), workflow
`.github/workflows/backtest-entry.yml`, NPPES parser
`scripts/backtest-nppes.mjs`.
**Report:** `supabase/reference/backtest-entry.md` (current run 2026-11-24,
commit `453de9f`); the earlier runs are in git (`89996ce` 2026-11-20,
`812881a` / `a3419b3` 2026-11-19).

### 1.1 Data, years, units and N

| Item | Value | Source |
|---|---|---|
| NPPES records read | 9,891,116 | `backtest-entry.md`, line "NPPES rows read" |
| Clinicians enumerated by 2020 and active today (2020 supply) | 6,328,253 | same |
| Clinicians (NPI-1) enumerated 2021 to 2025 (entry outcome) | 2,619,185 | same |
| Counties with outcome data | 3,206 | same |
| Unit, outcome test (section 1 of report) | county; a county's score is the adult-weighted mean of its ZIPs, ZIPs assigned to the county holding most of their homes (HUD `zip_county_crosswalk`, largest `res_ratio`) | `backtest-entry.md` intro; `backtest-entry.sh` line 17 |
| N, outcome test | 2,903 counties for most specialties, 3,007 for dental, lung and GI | report section 1, "Counties" column |
| Unit, entry test (sections 2 and 3) | ZIP (ZCTA with 1,000+ adults), 10-mile catchment | report intro |
| N, entry test | 20,588 ZIPs (section 2); 20,281 to 21,427 (section 3) | report sections 2 and 3, "ZIPs" column |
| Preventable hospital stays | County Health Rankings measure v005, per 100,000 Medicare fee-for-service enrollees; CHR release year 2025; 3,069 counties loaded | `supabase/reference/chr-preventable-stays.md` |
| ER visits per 1,000 and readmission rate | `cms_county_utilization`, the newest year with a value per county | `backtest-entry.sh` line 19 (the query) |
| Entry outcome years | NPI-1 enumeration dates 2021 to 2025 | report intro |
| Score as of | end of 2020 for the entry test; today's supply for the outcome test | report intro |

**Outcome data years (added 2026-11-25).** From
`supabase/reference/outcome-years.md` (`scripts/outcome-years.sh`, workflow
`outcome-years.yml`, read only; same selection as the back-test: per county,
the newest year with a value):

| Outcome | Source table | Data year | Counties |
|---|---|---|---|
| ER visits per 1,000 | `cms_county_utilization` | 2024 | 3,143 |
| Readmission rate | `cms_county_utilization` | 2024 | 3,000 |
| Preventable hospital stays | `county_preventable_stays` (County Health Rankings v005) | release 2025 | 3,069 |

`cms_county_utilization` holds one year only (2024, 3,197 rows). County
Health Rankings' analytic CSV carries its release year, not the measurement
year behind v005, so the database cannot say which calendar year the
preventable-stays rates describe. Cite them as "County Health Rankings 2025
release" and take the measurement year from County Health Rankings' own
documentation for that release.

The exact query for the county outcomes (from `backtest-entry.sh`, line 19):

```sql
select u.fips, u.er_visits_per_1000, u.readmission_rate, p.rate
from (select fips,
        (array_agg(er_visits_per_1000 order by year desc) filter (where er_visits_per_1000 is not null))[1] as er_visits_per_1000,
        (array_agg(readmission_rate  order by year desc) filter (where readmission_rate  is not null))[1] as readmission_rate
      from public.cms_county_utilization where fips is not null group by fips) u
full join public.county_preventable_stays p on p.fips = u.fips
```

### 1.2 Score vs county outcomes, with HPSA side by side

Spearman rho across counties. "Score" is "patients need care here" (mean of
need and access). Access is the stored drive-time E2SFCA figure where one
exists (734,067 of 862,080 ZIP x specialty rows), else the 10-mile count.
Copied from `backtest-entry.md`, section 1 (run 2026-11-24).

| Specialty | Counties | Preventable stays: score | need alone | access alone | HPSA | ER: score | ER: HPSA | Readmissions: score | Readmissions: HPSA |
|---|---|---|---|---|---|---|---|---|---|
| Primary care / family doctor | 2,903 | 0.28 | 0.37 | 0.04 | 0.17 | 0.27 | 0.18 | 0.12 | 0.19 |
| Mental health & counseling | 2,903 | 0.31 | 0.26 | 0.19 | 0.06 | 0.24 | 0.10 | 0.10 | 0.09 |
| Dental | 3,007 | 0.43 | 0.45 | 0.27 | 0.13 | 0.35 | 0.14 | 0.22 | 0.17 |
| Eye care | 2,903 | 0.31 | 0.36 | 0.14 | 0.17 | 0.27 | 0.18 | 0.17 | 0.19 |
| Chiropractic | 2,903 | 0.34 | 0.31 | 0.26 | 0.17 | 0.34 | 0.18 | 0.22 | 0.19 |
| Physical & occupational therapy | 2,903 | 0.27 | 0.27 | 0.16 | 0.17 | 0.31 | 0.18 | 0.10 | 0.19 |
| Orthopedics & sports injury | 2,903 | 0.23 | 0.27 | 0.12 | 0.17 | 0.23 | 0.18 | 0.06 | 0.19 |
| Heart / cardiology | 2,903 | 0.16 | 0.28 | -0.04 | 0.17 | 0.21 | 0.18 | -0.04 | 0.19 |
| Allergy & immunology | 2,903 | 0.07 | 0.08 | 0.00 | 0.17 | 0.26 | 0.18 | -0.02 | 0.19 |
| Lung, breathing & sleep | 3,007 | 0.21 | 0.38 | -0.04 | 0.17 | 0.28 | 0.19 | 0.00 | 0.19 |
| Digestive / gastroenterology | 3,007 | 0.20 | 0.36 | -0.04 | 0.17 | 0.20 | 0.19 | -0.03 | 0.19 |
| Kidney / nephrology | 2,903 | 0.14 | 0.37 | -0.18 | 0.17 | 0.17 | 0.18 | -0.04 | 0.19 |
| Diabetes & hormones | 2,903 | 0.30 | 0.39 | 0.07 | 0.17 | 0.29 | 0.18 | 0.08 | 0.19 |
| Cancer care / oncology | 2,903 | -0.04 | -0.07 | -0.00 | 0.17 | 0.05 | 0.18 | -0.19 | 0.19 |
| Arthritis / rheumatology | 2,903 | 0.11 | 0.15 | 0.00 | 0.17 | 0.18 | 0.18 | -0.07 | 0.19 |
| Brain & nerves / neurology | 2,903 | 0.22 | 0.32 | 0.02 | 0.17 | 0.28 | 0.18 | 0.02 | 0.19 |
| Ear, nose & throat | 2,903 | 0.05 | 0.05 | 0.02 | 0.17 | 0.13 | 0.18 | -0.12 | 0.19 |
| Urology | 2,903 | 0.22 | 0.36 | -0.01 | 0.17 | 0.23 | 0.18 | 0.03 | 0.19 |
| Foot & ankle / podiatry | 2,903 | 0.26 | 0.36 | 0.06 | 0.17 | 0.24 | 0.18 | 0.04 | 0.19 |
| Pain management | 2,903 | 0.12 | 0.23 | -0.03 | 0.17 | 0.22 | 0.18 | -0.05 | 0.19 |
| Speech & language therapy | 2,903 | 0.19 | 0.32 | -0.01 | 0.17 | 0.24 | 0.18 | 0.01 | 0.19 |
| Nutrition & dietitian | 2,903 | 0.33 | 0.39 | 0.17 | 0.17 | 0.31 | 0.18 | 0.15 | 0.19 |
| Acupuncture, massage & naturopathy | 2,903 | 0.37 | 0.28 | 0.26 | 0.17 | 0.29 | 0.18 | 0.14 | 0.19 |
| Urgent care & emergency | 2,903 | -0.18 | -0.26 | 0.04 | 0.17 | -0.18 | 0.18 | -0.12 | 0.19 |
| Imaging & lab | 2,903 | -0.05 | -0.05 | -0.03 | 0.17 | 0.06 | 0.18 | -0.18 | 0.19 |
| Pharmacy | 2,903 | 0.29 | 0.37 | -0.02 | 0.17 | 0.29 | 0.18 | 0.14 | 0.19 |
| Home health & in-home care | 2,903 | 0.17 | 0.35 | -0.11 | 0.17 | 0.21 | 0.18 | 0.03 | 0.19 |
| Nursing & assisted living | 2,903 | 0.24 | 0.38 | 0.02 | 0.17 | 0.24 | 0.18 | 0.22 | 0.19 |
| Medical equipment & supplies | 2,903 | 0.17 | 0.34 | -0.13 | 0.17 | 0.25 | 0.18 | 0.04 | 0.19 |
| Hearing & audiology | 2,903 | 0.12 | 0.03 | 0.14 | 0.17 | 0.13 | 0.18 | -0.08 | 0.19 |
| Care coordination & community health | 2,903 | 0.23 | 0.37 | 0.06 | 0.17 | 0.12 | 0.18 | 0.08 | 0.19 |
| General surgery | 2,903 | 0.14 | 0.17 | 0.07 | 0.17 | 0.14 | 0.18 | -0.05 | 0.19 |
| Hospice & palliative care | 2,903 | 0.10 | 0.19 | -0.00 | 0.17 | 0.12 | 0.18 | 0.01 | 0.19 |

Seven scored specialties have no row: they have no outcome comparison in the
report (pediatrics, OB-GYN, dermatology, plastic surgery, ABA, infectious
disease, genetics).

**Head-to-head counts** (computed from the table above with
`awk -F'|' '/^## 1\./{f=1} /^## 2\./{f=0} f && $3~/[0-9]/ {n++; p+=($4>$7); e+=($8>$9); r+=($10>$11)} END{print n,p,e,r}' supabase/reference/backtest-entry.md`):

| Outcome | Specialties where the score's rho is higher than HPSA's | Out of |
|---|---|---|
| Preventable hospital stays | 19 | 33 |
| ER visits per 1,000 | 23 | 33 |
| Readmission rate | 4 | 33 |

**What this supports, and what it does not.** The score correlates more
strongly than HPSA with preventable stays in 19 of 33 specialties and with ER
use in 23 of 33. HPSA correlates more strongly with readmissions in 29 of 33.
The claim "the model beats HPSA" holds for preventable stays and ER use in a
majority of specialties, not in all, and not for readmissions. Need alone is higher than access alone against preventable stays in most
rows, so need carries most of the signal. Access alone reaches 0.15 or more
against preventable stays in 6 specialties (mental health, dental,
chiropractic, therapy, nutrition, acupuncture).

### 1.3 Why HPSA and "distance from competitors" were dropped

**Competition (distance from the nearest same-specialty listing).** Against
clinician entry 2021 to 2025, across 20,588 ZIPs, the "competition alone"
rho ran from -0.18 (primary care) to -0.74 (genetics) in every one of the 40
specialties (`backtest-entry.md`, section 2, "Competition alone" column;
identical in the 2026-11-20 run, commit `89996ce`). New clinicians set up
near existing ones, so a score rewarding distance from competitors pointed
the wrong way. It was removed from scoring on 2026-11-19 and is shown as a
fact.

**HPSA.** HPSA was **not** dropped because of a correlation threshold. It was
dropped on 2026-11-19 on method grounds: HPSA is itself a population-to-
provider ratio, the measure the drive-time access figure replaces, so scoring
with it double-counted supply (CLAUDE.md, "Market opportunity model",
shortage row). Do not cite a figure as the reason HPSA was dropped; none
exists. The figures that compare HPSA with the score are those in 1.2 and
1.4, and HPSA remains in the output as "for comparison, not scored".

The first run's finding that redirected the back-test (2026-11-19) is kept
as section 3 of the report: the need score against clinician entry ran -0.05
(nursing) to -0.72 (neurology) across 20,281 to 21,427 ZIPs, and access alone
to -0.88 (mental health). New clinicians went where supply was already dense.
Entry measures where the market sends clinicians, not need, which is why the
need score is tested against health outcomes instead.

### 1.4 Specialties flagged as failing, and the thresholds

**Rule** (`v2/assets/market-model.js`, `UNVALIDATED`, comment above it): a
specialty whose combined score correlates **under 0.10** with county
preventable stays gets a caveat and -0.15 confidence.

**Flagged (5):** allergy and immunology (0.07), cancer care (-0.04), ear, nose
and throat (0.05), urgent care (-0.18), imaging and lab (-0.05). Rheumatology
(0.11) and hospice (0.10) were on the list until the 2026-11-24 rerun moved
them to 0.10 or above.

**Per-factor weights** use a second rule (`market-model.js`, comment above
`NEED_SHARE`): rho 0.15 or more counts the factor fully, 0.05 to 0.15 at
half, under 0.05 not at all.

- Access weight (`ACCESS_SHARE`): access alone vs preventable stays.
- Need weight (`NEED_SHARE`): need alone vs preventable stays.
- Pay weight (`PAY_SHARE`): payer yield vs entry.

The resulting tables are in `market-model.js`. For example, access counts
fully for mental health, dental, chiropractic, therapy, nutrition and
acupuncture, and not at all for primary care and 19 others.

### 1.5 Ability to pay: payer yield vs insured rate

**Script and report:** the same back-test, the 2026-11-20 run (commit
`89996ce`, `supabase/reference/backtest-entry.md`, section 2). Measure:
Spearman rho of each pay factor against clinicians entering 2021 to 2025 per
1,000 catchment adults, 20,588 ZIPs per specialty. "Pay alone (live)" was
then the insured-rate factor (70% insured rate, 30% income); "Payer yield"
is the candidate (70% yield, 30% income).

In all 40 specialties the payer-yield rho is higher than the insured-rate
rho. For example:

| Specialty | Insured rate | Payer yield |
|---|---|---|
| Primary care | 0.06 | 0.12 |
| Cardiology | 0.03 | 0.09 |
| Gastroenterology | 0.01 | 0.07 |
| Kidney | -0.00 | 0.05 |
| Physical and occupational therapy | 0.21 | 0.30 |
| Neurology | 0.11 | 0.18 |

The full 40-row table is in that commit:
`git show 89996ce:supabase/reference/backtest-entry.md`.

**Caveats you must keep with this figure:**

- The correlations are small (0.04 to 0.30).
- In that same table, HPSA's correlation with entry (0.04 to 0.29) is higher
  than payer yield's in 31 of 40 specialties (counted with the awk line in
  "Reproducing this file"). Payer yield beats the insured rate;
  it does not beat HPSA as a predictor of where clinicians open.
- The current report shows identical columns because payer yield became the
  live factor on 2026-11-20.

A third variant, payer yield tilted to each specialty's patient ages, was
tested on 2026-11-24 (section 2b). It beat the single yield in no specialty
and was not adopted.

### 1.6 Controls, holdout and out-of-sample checks

Added 2026-11-25 as section 4 of `supabase/reference/backtest-entry.md`
(numbers also in `supabase/reference/backtest-entry-stats.json`), produced by
`scripts/backtest-entry.mjs` with `scripts/lib/stats.mjs`. Methods: 95%
intervals for Spearman's rho by Fisher z with the Bonett and Wright (2000)
standard error; two-sided p-values from the t approximation; a paired
bootstrap of "score rho minus HPSA rho" over the same counties (500 resamples,
seed 1; 200 over ZIPs for entry); partial Spearman controlling for county
adults (log), adult-weighted median household income and share 65+; and a
county holdout (counties split in two by a hash of the FIPS code). With
thousands of units nearly every rho is statistically significant, so the
intervals are the useful figure.

**Preventable hospital stays (2,874 to 2,978 counties).** The paired 95%
interval for "score minus HPSA" lies wholly above zero in 16 of 33
specialties, wholly below zero in 7, and spans zero in 10. Examples: dental
0.43 [0.40, 0.46] vs HPSA 0.13 [0.09, 0.16], difference [0.26, 0.35]; mental
health 0.31 [0.28, 0.35] vs 0.06 [0.02, 0.09], difference [0.20, 0.30];
primary care 0.28 [0.25, 0.32] vs 0.17 [0.13, 0.20], difference [0.07, 0.16].
HPSA is ahead for oncology (score -0.04 [-0.08, -0.01]), ENT, allergy,
rheumatology and others listed in the report. Score rhos range from -0.18 to
0.43.

**ER visits (2,903 to 3,007 counties).** Score ahead of HPSA in 18 of 33
(interval of the difference above zero), HPSA ahead in 5, overlap in 10.
**Readmissions:** HPSA's interval lies above the score's in 25 of 33, and
they overlap in 8; the score is ahead in none.

**With controls (2,871 to 2,975 counties).** After adjusting both sides for
county size, income and age, the score's partial rho with preventable stays
is higher than HPSA's in 31 of 33 specialties. It ranges from -0.14 (urgent
care) to 0.31 (dental; acupuncture also 0.31), and is 0.15 or more in 17. HPSA's partial rho is 0.01 in 31
specialties (-0.02 and -0.04 in dental and mental health): once size, income
and age are held fixed, the shortage designation tracks preventable stays
hardly at all, while the score keeps much of its signal.

**Holdout (half A 1,426 to 1,475 counties, half B 1,448 to 1,503).** The
weight rules from 1.4, read on half A and checked on half B, give the same
access weight class in 28 of 33 specialties, the same need weight class in
31 of 33, and the same caution flag in 31 of 33. Score rho on the two halves
differs by at most 0.05 (for example primary care 0.30 / 0.26, dental 0.45 /
0.41, urgent care -0.15 / -0.20).

**Clinician entry 2021 to 2025 (20,458 ZIPs, same ZIPs for all three
measures).** Payer yield beats the insured rate in all 40 specialties, with
the interval of the difference above zero in every one (100% of resamples).
Against HPSA it is ahead in 7 (chiropractic, therapy, orthopedics, speech,
nutrition, acupuncture, hearing), behind in 29, and overlapping in 4.
Distance from competitors runs from -0.74 [-0.75, -0.74] (genetics) to -0.18
[-0.19, -0.17] (primary care) over 21,552 ZIPs: negative with tight
intervals in every specialty.

**Still not done.** Controls are county size, income and age only (no
rurality index, race or disability). The holdout splits counties, not states,
so neighbouring counties can sit on both sides. Outcomes remain Medicare
fee-for-service and county-level, and 2020 supply still counts NPIs active
today at today's address. The only state holdout in the repository remains
the parked demand model (0 of 33 usable).

---

## 2. Drive-time vs radius comparison (national)

**Script:** `scripts/access-dry-run.sh` / `scripts/access-dry-run.mjs`
(E2SFCA in `scripts/lib/e2sfca.mjs`), workflow `access-dry-run.yml`, one run
per state.
**Reports:** `supabase/reference/access-e2sfca/<state>-dry-run.md`, 52 files
(50 states, DC, Puerto Rico), runs of 2026-11-23 and 2026-11-24.
**National tables below:** `node scripts/validation-summary.mjs`, which only
reads those 52 files.

### 2.1 Rank agreement (Spearman rho) between drive-time access and the 10-mile count

Each state report gives one rho per specialty across that state's focus ZIPs
(column "Rank agreement"). Focus ZIPs across all 52 reports: **33,295**.

| Specialty | States | ZIPs | Lowest state rho | Highest state rho | ZIP-weighted mean of state rhos |
|---|---|---|---|---|---|
| Primary care / family doctor | 52 | 33,295 | 0.32 (Hawaii) | 0.77 (Massachusetts) | 0.61 |
| Pediatrics (children) | 51 | 33,264 | 0.55 (New Mexico) | 0.86 (Massachusetts) | 0.76 |
| Women's health / OB-GYN | 52 | 33,295 | 0.06 (District of Columbia) | 0.84 (Nevada) | 0.68 |
| Mental health & counseling | 52 | 33,295 | 0.12 (District of Columbia) | 0.85 (Nevada) | 0.71 |
| Dental | 52 | 33,295 | 0.24 (District of Columbia) | 0.87 (Delaware) | 0.67 |
| Eye care | 52 | 33,295 | 0.27 (District of Columbia) | 0.76 (Massachusetts) | 0.66 |
| Chiropractic | 52 | 33,295 | -0.02 (District of Columbia) | 0.81 (Florida) | 0.65 |
| Physical & occupational therapy | 52 | 33,295 | 0.21 (District of Columbia) | 0.80 (Puerto Rico) | 0.67 |
| Orthopedics & sports injury | 52 | 33,295 | 0.11 (District of Columbia) | 0.91 (Alaska) | 0.65 |
| Heart / cardiology | 52 | 33,295 | -0.17 (Delaware) | 0.94 (Alaska) | 0.69 |
| Skin / dermatology | 52 | 33,295 | 0.10 (District of Columbia) | 0.92 (Alaska) | 0.73 |
| Allergy & immunology | 52 | 33,295 | 0.33 (District of Columbia) | 0.95 (Alaska) | 0.72 |
| Lung, breathing & sleep | 52 | 33,295 | 0.10 (Delaware) | 0.92 (Nevada) | 0.71 |
| Digestive / gastroenterology | 52 | 33,295 | 0.19 (Delaware) | 0.91 (Arizona) | 0.71 |
| Kidney / nephrology | 52 | 33,295 | -0.02 (Delaware) | 0.93 (Alaska) | 0.66 |
| Diabetes & hormones | 52 | 33,295 | -0.02 (Delaware) | 0.89 (Arizona) | 0.71 |
| Cancer care / oncology | 52 | 33,295 | 0.08 (Delaware) | 0.90 (Alaska) | 0.53 |
| Arthritis / rheumatology | 52 | 33,295 | 0.03 (Delaware) | 0.91 (Alaska) | 0.71 |
| Brain & nerves / neurology | 52 | 33,295 | 0.04 (Delaware) | 0.93 (Alaska) | 0.73 |
| Ear, nose & throat | 52 | 33,295 | 0.13 (District of Columbia) | 0.93 (Alaska) | 0.67 |
| Urology | 52 | 33,295 | -0.09 (District of Columbia) | 0.95 (Alaska) | 0.65 |
| Foot & ankle / podiatry | 52 | 33,295 | 0.18 (District of Columbia) | 0.93 (Alaska) | 0.68 |
| Pain management | 52 | 33,295 | -0.14 (Delaware) | 0.89 (Arizona) | 0.70 |
| Plastic & reconstructive surgery | 52 | 33,295 | 0.03 (District of Columbia) | 0.88 (Alaska) | 0.62 |
| Speech & language therapy | 52 | 33,295 | 0.28 (District of Columbia) | 0.85 (Alaska) | 0.71 |
| Nutrition & dietitian | 52 | 33,295 | 0.38 (District of Columbia) | 0.85 (Delaware) | 0.73 |
| Acupuncture, massage & naturopathy | 52 | 33,295 | 0.23 (Hawaii) | 0.85 (Illinois) | 0.76 |
| Urgent care & emergency | 52 | 33,295 | 0.24 (District of Columbia) | 0.85 (Delaware) | 0.61 |
| Imaging & lab | 52 | 33,295 | 0.14 (Delaware) | 0.85 (Nevada) | 0.68 |
| Pharmacy | 52 | 33,295 | 0.21 (District of Columbia) | 0.74 (Pennsylvania) | 0.59 |
| Home health & in-home care | 51 | 33,264 | 0.23 (West Virginia) | 0.89 (Nevada) | 0.69 |
| Nursing & assisted living | 52 | 33,295 | 0.06 (New Jersey) | 0.83 (Nevada) | 0.54 |
| Medical equipment & supplies | 52 | 33,295 | 0.25 (Delaware) | 0.87 (Nevada) | 0.67 |
| Hearing & audiology | 52 | 33,295 | -0.11 (Rhode Island) | 0.93 (Alaska) | 0.65 |
| Behavior therapy (ABA) | 52 | 33,295 | 0.56 (Wyoming) | 0.90 (Maryland) | 0.81 |
| Care coordination & community health | 51 | 33,264 | 0.35 (Hawaii) | 0.83 (Massachusetts) | 0.70 |
| General surgery | 52 | 33,295 | -0.07 (Delaware) | 0.92 (Alaska) | 0.63 |
| Infectious disease | 51 | 33,264 | 0.19 (Delaware) | 0.91 (Nevada) | 0.61 |
| Genetics & genetic counseling | 52 | 33,295 | 0.11 (District of Columbia) | 0.87 (Nevada) | 0.60 |
| Hospice & palliative care | 52 | 33,295 | 0.17 (Delaware) | 0.93 (Alaska) | 0.67 |

Across all 2,076 state-by-specialty figures: lowest -0.17, median 0.68,
highest 0.95. The lowest values come from the smallest areas, DC (31 focus
ZIPs) and Delaware (66); small N makes those state figures unstable.

**National rho (added 2026-11-25).** `supabase/reference/access-national.md`
(`scripts/access-national.mjs`, workflow `access-national.yml`, read only)
correlates the stored drive-time access (`access_e2sfca`, every ZIP) with the
10-mile count recomputed over the same 33,295 ZIPs, both through the model's
access factor and against the site-weighted national rate. One Spearman rho
per specialty over all ZIPs, with a 95% interval:

- Range 0.60 to 0.81 across the 40 scored specialties, every p < 0.001.
- Lowest: oncology 0.60 [0.59, 0.60], urgent care 0.60 [0.59, 0.61],
  pharmacy 0.60 [0.59, 0.61], primary care 0.62 [0.61, 0.63].
- Highest: pediatrics 0.81 [0.81, 0.82], acupuncture 0.81 [0.81, 0.82].

The state-level figures above stay as they are. The national rho is the
single statistic to cite. The reports for Connecticut, New Mexico, Alaska and
South Dakota were rerun on 2026-11-25 (see section 4), so the state table
reflects those reruns.

### 2.2 Multi-site weighting (0.6 at the main office)

**Script:** `scripts/dac-load.mjs` (rules in `scripts/lib/dac.mjs`), workflow
`dac-load.yml`.
**Report:** `supabase/reference/clinician-status-dry-run.md` (2026-11-19, CMS
Doctors and Clinicians release 2026-10-30: 3,621,155 rows, 1,640,076
clinicians, 7,554,360 directory clinicians read).

National change in listing count per specialty when a clinician with several
sites counts 0.6 at the main address. A selection:

| Specialty | Listings | After | Change |
|---|---|---|---|
| Heart / cardiology | 56,416 | 44,314 | -21.5% |
| Digestive / gastroenterology | 27,029 | 21,792 | -19.4% |
| Pain management | 11,851 | 9,546 | -19.4% |
| Kidney / nephrology | 15,219 | 12,280 | -19.3% |
| Urology | 16,493 | 13,308 | -19.3% |
| Cancer care / oncology | 37,895 | 30,664 | -19.1% |
| Imaging & lab | 97,309 | 79,148 | -18.7% |
| Primary care / family doctor | 1,058,915 | 897,366 | -15.3% |
| Orthopedics & sports injury | 91,510 | 81,667 | -10.8% |
| Pediatrics (children) | 261,602 | 245,945 | -6.0% |
| Mental health & counseling | 1,608,448 | 1,529,137 | -4.9% |
| Home health & in-home care | 254,107 | 252,509 | -0.6% |

All 40 specialties are in the report. The range is -0.6% (home health) to
-21.5% (cardiology). Specialties that share a code overlap, so the rows do not
sum.

**Markets crossing the national rate (added 2026-11-25).** Section 2 of
`supabase/reference/access-national.md`, 33,295 ZIPs per specialty, 10-mile
count. "Before" counts every listing as 1 against the plain national rate;
"after" counts a multi-site clinician as 0.6 against the site-weighted
national rate, the pair the live score uses since 2026-11-24. Selected rows:

| Specialty | Above before | Above after | Fell below | Rose above |
|---|---|---|---|---|
| Primary care / family doctor | 10,158 | 10,172 | 419 | 433 |
| Heart / cardiology | 8,379 | 8,396 | 298 | 315 |
| Kidney / nephrology | 9,965 | 10,302 | 310 | 647 |
| Urgent care & emergency | 11,252 | 11,539 | 308 | 595 |
| Ear, nose & throat | 9,058 | 9,336 | 301 | 579 |
| Foot & ankle / podiatry | 9,863 | 9,698 | 511 | 346 |
| Mental health & counseling | 9,397 | 9,408 | 69 | 80 |
| Nursing & assisted living | 14,737 | 14,747 | 13 | 23 |

All 40 are in the report. Because the national rate falls with the local
counts, the total above the line barely moves. The change is in which ZIPs
sit there: in every specialty some ZIPs fall below and others rise above
(from 10 and 26 for medical equipment to 511 and 346 for podiatry). For
comparison, weighting the local counts while keeping the plain national rate
(the mismatch the live score avoids) would put primary care at 6,698 ZIPs
above instead of 10,158.

The earlier 12-cell comparison (`supabase/reference/weight-compare.md`,
2026-11-19) stays as a worked example: 76104 primary care went from 5.06 to
4.37 per 1,000 against a US rate of 4.78.

### 2.3 Do the earlier figures still hold?

**"rho 0.45 to 0.79 on 615 ZIPs":** confirmed as the first Tennessee run.
`git show 1543f37:supabase/reference/access-e2sfca/tennessee-dry-run.md`
(2026-11-17) has 615 Tennessee ZIPs and specialty rhos from 0.45 (nursing and
assisted living) to 0.79 (allergy, rheumatology, neurology).

The current Tennessee report (2026-11-23, weighted clinicians, population-
weighted start points, the no-car split) has **621 ZIPs and rhos from 0.50 to
0.79**. Cite the version you mean, with its date. Nationally (2.1) the state
figures range from -0.17 to 0.95, with a median of 0.68. The Tennessee range
is not representative of every state.

**"10 to 22% supply reduction":** this matches the physician specialties in
2.2 (orthopedics -10.8% to cardiology -21.5%), not all specialties. Across
all 40 the range is -0.6% to -21.5%. State it as "10.8% to 21.5% for
physician specialties", or give the full range.

### 2.4 People without a car: public transit pilot (five metros)

**Script:** `scripts/access-transit.py` (r5py on the metro's GTFS feeds plus
OpenStreetMap paths) with `scripts/access-dry-run.mjs`, workflow
`access-dry-run.yml` with `transit: true`. **Reports:**
`supabase/reference/access-e2sfca/<metro>-transit-pilot-dry-run.md`, run
2026-11-25. Read only; nothing stored.

**Method.** The stored drive-time figure already splits each ZIP's adults into
households with a car (drive times) and without one (walking times). The pilot
lets the no-car group take the faster of walking and public transit: median
door-to-door minutes over 10:00 to 11:00 on Wednesday 2026-12-02 (a departure
time chosen as an assumption), at most 120 minutes; a pair transit cannot
reach stays on foot. Car households are unchanged. Feeds come from the
Mobility Database catalog, every GTFS feed whose box overlaps the metro;
national and multi-state feeds are left out, and a feed the router cannot
read is dropped. Focus ZIPs are the core ZIP3 prefixes only (Boston 021 to
022, Chicago 606 to 608, Washington 200 to 205, Philadelphia 190 to 191, New
York 100 to 104 and 110 to 114).

| Metro | Focus ZIPs | Adults with no vehicle (share) | GTFS feeds | ZIP pairs reachable by transit | Lowest rank agreement, walking vs transit | Specialties under 0.90 | ZIP x specialty cells moved 15+ points |
|---|---|---|---|---|---|---|---|
| Boston | 55 | 311,929 of 1,214,964 (25.7%) | 16 | 8,908 | 0.34 (rheumatology) | 6 of 37 | 6 (at most 1 per specialty) |
| Chicago | 64 | 574,008 of 2,392,678 (24.0%) | 7 | 12,662 | 0.92 (genetics) | 0 of 40 | 0 |
| Washington DC | 47 | 219,261 of 986,248 (22.2%) | 16 | 13,715 | 0.92 (infectious disease) | 0 of 40 | 17 (infectious disease 7, genetics 5) |
| Philadelphia | 115 | 421,194 of 2,190,668 (19.2%) | 12 | 15,726 | 0.70 (genetics) | 3 of 40 | 6 (at most 3 per specialty) |
| New York City | 193 | 3,765,675 of 7,155,234 (52.6%) | 40 | 95,454 | 0.90 (dermatology) | 0 of 40 | 432 |

Boston shows "n/a" for 3 specialties (oncology, infectious disease,
genetics), too few ZIPs with listings to rank. Washington DC: 44 of 47 focus
ZIPs reach another ZIP by transit; every focus ZIP does in the other metros.

**Reading it.** Adding transit to walking changes the ranking of ZIPs
little for everyday care: walking and transit agree at 0.90 or more in every
specialty in Chicago, Washington DC and New York City. The changes concentrate
in rare specialties, where transit reaches clinicians walking cannot. New York
City, where 52.6% of adults live in households with no vehicle, moved the
most: 432 ZIP x specialty cells by 15 points or more, led by infectious
disease (51 of 193 ZIPs), oncology (36), dermatology (35), plastic surgery (33)
and gastroenterology (30). Per-specialty tables, and the ZIPs that improved
most, are in each report.

**Limits.** One departure window on one day, chosen as an assumption.
Published timetables, not real-time service. Five metros only; no rural
transit was tested. ZIP centres stand in for homes and practices.

---

## 3. Directory mismatch counts

**Script:** `scripts/address-check.mjs` (classification), `scripts/address-apply.sh`
(apply), `scripts/address-geocode.mjs`, workflow `address-check.yml`, migration
`supabase/migrations/056_clinician_medicare_address.sql`.
**Report:** `supabase/reference/address-check.md` (2026-11-20).

### 3.1 Sources and matching logic

- **Ours:** every `provider_individuals` row (NPPES NPI-1), using its stored
  NPPES state and ZIP.
- **Theirs:** CMS Doctors and Clinicians (Provider Data Catalog `mj5m-pzi6`),
  **release 2026-10-30**. This lists Medicare-enrolled clinicians and every
  practice address they have in Medicare.
- **Secondary sites:** NPPES secondary practice locations
  (`clinic_secondary_locations`, entity type 1).
- **Classification,** per NPI (`address-check.mjs` lines 84 to 89):
  - `confirmed_zip`: any Medicare address has our ZIP.
  - `same_state_other_zip`: else any Medicare address is in our state.
  - `other_state_but_nppes_lists_it`: else NPPES lists a secondary site in
    one of the Medicare states.
  - `other_state_only`: none of the above.
  - `not_in_medicare_file`: no Medicare record. This is unknown, never
    inactive.

| Class | Clinicians | Share of all | Share of those in Medicare |
|---|---|---|---|
| confirmed ZIP | 973,245 | 12.9% | 59.3% |
| same state, other ZIP | 527,868 | 7.0% | 32.2% |
| other state only | 119,952 | 1.6% | 7.3% |
| other state, NPPES lists it | 18,918 | 0.3% | 1.2% |
| not in Medicare file | 5,914,380 | 78.3% | |

**138,150 "moved":** the two "other state" classes total 138,870. A move is
written only when one Medicare address can be chosen
(`address-check.mjs` line 99, `best(list)`). That held for 138,150, which is
the count the apply wrote (`address-check.md`, "Applied" block:
`moved|138150|115647`, with 115,647 of them pinned on the map). The other 720
had no usable address and were not moved.

**1,002,333 "additional offices":** one row per Medicare address outside the
listing's ZIP, for clinicians in the `same_state_other_zip` class (line
100). The dry run counted 1,002,366 and the apply wrote 1,002,333 (the
"Applied" block). The 33-row difference is not explained in the report;
cite 1,002,333 as stored.

**As a share of all clinicians:** 138,150 is 1.8% of the 7,554,363 rows
classified (the five classes summed), or 8.4% of the 1,639,983 in Medicare.
The report prints the class shares; these two divisions are the only
arithmetic added here.

### 3.2 By state and by specialty

**Top 10 listed states, "other state only" class** (`address-check.md`, "By
listed state"; this class only, not the 18,918 NPPES-listed class):

| State | In Medicare | Other state only | Share |
|---|---|---|---|
| NY | 114,449 | 9,563 | 8.4% |
| PA | 75,490 | 6,976 | 9.2% |
| FL | 107,015 | 6,712 | 6.3% |
| CA | 146,315 | 6,581 | 4.5% |
| TX | 109,281 | 6,397 | 5.9% |
| IL | 65,048 | 5,208 | 8.0% |
| OH | 63,895 | 4,333 | 6.8% |
| MA | 50,957 | 3,862 | 7.6% |
| MI | 57,110 | 3,855 | 6.8% |
| VA | 40,669 | 3,734 | 9.2% |

**By specialty:** the report gives the share of each specialty's Medicare
clinicians in the "other state only" class, not counts. The highest shares:

| Specialty | Share |
|---|---|
| Urgent care and emergency | 18.8% |
| Speech and language therapy | 16.3% |
| Nutrition | 13.9% |
| Imaging and lab | 11.6% |
| Hospital-based clinicians | 10.1% |
| Dental | 10.1% |
| Pediatrics | 10.0% |
| General surgery | 9.1% |
| Physical and occupational therapy | 8.5% |
| Neurology | 7.3% |

Full table in the report.

**By state and specialty (added 2026-11-25).** Section "Moves" of
`supabase/reference/address-check.md` (dry-run rerun of `address-check.yml`):
138,150 moves (720 more in those classes had no usable Medicare address);
1.8% of all clinicians and 8.4% of those in Medicare.

- Top listed states: NY 10,702 (7.7% of moves), PA 7,953, FL 7,808, CA
  7,560, TX 7,297, IL 5,909, OH 4,982, MA 4,408, MI 4,403, VA 4,314.
- By specialty, as a share of that specialty's clinicians: urgent care &
  emergency 9,499 of 81,956 (11.6%), hospital-based clinicians 18,951 of
  223,642 (8.5%), imaging & lab 7,303 of 88,913 (8.2%), general surgery,
  neurology and oncology 5.7% each, cardiology 5.3%, primary care 26,648 of
  744,434 (3.6%), mental health 16,175 of 1,444,604 (1.1%).

### 3.3 Recent billing at the old vs the new address

**Produced 2026-11-25, and not yet a fair test.**
`supabase/reference/moved-billing.md` (`scripts/moved-billing.mjs`, workflow
`moved-billing.yml`, read only) joins the 138,150 moved clinicians to CMS's
Medicare Physician and Other Practitioners by Provider file, data year 2024
(1,296,739 rows).

- Found in the billing file: 85,334 (61.8%). The other 52,816 did not bill
  traditional Medicare under their own NPI that year, or billed only through
  a group. They are not read as inactive.
- Of those found, by ZIP: 80,105 (93.9%) billed at the old NPPES address,
  1,652 (1.9%) at the new Medicare address, and 3,577 (4.2%) at neither. By
  state: 80,698 (94.6%) old, 3,394 (4.0%) new, 1,242 (1.5%) neither.

**Do not cite this as evidence that the moves are wrong, or right.** The
billing year (2024) comes before the enrollment data that triggered the moves
(CMS Doctors and Clinicians, release 2026-10-30). A clinician who moved in
2025 or 2026 billed 2024 from the old address. A fair test needs the
2025 billing file (CMS has not published it as of this writing) or a check
of where each clinician enrolled each year. What the figure does show is that
the old addresses were real practice addresses in 2024.

---

## 4. Medicare Advantage time standards check

**Script:** `scripts/access-dry-run.mjs` (travel-burden section), with
`--td supabase/reference/network-adequacy/time-distance.csv` (2026 HSD
Reference File, updated 2025-12-17), `--specmap
supabase/reference/network-adequacy/specialty-map.csv`, and practice
locations from `listing_counts_zip`.
**Reports:** the 52 state reports, section "Travel burden against CMS Medicare
Advantage limits". National totals: `node scripts/validation-summary.mjs`.

**What is measured:** drive minutes from each ZIP's population-weighted
centre to the nearest practice location of the specialty, against CMS's
maximum minutes for that county type. CMS applies the limit to a plan's
network. Here it is read against every listing, so "over" means no listing of
that kind at all within the limit. It is not a test of any plan.

Totals over 33,111 ZIPs with a county match (every county matched since
the Connecticut, New Mexico, Alaska and South Dakota reruns of 2026-11-25).
Adults in focus ZIPs: 261,050,446 (the sum of each report's adult count).

| Specialty | CMS code | States | ZIPs over | Share of ZIPs | Adults in those ZIPs | Share of adults |
|---|---|---|---|---|---|---|
| Primary care / family doctor | S03 | 52 | 1,609 of 33,111 | 4.9% | 3,186,447 | 1.2% |
| Women's health / OB-GYN | 016 | 52 | 354 of 33,111 | 1.1% | 205,759 | 0.1% |
| Mental health & counseling: Psychiatry | 029 | 52 | 1,029 of 33,111 | 3.1% | 1,070,614 | 0.4% |
| Mental health & counseling: Clinical Psychology | 036 | 52 | 406 of 33,111 | 1.2% | 281,958 | 0.1% |
| Mental health & counseling: Clinical Social Work | 037 | 52 | 503 of 33,111 | 1.5% | 363,070 | 0.1% |
| Eye care | 023 | 52 | 830 of 33,111 | 2.5% | 802,927 | 0.3% |
| Chiropractic | 010 | 52 | 301 of 33,111 | 0.9% | 141,098 | 0.1% |
| Physical & occupational therapy | F049 | 52 | 255 of 33,111 | 0.8% | 127,029 | 0.0% |
| Orthopedics & sports injury | 025 | 52 | 1,192 of 33,111 | 3.6% | 1,220,445 | 0.5% |
| Heart / cardiology | 008 | 52 | 3,160 of 33,111 | 9.5% | 4,871,455 | 1.9% |
| Skin / dermatology | 011 | 52 | 2,505 of 33,111 | 7.6% | 3,675,382 | 1.4% |
| Allergy & immunology | 007 | 52 | 2,807 of 33,111 | 8.5% | 4,759,060 | 1.8% |
| Lung, breathing & sleep | 030 | 52 | 1,558 of 33,111 | 4.7% | 1,861,307 | 0.7% |
| Digestive / gastroenterology | 014 | 52 | 2,865 of 33,111 | 8.7% | 4,286,781 | 1.6% |
| Kidney / nephrology | 018 | 52 | 712 of 33,111 | 2.2% | 630,975 | 0.2% |
| Diabetes & hormones | 012 | 52 | 663 of 33,111 | 2.0% | 1,002,588 | 0.4% |
| Cancer care / oncology | 021 | 52 | 1,754 of 33,111 | 5.3% | 2,398,861 | 0.9% |
| Arthritis / rheumatology | 031 | 52 | 1,843 of 33,111 | 5.6% | 2,758,133 | 1.1% |
| Brain & nerves / neurology | 019 | 52 | 1,895 of 33,111 | 5.7% | 2,263,721 | 0.9% |
| Ear, nose & throat | 013 | 52 | 1,558 of 33,111 | 4.7% | 1,889,866 | 0.7% |
| Urology | 033 | 52 | 2,074 of 33,111 | 6.3% | 3,364,024 | 1.3% |
| Foot & ankle / podiatry | 028 | 52 | 1,155 of 33,111 | 3.5% | 1,292,132 | 0.5% |
| Plastic & reconstructive surgery | 027 | 52 | 1,318 of 33,111 | 4.0% | 1,917,648 | 0.7% |
| Speech & language therapy | F051 | 52 | 418 of 33,111 | 1.3% | 291,368 | 0.1% |
| Imaging & lab | F047 | 52 | 654 of 33,111 | 2.0% | 653,218 | 0.3% |
| Nursing & assisted living | F046 | 52 | 415 of 33,111 | 1.3% | 384,043 | 0.1% |
| General surgery | 015 | 52 | 1,512 of 33,111 | 4.6% | 1,895,557 | 0.7% |
| Infectious disease | 017 | 52 | 1,431 of 33,111 | 4.3% | 1,871,586 | 0.7% |

**County gap closed (2026-11-25).** The four states were rerun after the
county-name fix of 2026-11-24, and every county now matches the HSD file (0
unmatched, previously 12). The rerun's region boxes and neighbouring-state
lists were set by hand, so those four states' region counts can differ
slightly from their earlier runs.

Another limit: the reports give adults, not total population, and break
results down by CMS county type per state, not nationally.

---

## 5. Plain-English summary of the three strongest findings

First, the health-need score tracks avoidable hospitalizations better than
the federal shortage designation in most specialties. Across 2,903 to 3,007
counties, the score's Spearman correlation with preventable hospital stays
was higher than HPSA's in 19 of 33 specialties (for example dental 0.43 vs
0.13, mental health 0.31 vs 0.06). It was also higher for ER use in 23 of 33,
though HPSA did better on readmissions. Second, the back-test showed that
new clinicians do not go where need is greatest. Across 20,281 to 21,427
ZIPs, the 2020 access score ran as low as -0.88 against where clinicians
opened in 2021 to 2025, and distance from competitors was negative in all 40
specialties (-0.18 to -0.74 over 20,588 ZIPs). That market signal points away
from underserved areas. Third, the national drive-time rebuild across 33,295
ZIPs found that a 10-mile radius and actual drive-time access often disagree
(state-level rank agreement from -0.17 to 0.95, median 0.68). Measured
against CMS's own Medicare Advantage time limits, 4,871,455 adults (1.9%) live
in ZIPs with no cardiologist and 3,186,447 (1.2%) in ZIPs with no primary care
listing within the limit. Over all 33,295 ZIPs at once, the two measures'
rank agreement runs 0.60 to 0.81 by specialty. The health-need comparison
holds up under controls: after adjusting for county size, income and age, the
score beats HPSA in 31 of 33 specialties, and its weight rules repeat on
held-out counties (see 1.6).

---

## Reproducing this file

```bash
git show 89996ce:supabase/reference/backtest-entry.md     # payer yield vs insured rate (1.5)
cat supabase/reference/backtest-entry.md                  # sections 1.1 to 1.4
git show 1543f37:supabase/reference/access-e2sfca/tennessee-dry-run.md  # first Tennessee run (2.3)
node scripts/validation-summary.mjs                       # national tables (2.1, 4)
cat supabase/reference/access-national.md                 # national rho, weighting crossings (2.1, 2.2)
cat supabase/reference/moved-billing.md                   # 3.3
cat supabase/reference/access-e2sfca/*-transit-pilot-dry-run.md  # 2.4
cat supabase/reference/backtest-entry-stats.json          # 1.6 (section 4 of backtest-entry.md)
cat supabase/reference/clinician-status-dry-run.md supabase/reference/weight-compare.md  # 2.2
cat supabase/reference/address-check.md                   # section 3
git show 89996ce:supabase/reference/backtest-entry.md | awk -F'|' '/^## 2\./{f=1} /^## 3\./{f=0} f && $3~/[0-9]/ {n++; w+=($6>$5); h+=($10>$6)} END{print n, w, h}'  # 40 40 31 (1.5)
```
