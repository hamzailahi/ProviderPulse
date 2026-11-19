# Clinician status load: dry run

Run 2026-11-19 by scripts/dac-load.mjs. CMS Doctors and Clinicians file released 2026-10-30.

- File rows: 3,621,155; clinicians (NPIs): 1,640,076
- Directory clinicians read: 7,554,360
- Site split: each clinician counts 1 / sites, sites = the larger of the file's practice addresses and NPPES (primary + secondary), capped at 5. Not in the file: NPPES alone.
- Supply at risk: share of clinicians in the file with a graduation year who graduated in 1991 or earlier (35+ years). Provider side only.

| Specialty | Listings | After site split | Change | In CMS file | Graduated 35+ years ago |
|---|---|---|---|---|---|
| Primary care / family doctor | 1,058,915 | 814,965 | -23.0% | 52.8% | 7.6% |
| Pediatrics (children) | 261,602 | 239,524 | -8.4% | 10.1% | 13.9% |
| Women's health / OB-GYN | 123,871 | 103,723 | -16.3% | 36.9% | 14.4% |
| Mental health & counseling | 1,608,448 | 1,500,004 | -6.7% | 14.2% | 11.5% |
| Dental | 296,706 | 285,103 | -3.9% | 1.2% | 18.2% |
| Eye care | 103,823 | 86,379 | -16.8% | 53.3% | 20.0% |
| Chiropractic | 104,608 | 99,570 | -4.8% | 38.2% | 19.4% |
| Physical & occupational therapy | 648,072 | 600,874 | -7.3% | 19.2% | 7.2% |
| Orthopedics & sports injury | 91,510 | 76,139 | -16.8% | 32.7% | 18.2% |
| Heart / cardiology | 56,416 | 36,647 | -35.0% | 71.6% | 28.7% |
| Skin / dermatology | 19,193 | 14,296 | -25.5% | 73.6% | 18.3% |
| Allergy & immunology | 6,433 | 4,980 | -22.6% | 59.3% | 29.2% |
| Lung, breathing & sleep | 28,446 | 22,018 | -22.6% | 49.3% | 24.2% |
| Digestive / gastroenterology | 27,029 | 18,797 | -30.5% | 69.4% | 25.4% |
| Kidney / nephrology | 15,219 | 10,631 | -30.1% | 72.7% | 22.1% |
| Diabetes & hormones | 14,877 | 11,570 | -22.2% | 54.1% | 20.7% |
| Cancer care / oncology | 37,895 | 26,592 | -29.8% | 66.4% | 20.7% |
| Arthritis / rheumatology | 8,777 | 6,395 | -27.1% | 66.3% | 22.5% |
| Brain & nerves / neurology | 49,769 | 37,275 | -25.1% | 56.2% | 18.8% |
| Ear, nose & throat | 15,114 | 11,157 | -26.2% | 65.1% | 22.1% |
| Urology | 16,493 | 11,400 | -30.9% | 67.5% | 21.8% |
| Foot & ankle / podiatry | 24,630 | 18,623 | -24.4% | 67.8% | 20.2% |
| Pain management | 11,851 | 8,295 | -30.0% | 68.4% | 21.5% |
| Plastic & reconstructive surgery | 12,694 | 10,134 | -20.2% | 52.3% | 22.3% |
| Speech & language therapy | 218,952 | 210,840 | -3.7% | 3.9% | 5.0% |
| Nutrition & dietitian | 80,207 | 76,229 | -5.0% | 9.0% | 8.5% |
| Acupuncture, massage & naturopathy | 118,234 | 115,527 | -2.3% | 0.2% | 17.5% |
| Urgent care & emergency | 89,342 | 70,533 | -21.1% | 51.2% | 8.1% |
| Imaging & lab | 97,309 | 66,623 | -31.5% | 58.4% | 21.4% |
| Pharmacy | 345,548 | 339,927 | -1.6% | 0.0% | 3.6% |
| Home health & in-home care | 254,107 | 252,016 | -0.8% | 0.0% | 10.3% |
| Nursing & assisted living | 19,584 | 19,405 | -0.9% | 0.2% | 12.1% |
| Medical equipment & supplies | 10,946 | 10,770 | -1.6% | 0.1% | 27.3% |
| Hearing & audiology | 36,894 | 32,991 | -10.6% | 26.1% | 7.1% |
| Behavior therapy (ABA) | 732,650 | 717,400 | -2.1% | 0.0% | 2.0% |
| Care coordination & community health | 419,295 | 408,920 | -2.5% | 2.0% | 9.2% |
| General surgery | 83,751 | 61,605 | -26.4% | 56.2% | 15.7% |
| Infectious disease | 12,491 | 9,271 | -25.8% | 63.3% | 20.0% |
| Genetics & genetic counseling | 8,557 | 8,015 | -6.3% | 7.3% | 25.0% |
| Hospice & palliative care | 5,108 | 3,801 | -25.6% | 55.8% | 7.9% |

Specialties can share a code, so the column totals overlap and are not shown.
