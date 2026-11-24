# Pins outside their own ZIP, 2026-11-24

A pin counts as away when it lies more than 0.5 miles outside the listing's own 2020 Census ZIP area (ZCTA). A flagged listing is geocoded again. If the Census finds the same address in another ZIP and the current pin sits within a quarter mile of it, the ZIP on the listing is the mistake and the pin is kept. Otherwise a new point in the listing's own ZIP replaces it, or, failing that, the listing loses its pin and stays listed without one. A ZIP with no Census area cannot be judged and is left alone.

- Pinned listings checked: 10,623,539
- Inside or within 0.5 mi of their ZIP: 10,473,863
- ZIP has no Census area (not judged): 96,747
- **Away from their ZIP: 52,929**
- This run, 1,400 tried: keep (wrong ZIP, right pin) 507, move 514, unpin 4; written: clinics unpin=1 clinics move=33 provider_individuals unpin=3 provider_individuals move=406 clinic_secondary_locations move=75 

| How far outside | Listings |
|---|---|
| 0.5-2 mi | 23,339 |
| 2-10 mi | 27,281 |
| 10-50 mi | 1,509 |
| 50+ mi | 800 |

| Table | Away |
|---|---|
| clinics | 7,530 |
| provider_individuals | 39,187 |
| clinic_secondary_locations | 6,212 |

States with the most: MN 10,386, CA 5,712, TX 3,343, FL 3,086, NY 2,859, PR 2,123, CO 1,807, OH 1,608, GA 1,509, PA 1,475, NJ 1,472, MI 1,378

Decisions in this run by state (top 12 by unpins): NJ move 8 / unpin 1, MS move 7 / unpin 1, DE move 2 / unpin 1, VA move 1 / unpin 1, MN move 261 / unpin 0, OH move 26 / unpin 0, NE move 6 / unpin 0, TX move 24 / unpin 0, FL move 13 / unpin 0, MA move 9 / unpin 0, IL move 3 / unpin 0, AR move 4 / unpin 0

## Listed in 38017: 2 away

| Table | Address | City | Miles outside |
|---|---|---|---|
| provider_individuals | 6025 WALNUT GROVE | MEMPHIS | 7.49 |
| provider_individuals | 577 N. GERMANTOWN RD. | CORDOVA | 4.39 |

## Why the unpins (and what is left alone)

| Reason | Listings |
|---|---|
| moved to the Azure building | 514 |
| left alone (under the unpin distance, or Minnesota) | 375 |
| address found in another ZIP, pin 0.25-1 mi from it | 2 |
| address found in another ZIP, pin 1-5 mi from it | 1 |
| address found in another ZIP, pin 5+ mi from it | 1 |

## Geocoding

| Table | Tried | Placed | Left unplaced | Geocoder failed |
|---|---|---|---|---|
| clinics | 209 | 18 | 191 | 0 |
| provider_individuals | 1,036 | 102 | 934 | 0 |
| clinic_secondary_locations | 155 | 19 | 136 | 0 |

Census exact 132, Census same address written another way 7 (one direction word, an ordinal, a state route's spelling or a space; same house number and ZIP), Google 0 (off unless a key is passed); anything else keeps no coordinates.

Why the rest were not placed: no match 568, a fuzzy (non-exact) match 681, matched in another ZIP 0, several equal matches 12.

Examples (public listing addresses):

| Why | Listed | Census matched |
|---|---|---|
| non_exact | 1230 E COUGAR CREEK DR, MERIDIAN, ID 83642 | 1230 E COUGAR CREEK DR, MERIDIAN, ID, 83646 |
| non_exact | 1420 PLAZA DRIVE, WINSTON SALEM, NC 27106 | 1420 PLAZA DR, WINSTON SALEM, NC, 27103 |
| non_exact | 4502 MACCORKLE AVE SE, CHARLESTON, WV 25304 | 4502 MACCORKLE AVE, CHARLESTON, WV, 25309 |
| non_exact | 1205 S GRANGE AVE, SIOUX FALLS, SD 57103 | 1205 S GRANGE AVE, SIOUX FALLS, SD, 57105 |
| non_exact | 7200 Camino Real Ste 201, Boca Raton, FL 33433 | 7200 E CAM REAL, BOCA RATON, FL, 33432 |
| non_exact | 3925 MARTIN LUTHER KING BLVD STE 121, NORTH LAS VEGAS, NV 89086 | 3925 N MARTIN L KING BLVD, NORTH LAS VEGAS, NV, 89032 |
| non_exact | 1200 EL CAMINO REAL, SOUTH SAN FRANCISCO, CA 94080 | 1200 EL CAMINO DEL MAR, SAN FRANCISCO, CA, 94121 |
| non_exact | 405 Butterfly Gardens Dr, Columbus, OH 43215 | 405 GARDEN DR, COLUMBUS, OH, 43085 |
| non_exact | 46 PRINCE STREET, NEW HAVEN, CT 06519 | 46 PRINCE DR, NEW HAVEN, CT, 06524 |
| non_exact | 480 ALTA RD, SAN DIEGO, CA 92179 | 480 ALTA RD, SAN DIEGO, CA, 92158 |
| non_exact | 1820 S MASON RD STE 305, KATY, TX 77450 | 1820 MASON RD, KATY, TX, 77449 |
| non_exact | 29 BLACK COAL DRIVE, FORT WASHAKIE, WY 82516 | 29 BLACK COAL DR, FORT WASHAKIE, WY, 82514 |

Azure Maps: {"asked":1261,"placed":630,"failed":0,"not_sent":0,"miss_other_zip":336,"miss_low_confidence":207,"miss_not_an_address":8,"miss_other_house_number":13,"miss_not_rooftop":67}
