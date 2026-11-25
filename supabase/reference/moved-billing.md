# Moved clinicians: where they billed Medicare

Run 2026-11-25 by scripts/moved-billing.mjs (scripts/moved-billing.sh). Read only.

- Moved clinicians (address_source = 'medicare'): 138,150
- Billing file: Medicare Physician & Other Practitioners - by Provider : 2024-12-01 (2024); rows read: 1,296,739
- Found in the billing file: 85,334 (61.8%); not found: 52,816 (did not bill traditional Medicare under their own NPI that year, or billed only through a group; not read as inactive)

The billing file holds one practice address per NPI, so each clinician is classed by that one address.

| Billing address | By ZIP | Share of found | By state | Share of found |
|---|---|---|---|---|
| At the new (Medicare) address only | 1,652 | 1.9% | 3,394 | 4.0% |
| At the old (NPPES) address only | 80,105 | 93.9% | 80,698 | 94.6% |
| Same for both | 0 | 0.0% | 0 | 0.0% |
| Neither | 3,577 | 4.2% | 1,242 | 1.5% |
