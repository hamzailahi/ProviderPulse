# Market concentration by ZIP3: build

Run 2026-11-20 by scripts/hhi-build.mjs. CMS Doctors and Clinicians released 2026-10-30.

- Clinicians: Medicare-enrolled, matched to the directory by NPI, specialty from their own NUCC code; placed in every ZIP3 where CMS lists a practice address.
- Firm: the clinician's most frequent Medicare billing group in that ZIP3; no group is a solo practice. HHI over clinician shares; ZIP3 x specialty cells under 10 clinicians get no figure.

- Cells written: 16,938 (unconcentrated 3,988, moderate 3,952, high 8,998)

| Specialty | ZIP3 areas with a figure | Highly concentrated |
|---|---|---|
| Primary care / family doctor | 889 | 190 (21%) |
| Mental health & counseling | 871 | 91 (10%) |
| Imaging & lab | 844 | 547 (65%) |
| Eye care | 821 | 160 (19%) |
| Physical & occupational therapy | 819 | 200 (24%) |
| Urgent care & emergency | 788 | 654 (83%) |
| General surgery | 776 | 511 (66%) |
| Heart / cardiology | 775 | 584 (75%) |
| Chiropractic | 741 | 11 (1%) |
| Orthopedics & sports injury | 717 | 517 (72%) |
| Women's health / OB-GYN | 716 | 479 (67%) |
| Brain & nerves / neurology | 657 | 497 (76%) |
| Cancer care / oncology | 604 | 520 (86%) |
| Foot & ankle / podiatry | 569 | 149 (26%) |
| Lung, breathing & sleep | 523 | 386 (74%) |
| Digestive / gastroenterology | 522 | 408 (78%) |
| Urology | 462 | 394 (85%) |
| Kidney / nephrology | 451 | 341 (76%) |
| Skin / dermatology | 444 | 227 (51%) |
| Pediatrics (children) | 441 | 182 (41%) |
| Ear, nose & throat | 378 | 294 (78%) |
| Hearing & audiology | 374 | 239 (64%) |
| Pain management | 359 | 115 (32%) |
| Infectious disease | 315 | 246 (78%) |
| Diabetes & hormones | 300 | 205 (68%) |
| Speech & language therapy | 298 | 125 (42%) |
| Care coordination & community health | 279 | 29 (10%) |
| Plastic & reconstructive surgery | 267 | 131 (49%) |
| Nutrition & dietitian | 251 | 112 (45%) |
| Arthritis / rheumatology | 244 | 169 (69%) |
| Allergy & immunology | 174 | 107 (61%) |
| Dental | 131 | 62 (47%) |
| Hospice & palliative care | 121 | 101 (83%) |
| Genetics & genetic counseling | 16 | 15 (94%) |
| Behavior therapy (ABA) | 1 | 0 (0%) |
