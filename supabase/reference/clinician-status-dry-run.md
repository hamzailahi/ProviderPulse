# Clinician status load: dry run

Run 2026-11-19 by scripts/dac-load.mjs. CMS Doctors and Clinicians file released 2026-10-30.

- File rows: 3,621,155; clinicians (NPIs): 1,640,076
- Directory clinicians read: 7,554,360
- Site split: a clinician at one site counts 1; at several (the larger of the file's practice addresses and NPPES primary + secondary) the main address keeps 0.6. Not in the file: NPPES alone.
- Supply at risk: share of clinicians in the file with a graduation year who graduated in 1991 or earlier (35+ years). Provider side only.

| Specialty | Listings | After site split | Change | In CMS file | Graduated 35+ years ago |
|---|---|---|---|---|---|
| Primary care / family doctor | 1,058,915 | 897,366 | -15.3% | 52.8% | 7.6% |
| Pediatrics (children) | 261,602 | 245,945 | -6.0% | 10.1% | 13.9% |
| Women's health / OB-GYN | 123,871 | 110,309 | -10.9% | 36.9% | 14.4% |
| Mental health & counseling | 1,608,448 | 1,529,137 | -4.9% | 14.2% | 11.5% |
| Dental | 296,706 | 288,170 | -2.9% | 1.2% | 18.2% |
| Eye care | 103,823 | 91,765 | -11.6% | 53.3% | 20.0% |
| Chiropractic | 104,608 | 100,782 | -3.7% | 38.2% | 19.4% |
| Physical & occupational therapy | 648,072 | 613,875 | -5.3% | 19.2% | 7.2% |
| Orthopedics & sports injury | 91,510 | 81,667 | -10.8% | 32.7% | 18.2% |
| Heart / cardiology | 56,416 | 44,314 | -21.5% | 71.6% | 28.7% |
| Skin / dermatology | 19,193 | 15,891 | -17.2% | 73.6% | 18.3% |
| Allergy & immunology | 6,433 | 5,452 | -15.3% | 59.3% | 29.2% |
| Lung, breathing & sleep | 28,446 | 24,378 | -14.3% | 49.3% | 24.2% |
| Digestive / gastroenterology | 27,029 | 21,792 | -19.4% | 69.4% | 25.4% |
| Kidney / nephrology | 15,219 | 12,280 | -19.3% | 72.7% | 22.1% |
| Diabetes & hormones | 14,877 | 12,697 | -14.7% | 54.1% | 20.7% |
| Cancer care / oncology | 37,895 | 30,664 | -19.1% | 66.4% | 20.7% |
| Arthritis / rheumatology | 8,777 | 7,231 | -17.6% | 66.3% | 22.5% |
| Brain & nerves / neurology | 49,769 | 41,777 | -16.1% | 56.2% | 18.8% |
| Ear, nose & throat | 15,114 | 12,525 | -17.1% | 65.1% | 22.1% |
| Urology | 16,493 | 13,308 | -19.3% | 67.5% | 21.8% |
| Foot & ankle / podiatry | 24,630 | 20,616 | -16.3% | 67.8% | 20.2% |
| Pain management | 11,851 | 9,546 | -19.4% | 68.4% | 21.5% |
| Plastic & reconstructive surgery | 12,694 | 10,997 | -13.4% | 52.3% | 22.3% |
| Speech & language therapy | 218,952 | 212,857 | -2.8% | 3.9% | 5.0% |
| Nutrition & dietitian | 80,207 | 77,283 | -3.6% | 9.0% | 8.5% |
| Acupuncture, massage & naturopathy | 118,234 | 116,159 | -1.8% | 0.2% | 17.5% |
| Urgent care & emergency | 89,342 | 76,548 | -14.3% | 51.2% | 8.1% |
| Imaging & lab | 97,309 | 79,148 | -18.7% | 58.4% | 21.4% |
| Pharmacy | 345,548 | 341,256 | -1.2% | 0.0% | 3.6% |
| Home health & in-home care | 254,107 | 252,509 | -0.6% | 0.0% | 10.3% |
| Nursing & assisted living | 19,584 | 19,448 | -0.7% | 0.2% | 12.1% |
| Medical equipment & supplies | 10,946 | 10,814 | -1.2% | 0.1% | 27.3% |
| Hearing & audiology | 36,894 | 34,130 | -7.5% | 26.1% | 7.1% |
| Behavior therapy (ABA) | 732,650 | 721,292 | -1.6% | 0.0% | 2.0% |
| Care coordination & community health | 419,295 | 411,467 | -1.9% | 2.0% | 9.2% |
| General surgery | 83,751 | 69,656 | -16.8% | 56.2% | 15.7% |
| Infectious disease | 12,491 | 10,404 | -16.7% | 63.3% | 20.0% |
| Genetics & genetic counseling | 8,557 | 8,181 | -4.4% | 7.3% | 25.0% |
| Hospice & palliative care | 5,108 | 4,240 | -17.0% | 55.8% | 7.9% |

Specialties can share a code, so the column totals overlap and are not shown.

## Applied 2026-11-19

- 1640076 clinicians stored in clinician_status.
