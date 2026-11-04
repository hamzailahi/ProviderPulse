# Hospital campus review, 2026-11-03

From the 165-row shortlist (`hospital-campus-shortlist.csv`), the likely
acute-care campuses were checked on the web and their NPIs against the
directory (loaded from NPPES, November 2026 file) with the read-only
`lookup` step of `hospital-campus-candidates.yml`.

## Added to `hospital-campuses.csv`

| Campus | Bills under |
|---|---|
| Ascension Via Christi St. Joseph, Wichita | 1154314789, Ascension Via Christi Hospitals Wichita |
| Harris Health Lyndon B. Johnson Hospital, Houston | 1205900370, Harris County Hospital District |
| Kaiser Permanente Ontario Medical Center | 1356496772, Kaiser Foundation Hospital Fontana/Ontario (CCN 050140) |

## Already findable (no campus needed)

A hospital-coded listing exists at the campus address, in `clinics` or as a
secondary practice location, so patient search shows it:

- Kaiser Zion, San Diego (secondary location of 1013062769)
- Kaiser Orange County-Irvine (secondary location of 1144375056)
- St. Luke's Meridian (secondary location of 1770586794)
- Hershey Medical Center (1568435477), Winn Army Community Hospital,
  Oro Valley Hospital (1386697688), Sentara Obici (1376540138), CHRISTUS
  St. Vincent (1164801627), Sanford Medical Center Fargo (1245519081): their
  own hospital NPI at the same address, pinned 0.2 to 1.7 miles off.

## Needs a coordinate fix, not a campus

- Deaconess Midtown, Evansville: hospital NPI 1053361642 at 600 Mary St is
  pinned about 3.5 miles west (ZIP 47710 on the record; the hospital is 47747).

## Not added

- Evans Army Community Hospital (4102 Pinion Dr is not the hospital; it is on
  Cochrane Circle), Bronson LakeView (451 Health Pkwy is the outpatient
  center; the ER is at 408 Hazen St), Trinity Minot at 1 Burdick Expy W (the
  hospital NPIs are now at 2305 37th Ave SW), Memorial Hollywood 1150 N 35th
  Ave (office building), Seton Shoal Creek (psychiatric).
- The rest of the shortlist: medical office buildings and clinics carrying a
  hospital's name, and psychiatric, rehabilitation, long-term acute care,
  pediatric post-acute and nursing facilities, which the Emergency rooms &
  hospitals door does not include.

## Second pass, 2026-11-04

The 80 candidates with 150 or more clinicians at the address that were not on
the first shortlist (no hospital department code there). Most are medical
office buildings, clinics, administrative offices, psychiatric, rehabilitation
or children's specialty sites, or addresses a hospital has moved away from
(Marquette General, UPMC South Side, Saint Joseph Denver's Ogden St offices).
Four looked like acute-care campuses and were looked up (`lookup` step):

- **Carolinas Medical Center, Charlotte (1001 Blythe Blvd)**: already
  findable. Its hospital NPIs (1295789907, 1346648235, 1982930533) are at
  1000 Blythe Blvd, and 1295789907 lists 1001 Blythe Blvd suites as
  hospital-coded secondary locations, loaded after the candidate list was
  built.
- **Naval Medical Center San Diego**: already findable. Hospital NPI
  1366527764 (282N00000X) sits 0.27 miles from the candidate pin, on the same
  campus.
- **Montefiore New Rochelle (20 Cedar St)**: already findable. Hospital NPI
  1720414154 is at 16 Guion Pl, 0.44 miles from the candidate, which is an
  office building beside it.
- **Phoenix Indian Medical Center (4212 N 16th St)**: a real gap. Its NPIs are
  coded Public Health or Welfare Agency (1144382219) and Family Medicine
  (1184738049), so the Emergency rooms & hospitals door never shows it. It is
  an Indian Health Service hospital for eligible American Indian and Alaska
  Native patients, and the campus list has no way to carry that eligibility
  note (no hospital code in the overrides carries it), so it was held back;
  **added the same day** at the user's word, with the list's new
  `eligibility` and `note` columns (the ER treats anyone; other care is for
  eligible patients).
