# Pins outside their own ZIP, 2026-11-24

A pin counts as away when it lies more than 0.5 miles outside the listing's own 2020 Census ZIP area (ZCTA). A flagged listing is geocoded again. If the Census finds the same address in another ZIP and the current pin sits within a quarter mile of it, the ZIP on the listing is the mistake and the pin is kept. Otherwise a new point in the listing's own ZIP replaces it, or, failing that, the listing loses its pin and stays listed without one. A ZIP with no Census area cannot be judged and is left alone.

- Pinned listings checked: 10,627,276
- Inside or within 0.5 mi of their ZIP: 10,473,593
- ZIP has no Census area (not judged): 96,747
- **Away from their ZIP: 56,936**
- This run, 56,936 tried: keep (wrong ZIP, right pin) 17,204, move 270, unpin 3,737; written: clinics unpin=817 clinics move=34 provider_individuals unpin=2445 provider_individuals move=224 clinic_secondary_locations unpin=475 clinic_secondary_locations move=12 

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

Decisions in this run by state (top 12 by unpins): TX move 3 / unpin 443, MA move 2 / unpin 379, CA move 6 / unpin 286, FL move 50 / unpin 204, NY move 14 / unpin 185, AZ move 159 / unpin 182, AK move 0 / unpin 162, PR move 0 / unpin 151, GA move 0 / unpin 127, NC move 1 / unpin 114, NM move 0 / unpin 99, OK move 2 / unpin 97

## Listed in 38017: 2 away

| Table | Address | City | Miles outside |
|---|---|---|---|
| provider_individuals | 6025 WALNUT GROVE | MEMPHIS | 7.49 |
| provider_individuals | 577 N. GERMANTOWN RD. | CORDOVA | 4.39 |

## Why the unpins (and what is left alone)

| Reason | Listings |
|---|---|
| left alone (under the unpin distance, or Minnesota) | 35,725 |
| no Census match | 2,126 |
| Census matched a different street | 1,610 |
| address found in another ZIP, pin 0.25-1 mi from it | 1 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| clinics | 8,381 | 803 | 7,578 | 0 |
| provider_individuals | 41,856 | 4,569 | 37,287 | 0 |
| clinic_secondary_locations | 6,699 | 612 | 6,087 | 0 |

Census exact 5,623, Census same address written another way 361 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 24,053, a fuzzy (non-exact) match 26,282, matched in another ZIP 0, several equal matches 617.

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

