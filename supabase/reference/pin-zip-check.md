# Pins outside their own ZIP, 2026-11-24 (dry run: nothing written)

A pin counts as away when it lies more than 0.5 miles outside the listing's own 2020 Census ZIP area (ZCTA). A flagged listing is geocoded again. If the Census finds the same address in another ZIP and the current pin sits within a quarter mile of it, the ZIP on the listing is the mistake and the pin is kept. Otherwise a new point in the listing's own ZIP replaces it, or, failing that, the listing loses its pin and stays listed without one. A ZIP with no Census area cannot be judged and is left alone.

- Pinned listings checked: 10,627,276
- Inside or within 0.5 mi of their ZIP: 10,473,593
- ZIP has no Census area (not judged): 96,747
- **Away from their ZIP: 56,936**
- This run, 2,000 sampled: keep (wrong ZIP, right pin) 612, move 7, unpin 133

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

Decisions in this run by state (top 12 by unpins): MA move 0 / unpin 14, CA move 0 / unpin 12, TX move 0 / unpin 11, AZ move 4 / unpin 10, AK move 0 / unpin 8, PR move 0 / unpin 7, OK move 0 / unpin 7, NY move 1 / unpin 6, FL move 0 / unpin 6, GA move 0 / unpin 5, NM move 0 / unpin 4, PA move 1 / unpin 3

## Listed in 38017: 2 away

| Table | Address | City | Miles outside |
|---|---|---|---|
| provider_individuals | 6025 WALNUT GROVE | MEMPHIS | 7.49 |
| provider_individuals | 577 N. GERMANTOWN RD. | CORDOVA | 4.39 |

## Why the unpins (and what is left alone)

| Reason | Listings |
|---|---|
| left alone (under the unpin distance, or Minnesota) | 1,248 |
| no Census match | 90 |
| Census matched a different street | 43 |

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
| non_exact | 470 NORTH CLAYTON STREET, LAWRENCEVILLE, GA 30045 | 470 N CLAYTON ST, LAWRENCEVILLE, GA, 30046 |
| non_exact | 2808-II E MADISON STREET, SEATTLE, WA 98117 | 2808 E MADISON ST, SEATTLE, WA, 98112 |
| non_exact | 159 E. 125TH ST., NEW YORK, NY 10549 | 159 E 125TH ST, NEW YORK, NY, 10035 |
| non_exact | 1954 EAST HOUSTON STREET SUITE 208, SAN ANTONIO, TX 78204 | 1954 E HOUSTON ST, SAN ANTONIO, TX, 78202 |
| non_exact | 7 BLANCHARD CIR, WHEATON, IL 60187 | 7 BLANCHARD CIR, WHEATON, IL, 60189 |
| non_exact | 405 Butterfly Gardens Dr, Columbus, OH 43215 | 405 GARDEN DR, COLUMBUS, OH, 43085 |
| non_exact | 608 MIFFLIN ST, HUNTINGDON, PA 16657 | 608 MIFFLIN ST, HUNTINGDON, PA, 16652 |
| non_exact | 316 HADDON AVENUE, COLLINGSWOOD, NJ 80108 | 316 HADDON AVE, COLLINGSWOOD, NJ, 08108 |
| non_exact | 1760 E KEN PRATT BLVD STE 405, LONGMONT, CO 80504 | 1760 KEN PRATT BLVD, LONGMONT, CO, 80501 |
| non_exact | 2454 ABBEY WAY SE, SALEM, OR 97301 | 2454 ABBEY LN SE, SALEM, OR, 97317 |
| non_exact | 141 ELMWOOD AVENUE, CRANSTON, RI 02920 | 141 ELMWOOD AVE, CRANSTON, RI, 02907 |
| non_exact | 111 COLCHESTER AVE., BURLINGTON, VT 05041 | 111 COLCHESTER AVE, BURLINGTON, VT, 05401 |

