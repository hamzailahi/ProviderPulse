# Pins outside their own ZIP, 2026-11-24 (dry run: nothing written)

A pin counts as away when it lies more than 0.5 miles outside the listing's own 2020 Census ZIP area (ZCTA). A flagged listing is geocoded again. If the Census finds the same address in another ZIP and the current pin sits within a quarter mile of it, the ZIP on the listing is the mistake and the pin is kept. Otherwise a new point in the listing's own ZIP replaces it, or, failing that, the listing loses its pin and stays listed without one. A ZIP with no Census area cannot be judged and is left alone.

- Pinned listings checked: 10,627,276
- Inside or within 0.5 mi of their ZIP: 10,473,593
- ZIP has no Census area (not judged): 96,747
- **Away from their ZIP: 56,936**
- This run, 2,000 sampled: keep (wrong ZIP, right pin) 612, move 7, unpin 1,381

| How far outside | Listings |
|---|---|
| 0.5-2 mi | 23,510 |
| 2-10 mi | 27,319 |
| 10-50 mi | 3,931 |
| 50+ mi | 2,176 |

| Table | Away |
|---|---|
| clinics | 8,381 |
| provider_individuals | 41,856 |
| clinic_secondary_locations | 6,699 |

States with the most: MN 10,386, CA 6,004, TX 3,789, FL 3,340, NY 3,058, PR 2,274, CO 1,830, OH 1,665, GA 1,636, AZ 1,630, PA 1,578, NJ 1,554

Decisions in this run by state (top 12 by unpins): MN move 0 / unpin 366, CA move 0 / unpin 114, PR move 0 / unpin 94, TX move 0 / unpin 82, NY move 1 / unpin 80, FL move 0 / unpin 66, OH move 0 / unpin 47, CO move 0 / unpin 45, AZ move 4 / unpin 39, MI move 0 / unpin 34, PA move 1 / unpin 34, MA move 0 / unpin 27

## Listed in 38017: 2 away

| Table | Address | City | Miles outside |
|---|---|---|---|
| provider_individuals | 6025 WALNUT GROVE | MEMPHIS | 7.49 |
| provider_individuals | 577 N. GERMANTOWN RD. | CORDOVA | 4.39 |

## Why the unpins

| Reason | Listings |
|---|---|
| no Census match | 1,071 |
| Census matched a different street | 307 |
| address found in another ZIP, pin 0.25-1 mi from it | 3 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| clinics | 302 | 23 | 279 | 0 |
| provider_individuals | 1,471 | 140 | 1,331 | 0 |
| clinic_secondary_locations | 227 | 27 | 200 | 0 |

Census exact 180, Census same address written another way 10 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 869, a fuzzy (non-exact) match 922, matched in another ZIP 0, several equal matches 19.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 11 PARK CREEK DR, GREENVILLE, SC 29605 | 11 CREEK DR, GREENVILLE, SC, 29607 |
| non_exact | 5121 OOLTEWAH RINGGOLD ROAD, COLLEGEDALE, TN 37315 | 5121 OOLTEWAH RINGGOLD RD, COLLEGE DALE, TN, 37363 |
| non_exact | 11 CALLE CARAZO, GUAYNABO, PR 00969 | 11 CALLE E, GUAYNABO, PR, 00969 |
| non_exact | 820 E GILBERT ST, SAN BERNARDINO, CA 92415 | 820 E GILBERT ST, SAN BERNARDINO, CA, 92404 |
| non_exact | 2385 NW CABRILLO CT, ROSEBURG, OR 97470 | 2385 NW CABRILLO CT, ROSEBURG, OR, 97471 |
| non_exact | 1985 ZONAL AVE, LOS ANGELES, CA 90089 | 1985 ZONAL AVE, LOS ANGELES, CA, 90033 |
| non_exact | 1786 MOON LAKE BLVD, HOFFMAN ESTATES, IL 60194 | 1786 MOON LAKE BLVD, HOFFMAN ESTATES, IL, 60169 |
| non_exact | 57 POST ST, SAN FRANCISCO, CA 94112 | 57 POST ST, SAN FRANCISCO, CA, 94104 |
| non_exact | 8811 TEEL PKWY, FRISCO, TX 75035 | 8811 TEEL PKWY, FRISCO, TX, 75036 |
| non_exact | 6890 Chestnut St, Gilroy, CA 95030 | 6890 CHESTNUT ST, GILROY, CA, 95020 |
| non_exact | 4900 S Monaco St Ste 210, Denver, CO 80237 | 4900 MONACO ST, DENVER, CO, 80022 |
| non_exact | 3291 LOMA VISTA RD, VENTURA, CA 93001 | 3291 LOMA VISTA RD, VENTURA, CA, 93003 |

